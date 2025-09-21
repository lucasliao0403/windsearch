import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Location to timezone mapping
const LOCATION_TIMEZONES: Record<string, string[]> = {
  'california': ['America/Los_Angeles'],
  'new york': ['America/New_York'],
  'texas': ['America/Chicago'],
  'florida': ['America/New_York'],
  'alaska': ['America/Anchorage'],
  'hawaii': ['Pacific/Honolulu'],
  'europe': ['Europe/London', 'Europe/Paris', 'Europe/Helsinki', 'Europe/Mariehamn', 'Europe/Lisbon'],
  'asia': ['Asia/Tokyo', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Jakarta'],
  'australia': ['Australia/Sydney', 'Australia/Adelaide', 'Australia/Perth'],
  'east coast': ['America/New_York'],
  'west coast': ['America/Los_Angeles'],
  'midwest': ['America/Chicago'],
  'mountain': ['America/Denver'],
};

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Step 1: Extract relevant timezones from user query
    const relevantTimezones = extractTimezonesFromQuery(query.toLowerCase());

    // Step 2: Fetch stations matching those timezones
    const stationsResponse = await fetch('http://localhost:3000/api/stations');
    const allStations = await stationsResponse.json();

    const filteredStations = allStations.filter((station: any) =>
      relevantTimezones.length === 0 || relevantTimezones.includes(station.timezone)
    );

    // Step 3: Use LLM to select specific stations from filtered set
    const selectedStations = await selectStationsWithLLM(query, filteredStations);

    return NextResponse.json({
      query,
      relevantTimezones,
      stationsFound: filteredStations.length,
      selectedStations: selectedStations.slice(0, 10), // Limit to 10 stations
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

function extractTimezonesFromQuery(query: string): string[] {
  const timezones = new Set<string>();

  for (const [location, tzList] of Object.entries(LOCATION_TIMEZONES)) {
    if (query.includes(location)) {
      tzList.forEach(tz => timezones.add(tz));
    }
  }

  return Array.from(timezones);
}

async function selectStationsWithLLM(query: string, stations: any[]): Promise<any[]> {
  if (stations.length === 0) return [];

  // Limit stations sent to LLM to avoid token limits
  const stationsForLLM = stations.slice(0, 100);

  const prompt = `Given this weather query: "${query}"

Here are available weather stations:
${stationsForLLM.map(s => `- ${s.station_id}: ${s.station_name} (${s.latitude}, ${s.longitude})`).join('\n')}

Select the 5-10 most relevant station IDs for this query. Consider:
- Geographic relevance to the query
- Station location (coastal, inland, urban, rural)
- Coverage area for the requested analysis

Return only a JSON array of station IDs, like: ["STATION1", "STATION2", ...]`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const stationIds = JSON.parse(content.text);
      return stations.filter(s => stationIds.includes(s.station_id));
    }

    return stations.slice(0, 5); // Fallback
  } catch (error) {
    console.error('LLM selection error:', error);
    return stations.slice(0, 5); // Fallback
  }
}