import { NextResponse } from 'next/server';

const WINDBORNE_API_BASE = "https://sfc.windbornesystems.com";

// Example response: {"points": [{"timestamp": "2025-08-29 23:53", "temperature": 71.0, "wind_x": -1.3680805733026744, "wind_y": 3.7587704831436337, "dewpoint": 67.0, "pressure": 1016.3, "precip": null}, ...]}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ stationId: string }> }
) {
  try {
    const { stationId } = await params;
    const response = await fetch(
      `${WINDBORNE_API_BASE}/historical_weather?station=${stationId}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching historical weather:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical weather' },
      { status: 500 }
    );
  }
}