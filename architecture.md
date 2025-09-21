# WindSearch Architecture

## Overview
WindSearch is a Perplexity-style AI search interface for weather data. Users ask natural language questions about weather and receive intelligent station selection, data aggregation, and AI-generated summaries with visualizations.

## Core Components

### 1. Query Processing
- **Location Mapping**: Maps user queries to geographic timezones using predefined location-timezone dictionary
- **Station Filtering**: Filters 6k+ weather stations by relevant timezones to reduce search space
- **LLM Selection**: Anthropic Claude analyzes filtered stations and selects 5-10 most relevant for the specific query

### 2. Data Pipeline
- **Station API**: Fetches all available weather stations with metadata (location, timezone, name)
- **Historical Weather API**: Retrieves time-series data (temperature, wind, pressure, precipitation) for selected stations
- **Data Aggregation**: Combines multi-station data for analysis and visualization

### 3. AI Layer
- **Query Understanding**: LLM interprets natural language queries and identifies geographic scope
- **Station Intelligence**: Smart selection based on query context (coastal vs inland, urban vs rural, coverage area)
- **Summary Generation**: AI-generated text insights from aggregated weather data

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
✅ Smart station selection based on geographic queries
✅ Natural language search interface
🔄 Data aggregation and summary generation
🔄 Interactive chart components
🔄 LLM-powered weather insights