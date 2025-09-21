import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Simple request queue to prevent rate limiting
class RequestQueue {
  private queue: Array<() => Promise<unknown>> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private minInterval = 1000; // 1 second between requests

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift()!;

      // Ensure minimum interval between requests
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.minInterval) {
        await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastRequest));
      }

      this.lastRequestTime = Date.now();
      await request();
    }

    this.isProcessing = false;
  }
}

const claudeQueue = new RequestQueue();

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

    // Validate data freshness and quality based on actual data
    const dataValidation = validateDataQuality(stationData);
    if (!dataValidation.isValid) {
      return NextResponse.json({
        error: `Unable to provide analysis: ${dataValidation.reason}. Please try a different location with more recent data.`
      }, { status: 422 });
    }

    // Smart LLM validation that considers both query intent and actual data
    const llmValidation = await validateQueryAndData(query, stationData);
    if (!llmValidation.isValid) {
      return NextResponse.json({
        error: `${llmValidation.reason}`
      }, { status: 422 });
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
          let isClosed = false;

          // Function to safely write to controller with graceful disconnection handling
          const safeEnqueue = (data: string, context: string = '') => {
            if (isClosed) {
              console.log(`🔌 [ANALYZE] Client disconnected, skipping ${context}`);
              return false;
            }

            try {
              controller.enqueue(data);
              return true;
            } catch (error: unknown) {
              if (error instanceof Error && error.message?.includes('Controller is already closed')) {
                console.log(`🔌 [ANALYZE] Client disconnected during ${context}`);
                isClosed = true;
                return false;
              } else {
                console.error(`💥 [ANALYZE] Unexpected controller error during ${context}:`, error);
                isClosed = true;
                return false;
              }
            }
          };

          // Override the close method to track state
          const originalClose = controller.close.bind(controller);
          controller.close = () => {
            if (!isClosed) {
              isClosed = true;
              originalClose();
            }
          };

          (async () => {
            try {
              // Send chart data first
              const chartMessage = {
                type: 'charts',
                data: chartData
              };
              if (!safeEnqueue(`data: ${JSON.stringify(chartMessage)}\n\n`, 'chart data')) {
                return; // Client disconnected
              }

              // Stream the quick Haiku analysis first
              let haikusAnalysis = '';
              for await (const chunk of analysisStream) {
                haikusAnalysis += chunk;
                const analysisMessage = {
                  type: 'analysis',
                  content: chunk
                };
                if (!safeEnqueue(`data: ${JSON.stringify(analysisMessage)}\n\n`, 'analysis chunk')) {
                  break; // Client disconnected, stop streaming
                }
              }

              // Generate detailed Sonnet summary after Haiku analysis completes
              console.log('🎯 [ANALYZE] Generating detailed Sonnet summary...');
              const sonnetSummary = await generateSonnetSummary(query, stationData, haikusAnalysis);

              const summaryMessage = {
                type: 'summary',
                content: sonnetSummary
              };

              // Send summary and close stream
              if (safeEnqueue(`data: ${JSON.stringify(summaryMessage)}\n\n`, 'summary')) {
                controller.close();
              }
              // If client disconnected, controller is already closed
            } catch (error) {
              console.error('💥 [ANALYZE] Streaming error:', error);
              if (!isClosed) {
                try {
                  controller.error(error);
                } catch {
                  console.log('🔌 [ANALYZE] Client disconnected during error handling');
                }
              }
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
    const stream = await claudeQueue.add(() => anthropic.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: prompt
      }],
      stream: true
    }));

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

async function validateQueryAndData(query: string, stationData: StationData[]): Promise<{ isValid: boolean; reason?: string }> {
  console.log('🤖 [VALIDATE] Running smart query and data validation...');

  // Prepare comprehensive data summary
  const currentDate = new Date().toISOString().split('T')[0];
  const dataAnalysis = analyzeDataTimestamps(stationData);

  const dataInfo = stationData.map(station => {
    const points = station.data;
    if (points.length === 0) return `${station.station_name}: No data`;

    const timestamps = points.map(p => p.timestamp).sort();
    const oldest = timestamps[0];
    const newest = timestamps[timestamps.length - 1];

    return `${station.station_name}: ${points.length} points from ${oldest} to ${newest}`;
  }).join('\n');

  const prompt = PROMPTS['QUERY_DATA_VALIDATION_PROMPT']
    ?.replace('{currentDate}', currentDate)
    ?.replace('{query}', query)
    ?.replace('{dataInfo}', dataInfo)
    ?.replace('{dataAge}', Math.round(dataAnalysis.dataAgeHours).toString())
    ?.replace('{totalPoints}', dataAnalysis.totalPoints.toString()) ||
    `Today: ${currentDate}. Query: "${query}". Data: ${dataInfo}. Age: ${Math.round(dataAnalysis.dataAgeHours)}h old.`;

  try {
    const response = await claudeQueue.add(() => anthropic.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: prompt
      }]
    }));

    const content = response.content[0];
    if (content.type === 'text') {
      const text = content.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const validation = JSON.parse(jsonMatch[0]);
        console.log('✅ [VALIDATE] Smart validation result:', validation);
        return {
          isValid: validation.isValid,
          reason: validation.reason
        };
      }
    }

    return { isValid: true }; // Default to valid if parsing fails
  } catch (error) {
    console.error('💥 [VALIDATE] Smart validation error:', error);
    return { isValid: true }; // Default to valid if validation fails
  }
}

function analyzeDataTimestamps(stationData: StationData[]): { dataAgeHours: number; totalPoints: number; timeSpanHours: number } {
  const now = new Date();
  const allTimestamps: Date[] = [];
  let totalPoints = 0;

  stationData.forEach(station => {
    station.data.forEach(point => {
      allTimestamps.push(new Date(point.timestamp));
      totalPoints++;
    });
  });

  if (totalPoints === 0) {
    return { dataAgeHours: 0, totalPoints: 0, timeSpanHours: 0 };
  }

  allTimestamps.sort((a, b) => b.getTime() - a.getTime());
  const newestData = allTimestamps[0];
  const oldestData = allTimestamps[allTimestamps.length - 1];

  const dataAgeHours = (now.getTime() - newestData.getTime()) / (1000 * 60 * 60);
  const timeSpanHours = (newestData.getTime() - oldestData.getTime()) / (1000 * 60 * 60);

  return { dataAgeHours, totalPoints, timeSpanHours };
}

// Legacy function (keeping for backwards compatibility)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function validateDataWithLLM(query: string, stationData: StationData[]): Promise<{ isValid: boolean; reason?: string }> {
  console.log('🤖 [VALIDATE] Running LLM data validation...');

  // Prepare data info for validation
  const dataInfo = stationData.map(station => {
    const points = station.data;
    if (points.length === 0) return `${station.station_name}: No data`;

    const timestamps = points.map(p => p.timestamp);
    const oldest = timestamps[0];
    const newest = timestamps[timestamps.length - 1];

    return `${station.station_name}: ${points.length} points from ${oldest} to ${newest}`;
  }).join('\n');

  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const prompt = PROMPTS['DATA_VALIDATION_PROMPT']
    ?.replace('{dataInfo}', dataInfo)
    ?.replace('{query}', query) ||
    `Today's date: ${currentDate}. Validate this weather data for query "${query}": ${dataInfo}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const text = content.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const validation = JSON.parse(jsonMatch[0]);
        console.log('✅ [VALIDATE] LLM validation result:', validation);
        return {
          isValid: validation.isValid,
          reason: validation.reason
        };
      }
    }

    return { isValid: true }; // Default to valid if parsing fails
  } catch (error) {
    console.error('💥 [VALIDATE] LLM validation error:', error);
    return { isValid: true }; // Default to valid if validation fails
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
    const response = await claudeQueue.add(() => anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    }));

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

interface DataValidationResult {
  isValid: boolean;
  reason?: string;
  dataAge: number; // hours since newest data
  totalPoints: number;
}

function validateDataQuality(stationData: StationData[]): DataValidationResult {
  console.log('🔍 [VALIDATE] Checking data quality and freshness...');

  const now = new Date();
  // const TWO_WEEKS_AGO = 14 * 24 * 60 * 60 * 1000; // 2 weeks in milliseconds
  // const ONE_WEEK_AGO = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds

  const allTimestamps: Date[] = [];
  let totalPoints = 0;

  // Collect all timestamps from all stations
  stationData.forEach(station => {
    station.data.forEach(point => {
      allTimestamps.push(new Date(point.timestamp));
      totalPoints++;
    });
  });

  if (totalPoints === 0) {
    return { isValid: false, reason: "No data points available", dataAge: 0, totalPoints: 0 };
  }

  // Sort timestamps to find newest and oldest
  allTimestamps.sort((a, b) => b.getTime() - a.getTime());
  const newestData = allTimestamps[0];
  const oldestData = allTimestamps[allTimestamps.length - 1];

  const dataAge = (now.getTime() - newestData.getTime()) / (1000 * 60 * 60); // hours
  const dataSpan = newestData.getTime() - oldestData.getTime(); // milliseconds

  console.log('📊 [VALIDATE] Data summary:', {
    totalPoints,
    newestData: newestData.toISOString(),
    dataAgeHours: Math.round(dataAge),
    dataSpanDays: Math.round(dataSpan / (1000 * 60 * 60 * 24))
  });

  // Only reject if data is extremely old (more than 1 year - extremely lenient)
  if (dataAge > 365 * 24) {
    return {
      isValid: false,
      reason: `Data is over a year old (${Math.round(dataAge / 24)} days). Please try a different location`,
      dataAge,
      totalPoints
    };
  }

  // Check if we have any data at all (very minimal requirement)
  if (totalPoints < 1) {
    return {
      isValid: false,
      reason: `No data points available`,
      dataAge,
      totalPoints
    };
  }

  // Warn if data is getting quite old (30+ days old)
  if (dataAge > 30 * 24) {
    console.log('⚠️ [VALIDATE] Data is getting stale but still usable');
  }

  console.log('✅ [VALIDATE] Data quality acceptable');
  return { isValid: true, dataAge, totalPoints };
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