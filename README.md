# WindSearch

Ask about weather in plain English. Get real data from actual weather stations.

## [🌤️ TRY HERE](https://windsearch-gm6x.vercel.app/)

![WindSearch Demo](https://github.com/lucasliao0403/windsearch/blob/main/public/windsearch.gif)


## What it does

Ask "weather in San Francisco" and it finds nearby weather stations, pulls their latest readings, and explains what's happening. Shows real measurements, not forecasts.

- Natural language weather queries with conversational follow-ups
- Real-time data from global weather stations
- AI analysis with quick insights and detailed summaries
- Interactive charts showing temperature, pressure, and wind trends
- Smart context awareness for follow-up questions
- Perplexity-style interface that moves search to bottom after first query
- Performance optimized with debouncing and memory management
- Lenient data validation that works with historical data

## How it works

1. Extract location from your query using Claude AI (with conversation context)
2. Find coordinates and nearest weather stations
3. Pull real-time data from Windborne Systems API
4. Stream quick analysis, then generate detailed markdown summary
5. Display interactive charts showing trends across stations
6. Maintain conversation history for intelligent follow-up questions
7. Handle data with LLM validation for older measurements

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
