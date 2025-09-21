import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Constants
const MAX_DISTANCE_KM = 200;
const MAX_STATION_COUNT = 20;

interface Station {
  station_id: string;
  latitude: number;
  longitude: number;
  elevation: number;
  station_name: string;
  station_network: string;
  timezone: string;
  distance?: number;
}

interface LocationRequest {
  location: string;
}

export async function POST(request: Request) {
  console.log('🔍 [SEARCH] Starting search request');

  try {
    const { query } = await request.json();
    console.log('📥 [SEARCH] Raw query received:', query);

    if (!query) {
      console.log('❌ [SEARCH] No query provided');
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Step 1: Extract location and station count from user query
    console.log('🤖 [SEARCH] Extracting location from query with LLM...');
    const locationRequest = await extractLocationFromQuery(query);
    console.log('📍 [SEARCH] Location extraction result:', locationRequest);

    if (!locationRequest.location) {
      console.log('❌ [SEARCH] Could not extract location from query');
      return NextResponse.json({ error: 'Could not extract location from query' }, { status: 400 });
    }

    // Step 2: Get coordinates for the location
    console.log('🌍 [SEARCH] Geocoding location:', locationRequest.location);
    const coordinates = await geocodeLocation(locationRequest.location);
    console.log('📊 [SEARCH] Geocoding result:', coordinates);

    if (!coordinates) {
      console.log('❌ [SEARCH] Could not geocode location');
      return NextResponse.json({ error: 'Could not geocode location' }, { status: 400 });
    }

    // Step 3: Load stations and find nearest neighbors
    console.log('📁 [SEARCH] Loading stations from JSON...');
    const allStations = loadStations();
    console.log('📈 [SEARCH] Total stations loaded:', allStations.length);

    console.log(`🎯 [SEARCH] Finding nearest ${MAX_STATION_COUNT} stations within ${MAX_DISTANCE_KM}km of (${coordinates.lat}, ${coordinates.lng})`);
    const nearestStations = findNearestStations(
      coordinates.lat,
      coordinates.lng,
      allStations,
      MAX_STATION_COUNT
    );
    console.log('✅ [SEARCH] Found nearest stations:', nearestStations.length);
    console.log('📋 [SEARCH] Station IDs:', nearestStations.map(s => s.station_id));

    // Step 4: Use LLM to filter relevant stations from the nearest set
    console.log('🤖 [SEARCH] Filtering relevant stations with LLM...');
    const relevantStations = await filterRelevantStations(query, nearestStations);
    console.log('✅ [SEARCH] LLM selected relevant stations:', relevantStations.length);
    console.log('📋 [SEARCH] Relevant station IDs:', relevantStations.map(s => s.station_id));

    const response = {
      query,
      extractedLocation: locationRequest.location,
      coordinates,
      nearestStationsFound: nearestStations.length,
      selectedStations: relevantStations,
    };

    console.log('🎉 [SEARCH] Search completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 [SEARCH] Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

function loadStations(): Station[] {
  console.log('📂 [LOAD] Loading stations from JSON file...');
  const stationsPath = path.join(process.cwd(), 'stations.json');
  console.log('📍 [LOAD] Stations file path:', stationsPath);

  const stationsData = fs.readFileSync(stationsPath, 'utf8');
  const stations = JSON.parse(stationsData);
  console.log('✅ [LOAD] Successfully loaded stations:', stations.length);

  return stations;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function findNearestStations(lat: number, lng: number, stations: Station[], count: number): Station[] {
  console.log(`🧮 [DISTANCE] Calculating distances for ${stations.length} stations from (${lat}, ${lng})`);

  const stationsWithDistance = stations
    .map(station => {
      const distance = calculateDistance(lat, lng, station.latitude, station.longitude);
      return {
        ...station,
        distance
      };
    });

  console.log('📏 [DISTANCE] Distance calculation completed');

  const withinRange = stationsWithDistance.filter(station => station.distance <= MAX_DISTANCE_KM);
  console.log(`🎯 [DISTANCE] Stations within ${MAX_DISTANCE_KM}km:`, withinRange.length);

  const sorted = withinRange.sort((a, b) => a.distance - b.distance);
  console.log('📊 [DISTANCE] Stations sorted by distance');

  const nearest = sorted.slice(0, count);
  console.log(`✅ [DISTANCE] Selected ${nearest.length} nearest stations`);

  if (nearest.length > 0) {
    console.log('📍 [DISTANCE] Closest station:', {
      id: nearest[0].station_id,
      name: nearest[0].station_name,
      distance: Math.round(nearest[0].distance * 100) / 100
    });

    if (nearest.length > 1) {
      console.log('📍 [DISTANCE] Farthest selected station:', {
        id: nearest[nearest.length - 1].station_id,
        name: nearest[nearest.length - 1].station_name,
        distance: Math.round(nearest[nearest.length - 1].distance * 100) / 100
      });
    }
  }

  return nearest;
}

async function extractLocationFromQuery(query: string): Promise<LocationRequest> {
  console.log('🤖 [LLM] Starting location extraction from query:', query);

  const prompt = `Extract the location from this weather query: "${query}"

Return ONLY a JSON object with this format:
{
  "location": "specific location name (city, region, landmark)"
}

Examples:
- "weather in San Francisco" → {"location": "San Francisco"}
- "temperature at Mount Everest" → {"location": "Mount Everest"}
- "what's the temp in Palo Alto this week" → {"location": "Palo Alto"}`;

  console.log('📤 [LLM] Sending request to Claude...');

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    console.log('📥 [LLM] Received response from Claude');
    console.log('🔍 [LLM] Response content:', response.content[0]);

    const content = response.content[0];
    if (content.type === 'text') {
      const text = content.text.trim();
      console.log('📝 [LLM] Raw response text:', text);

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('🎯 [LLM] Found JSON in response:', jsonMatch[0]);
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ [LLM] Parsed JSON:', parsed);

        const result = {
          location: parsed.location || ''
        };

        console.log('🏁 [LLM] Final extraction result:', result);
        return result;
      } else {
        console.log('❌ [LLM] No JSON found in response');
      }
    }

    console.log('⚠️ [LLM] Using fallback location extraction');
    return { location: '' };
  } catch (error) {
    console.error('💥 [LLM] Location extraction error:', error);
    return { location: '' };
  }
}

async function geocodeLocation(location: string): Promise<{lat: number, lng: number} | null> {
  console.log('🌍 [GEOCODE] Starting geocoding for location:', location);

  try {
    // Using OpenStreetMap Nominatim API (free, no API key required)
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
    console.log('🔗 [GEOCODE] API URL:', url);

    console.log('📤 [GEOCODE] Sending request to Nominatim API...');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WindSearch/1.0'
      }
    });

    if (!response.ok) {
      console.log('❌ [GEOCODE] API response not OK:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    console.log('📥 [GEOCODE] API response data:', data);

    if (data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
      console.log('✅ [GEOCODE] Successfully geocoded location:', result);
      console.log('📍 [GEOCODE] Found place:', data[0].display_name);
      return result;
    }

    console.log('❌ [GEOCODE] No results found for location');
    return null;
  } catch (error) {
    console.error('💥 [GEOCODE] Geocoding error:', error);
    return null;
  }
}

async function filterRelevantStations(query: string, stations: Station[]): Promise<Station[]> {
  console.log('🤖 [FILTER] Starting station relevance filtering');
  console.log('📊 [FILTER] Input stations:', stations.length);

  if (stations.length === 0) return [];

  const prompt = `Given this weather query: "${query}"

Here are the ${stations.length} nearest weather stations:
${stations.map((s, i) => `${i+1}. ${s.station_id}: ${s.station_name} (${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)}) ${s.distance ? s.distance.toFixed(1) + 'km' : ''}`).join('\n')}

Select the most relevant station numbers for this specific query. Consider:
- Query specificity (city vs region vs country)
- Geographic relevance and coverage
- Station location (coastal, inland, urban, rural, airport)
- Data quality indicators (network type, elevation)

Return ONLY a JSON array of station numbers (1-${stations.length}): [1, 3, 7, ...]`;

  console.log('📤 [FILTER] Sending relevance request to Claude...');

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    console.log('📥 [FILTER] Received response from Claude');
    console.log('🔍 [FILTER] Response content:', response.content[0]);

    const content = response.content[0];
    if (content.type === 'text') {
      const text = content.text.trim();
      console.log('📝 [FILTER] Raw response text:', text);

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        console.log('🎯 [FILTER] Found JSON array in response:', jsonMatch[0]);
        const stationNumbers = JSON.parse(jsonMatch[0]);
        console.log('✅ [FILTER] Parsed station numbers:', stationNumbers);

        const selectedStations = stationNumbers
          .filter((num: number) => num >= 1 && num <= stations.length)
          .map((num: number) => stations[num - 1])
          .filter(Boolean);

        console.log('🏁 [FILTER] Final selected stations:', selectedStations.length);
        return selectedStations;
      } else {
        console.log('❌ [FILTER] No JSON array found in response');
      }
    }

    console.log('⚠️ [FILTER] Using fallback: returning top 10 stations');
    return stations.slice(0, 10);
  } catch (error) {
    console.error('💥 [FILTER] Station filtering error:', error);
    return stations.slice(0, 10);
  }
}