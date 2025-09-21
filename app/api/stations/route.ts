import { NextResponse } from 'next/server';

const WINDBORNE_API_BASE = "https://sfc.windbornesystems.com";

// Example return: [{"station_id": "EHAK", "latitude": 55.39917, "longitude": 3.81028, "elevation": 50.0, "station_name": "A12-CPP HELIPAD OIL PLATFORM", "station_network": "NL__ASOS", "timezone": "Europe/London"}, ...]

export async function GET() {
  try {
    const response = await fetch(`${WINDBORNE_API_BASE}/stations`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching stations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stations' },
      { status: 500 }
    );
  }
}