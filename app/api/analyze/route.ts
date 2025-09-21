import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const WINDBORNE_API_BASE = "https://sfc.windbornesystems.com";

// Load prompts from file
const PROMPTS: Record<string, string> = {};
try {
  const promptsPath = path.join(process.cwd(), 'prompts.txt');
  const promptsData = fs.readFileSync(promptsPath, 'utf8');
  const sections = promptsData.split('## ').slice(1);
  sections.forEach(section => {
    const lines = section.split('\n');
    const key = lines[0];
    const content = lines.slice(1).join('\n').trim();
    PROMPTS[key] = content;
  });
} catch (error) {
  console.error('Failed to load prompts:', error);
}

interface WeatherPoint {
  timestamp: string;
  temperature: number;
  wind_x: number;
  wind_y: number;
  dewpoint: number;
  pressure: number;
  precip: number | null;
}

interface StationData {
  station_id: string;
  station_name: string;
  data: WeatherPoint[];
}

interface StationRequest {
  station_id: string;
  station_name: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

export async function POST(request: Request) {
  console.log('📊 [ANALYZE] Starting weather data analysis');

  try {
    const { query, stations }: { query: string; stations: StationRequest[] } = await request.json();
    console.log('📥 [ANALYZE] Received query:', query);
    console.log('📍 [ANALYZE] Stations to analyze:', stations.length);

    if (!stations || stations.length === 0) {
      return NextResponse.json({ error: 'No stations provided' }, { status: 400 });
    }

    // Step 1: Fetch weather data for all stations
    console.log('🌤️ [ANALYZE] Fetching weather data for stations...');
    const stationDataPromises = stations.map(async (station: StationRequest) => {
      try {
        const response = await fetch(
          `${WINDBORNE_API_BASE}/historical_weather?station=${station.station_id}`
        );

        if (!response.ok) {
          console.log(`⚠️ [ANALYZE] Failed to fetch data for ${station.station_id}`);
          return null;
        }

        const data = await response.json();
        return {
          station_id: station.station_id,
          station_name: station.station_name,
          data: data.points || []
        };
      } catch (error) {
        console.error(`💥 [ANALYZE] Error fetching data for ${station.station_id}:`, error);
        return null;
      }
    });

    const stationData: StationData[] = (await Promise.all(stationDataPromises))
      .filter(Boolean) as StationData[];

    console.log('✅ [ANALYZE] Successfully fetched data for', stationData.length, 'stations');

    if (stationData.length === 0) {
      return NextResponse.json({ error: 'No weather data available' }, { status: 404 });
    }

    // Step 2: Generate analysis summary using streaming LLM
    console.log('🤖 [ANALYZE] Generating LLM analysis...');
    const analysisStream = await generateAnalysisStream(query, stationData);

    // Step 3: Prepare chart data
    console.log('📈 [ANALYZE] Preparing chart data...');
    const chartData = prepareChartData(stationData);

    return new Response(
      new ReadableStream({
        start(controller) {
          (async () => {
            try {
              // Send chart data first
              const chartMessage = {
                type: 'charts',
                data: chartData
              };
              controller.enqueue(`data: ${JSON.stringify(chartMessage)}\n\n`);

              // Stream the quick Haiku analysis first
              let haikusAnalysis = '';
              for await (const chunk of analysisStream) {
                haikusAnalysis += chunk;
                const analysisMessage = {
                  type: 'analysis',
                  content: chunk
                };
                controller.enqueue(`data: ${JSON.stringify(analysisMessage)}\n\n`);
              }

              // Generate detailed Sonnet summary after Haiku analysis completes
              console.log('🎯 [ANALYZE] Generating detailed Sonnet summary...');
              const sonnetSummary = await generateSonnetSummary(query, stationData, haikusAnalysis);

              const summaryMessage = {
                type: 'summary',
                content: sonnetSummary
              };
              controller.enqueue(`data: ${JSON.stringify(summaryMessage)}\n\n`);

              controller.close();
            } catch (error) {
              console.error('💥 [ANALYZE] Streaming error:', error);
              controller.error(error);
            }
          })();
        }
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );

  } catch (error) {
    console.error('💥 [ANALYZE] Analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}

async function* generateAnalysisStream(query: string, stationData: StationData[]) {
  console.log('🤖 [LLM] Starting streaming analysis generation');

  // Prepare data summary for LLM
  const dataSummary = stationData.map(station => {
    const points = station.data;
    if (points.length === 0) return `${station.station_name}: No data available`;

    const temps = points.map(p => p.temperature).filter(t => t != null);
    const pressures = points.map(p => p.pressure).filter(p => p != null);
    const winds = points.map(p => Math.sqrt(p.wind_x * p.wind_x + p.wind_y * p.wind_y)).filter(w => w != null);

    const avgTemp = temps.length > 0 ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : 'N/A';
    const avgPressure = pressures.length > 0 ? (pressures.reduce((a, b) => a + b, 0) / pressures.length).toFixed(1) : 'N/A';
    const avgWind = winds.length > 0 ? (winds.reduce((a, b) => a + b, 0) / winds.length).toFixed(1) : 'N/A';

    return `${station.station_name} (${station.station_id}): ${points.length} readings, Avg Temp: ${avgTemp}°F, Avg Pressure: ${avgPressure} mb, Avg Wind: ${avgWind} m/s`;
  }).join('\n');

  const prompt = PROMPTS['WEATHER_ANALYSIS_PROMPT']
    ?.replace('{query}', query)
    ?.replace('{stationData}', dataSummary) ||
    `Analyze this weather data for the query "${query}". Provide insights, trends, and patterns from the station data:\n${dataSummary}`;

  console.log('📤 [LLM] Sending streaming request to Claude...');

  try {
    const stream = await anthropic.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: prompt
      }],
      stream: true
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && 'text' in chunk.delta) {
        yield chunk.delta.text;
      }
    }

    console.log('✅ [LLM] Streaming analysis completed');
  } catch (error) {
    console.error('💥 [LLM] Streaming analysis error:', error);
    yield 'Error generating analysis. Please try again.';
  }
}

async function generateSonnetSummary(query: string, stationData: StationData[], haikusAnalysis: string): Promise<string> {
  console.log('🎯 [SONNET] Starting detailed summary generation');

  // Prepare detailed data summary for Sonnet
  const detailedData = stationData.map(station => {
    const points = station.data;
    if (points.length === 0) return `${station.station_name}: No data available`;

    // Calculate comprehensive statistics
    const temps = points.map(p => p.temperature).filter(t => t != null);
    const pressures = points.map(p => p.pressure).filter(p => p != null);
    const winds = points.map(p => Math.sqrt(p.wind_x * p.wind_x + p.wind_y * p.wind_y)).filter(w => w != null);
    // const dewpoints = points.map(p => p.dewpoint).filter(d => d != null);

    const stats = {
      temperature: temps.length > 0 ? {
        avg: (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1),
        min: Math.min(...temps).toFixed(1),
        max: Math.max(...temps).toFixed(1),
        range: (Math.max(...temps) - Math.min(...temps)).toFixed(1)
      } : null,
      pressure: pressures.length > 0 ? {
        avg: (pressures.reduce((a, b) => a + b, 0) / pressures.length).toFixed(1),
        min: Math.min(...pressures).toFixed(1),
        max: Math.max(...pressures).toFixed(1),
        trend: pressures.length > 2 ? (pressures[pressures.length - 1] - pressures[0]).toFixed(1) : '0'
      } : null,
      wind: winds.length > 0 ? {
        avg: (winds.reduce((a, b) => a + b, 0) / winds.length).toFixed(1),
        max: Math.max(...winds).toFixed(1),
        gusts: winds.filter(w => w > 10).length
      } : null
    };

    return `${station.station_name} (${station.station_id}):
- Readings: ${points.length} over ${points.length > 0 ? Math.round((new Date(points[points.length - 1].timestamp).getTime() - new Date(points[0].timestamp).getTime()) / (1000 * 60 * 60)) : 0} hours
- Temperature: ${stats.temperature ? `${stats.temperature.avg}°F avg (${stats.temperature.min}-${stats.temperature.max}°F, range: ${stats.temperature.range}°F)` : 'N/A'}
- Pressure: ${stats.pressure ? `${stats.pressure.avg} mb avg (${stats.pressure.min}-${stats.pressure.max} mb, trend: ${stats.pressure.trend} mb)` : 'N/A'}
- Wind: ${stats.wind ? `${stats.wind.avg} m/s avg, max ${stats.wind.max} m/s, ${stats.wind.gusts} gusts >10 m/s` : 'N/A'}`;
  }).join('\n\n');

  const prompt = PROMPTS['SONNET_SUMMARY_PROMPT']
    ?.replace('{query}', query)
    ?.replace('{stationCount}', stationData.length.toString())
    ?.replace('{detailedData}', detailedData)
    ?.replace('{haikusAnalysis}', haikusAnalysis) ||
    `Provide a detailed meteorological analysis for: "${query}"\n\nData: ${detailedData}\n\nQuick Analysis: ${haikusAnalysis}`;

  console.log('📤 [SONNET] Sending detailed analysis request to Claude Sonnet...');

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      console.log('✅ [SONNET] Detailed summary generated successfully');
      return content.text;
    }

    console.log('⚠️ [SONNET] No text content in response');
    return 'Unable to generate detailed summary.';
  } catch (error) {
    console.error('💥 [SONNET] Summary generation error:', error);
    return 'Error generating detailed summary. Please try again.';
  }
}

interface ChartPoint extends WeatherPoint {
  station_id: string;
  station_name: string;
  wind_speed: number;
  timestamp_date: string;
}

function prepareChartData(stationData: StationData[]) {
  console.log('📊 [CHARTS] Preparing chart data for', stationData.length, 'stations');

  // Combine all data points with station info
  const allPoints: ChartPoint[] = [];

  stationData.forEach(station => {
    station.data.forEach(point => {
      allPoints.push({
        ...point,
        station_id: station.station_id,
        station_name: station.station_name,
        wind_speed: Math.sqrt(point.wind_x * point.wind_x + point.wind_y * point.wind_y),
        timestamp_date: new Date(point.timestamp).toISOString()
      });
    });
  });

  // Sort by timestamp
  allPoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  console.log('📈 [CHARTS] Prepared', allPoints.length, 'data points for charts');

  return {
    temperature: allPoints,
    pressure: allPoints,
    wind: allPoints,
    summary: {
      totalPoints: allPoints.length,
      stations: stationData.length,
      timeRange: allPoints.length > 0 ? {
        start: allPoints[0].timestamp,
        end: allPoints[allPoints.length - 1].timestamp
      } : null
    }
  };
}