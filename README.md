# WindSearch

A natural language weather search engine that fetches real-time data from global weather stations and provides AI-powered analysis.

## What it does

- **Natural language queries**: Ask about weather in plain English ("What's the weather like in San Francisco?")
- **Smart location extraction**: Uses Claude AI to parse locations from user queries
- **Nearest station discovery**: Finds the closest weather stations within 200km of the target location
- **Real-time data**: Fetches current weather data from the Windborne API
- **AI analysis**: Provides streaming weather insights using Claude Haiku and detailed summaries with Claude Sonnet
- **Interactive charts**: Visualizes temperature, pressure, and wind data with Recharts

## How it works

1. **Query Processing**: Claude extracts location from natural language input
2. **Geocoding**: OpenStreetMap Nominatim API converts location to coordinates
3. **Station Selection**: Finds nearest weather stations and uses AI to filter most relevant ones
4. **Data Fetching**: Retrieves real-time weather data from Windborne Systems API
5. **Analysis**: Streams quick insights with Claude Haiku, then generates detailed analysis with Claude Sonnet
6. **Visualization**: Charts display weather trends across all selected stations

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS 4
- **Charts**: Recharts
- **AI**: Anthropic Claude (Haiku + Sonnet)
- **APIs**: Windborne Systems (weather data), OpenStreetMap Nominatim (geocoding)
- **Deployment**: Vercel-ready

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
