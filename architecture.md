# WindSearch Architecture

## High-Level Overview
WindSearch transforms natural language weather queries into targeted station data retrieval through a 3-stage pipeline:

1. **NLP → Location** - LLM extracts specific location from user query ("temp in Palo Alto")
2. **Location → Coordinates** - Geocoding API converts location to lat/lng coordinates
3. **Coordinates → Stations** - Distance calculation finds nearest weather stations within 200km

**Example Flow:**
```
"What's the weather in San Francisco?"
→ LLM extracts "San Francisco"
→ Geocode to (37.7749, -122.4194)
→ Find 10 nearest stations within 200km
→ Return station data with distances
```

## Detailed Architecture

## Core Components

### 1. Query Processing
- **LLM Location Extraction**: Claude Haiku extracts location name and requested station count from natural language queries
- **Geocoding**: OpenStreetMap Nominatim API converts location names to precise coordinates
- **Distance Calculation**: Haversine formula finds weather stations within configurable radius (200km default)
- **Nearest Neighbors**: Sorts stations by distance and returns top N results

### 2. Data Pipeline
- **Station Database**: 54k+ weather stations loaded from stations.json with lat/lng, elevation, timezone metadata
- **Historical Weather API**: Retrieves time-series data (temperature, wind, pressure, precipitation) for selected stations
- **Data Aggregation**: Combines multi-station data for analysis and visualization

### 3. AI Layer
- **Query Understanding**: Claude Haiku extracts location entities and station count preferences from natural language
- **Geographic Intelligence**: Precise coordinate-based station selection eliminates ambiguity of timezone approximations
- **Summary Generation**: AI-generated text insights from aggregated weather data (future)

### 4. Response Format
- **Text Summaries**: Natural language explanations of weather patterns and trends
- **Interactive Charts**: Temperature, wind, and pressure visualizations over time
- **Station Context**: Display of selected stations with geographic information

## Technology Stack
- **Frontend**: Next.js with TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **AI**: Anthropic Claude (Haiku model for speed)
- **Data Source**: Windborne weather station network
- **Visualization**: TBD charting library

## Example Queries
- "What's the temperature in California this week?"
- "Compare wind patterns between East and West coast"
- "Show pressure trends across Texas"
- "European weather conditions today"

## Current Status
✅ LLM-powered location extraction from natural language queries
✅ Geocoding API integration (OpenStreetMap Nominatim)
✅ Geographic distance calculation and nearest neighbor search
✅ Smart station selection with configurable radius and count
✅ Natural language search interface
🔄 Weather data retrieval and aggregation
🔄 Interactive chart components
🔄 LLM-powered weather insights and summaries

## Technical Details
- **Max Distance**: 200km (configurable constant)
- **Default Stations**: 10 (max 20, remote locations can request 1)
- **Station Coverage**: 54k+ global weather stations across 57 timezones
- **Geocoding**: Free OpenStreetMap API with User-Agent headers
- **Distance Algorithm**: Haversine formula for earth curvature accuracy