'use client';

import { useState } from 'react';
import WeatherCharts, { ChartData } from '../components/WeatherCharts';
import StreamingAnalysis from '../components/StreamingAnalysis';

interface SelectedStation {
  station_id: string;
  station_name: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

interface SearchResult {
  query: string;
  extractedLocation: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  nearestStationsFound: number;
  selectedStations: SelectedStation[];
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await response.json();

      console.log('API Response:', data);

      if (response.ok) {
        setSearchResult(data);
        setShowResults(true);
        setShowAnalysis(true); // Auto-start analysis immediately
        setChartData(null); // Reset chart data for new search
      } else {
        console.error('API Error:', data);
        setSearchResult(null);
        setShowResults(false);
        setShowAnalysis(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResult(null);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const handleChartsReceived = (data: ChartData) => {
    console.log('📊 Received chart data:', data);
    setChartData(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <span className="text-xl font-semibold">WindSearch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6">
        {/* Hero Section */}
        {!showResults && (
          <div className="text-center py-20 animate-in fade-in duration-700">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent animate-in slide-in-from-bottom-4 duration-1000 delay-150">
              Ask about weather
            </h1>
            <p className="text-xl text-gray-400 mb-2 animate-in slide-in-from-bottom-4 duration-1000 delay-300">
              Get intelligent weather insights from global station data
            </p>
          </div>
        )}

        {/* Search Interface */}
        <div className={`transition-all duration-700 ease-out ${showResults ? 'py-8' : 'pb-20'} animate-in slide-in-from-bottom-4 duration-1000 delay-500`}>
          <form onSubmit={handleSearch} className="relative">
            <div className={`relative transition-all duration-500 ease-out rounded-2xl transform ${
              isSearchFocused ? 'ring-2 ring-blue-500/50 scale-[1.02]' : ''
            }`}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="What's the weather like in San Francisco?"
                className="w-full p-4 pl-6 pr-16 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl text-white placeholder-gray-400 text-lg focus:outline-none focus:border-blue-500 focus:bg-gray-800/70 transition-all duration-300 ease-out"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 rounded-xl transition-all duration-300 ease-out group hover:scale-110 hover:shadow-lg hover:shadow-blue-500/25"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 text-white group-hover:scale-110 transition-all duration-300 ease-out group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Search Results */}
        {showResults && searchResult && (
          <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700 delay-200">
            {/* Compact Results Summary */}
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:bg-gray-800/40 transition-all duration-300 ease-out">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-gray-300 animate-in fade-in duration-500 delay-300">
                  Analyzing {searchResult.selectedStations?.length || 0} stations near {searchResult.extractedLocation}
                </div>
              </div>

              {searchResult.selectedStations && searchResult.selectedStations.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {searchResult.selectedStations.map((station, index) => (
                    <div
                      key={station.station_id}
                      className="flex-shrink-0 bg-gray-900/50 px-3 py-2 rounded-lg border border-gray-700 min-w-fit hover:bg-gray-900/70 hover:border-gray-600 transition-all duration-300 ease-out hover:scale-105 animate-in slide-in-from-left-4 duration-500"
                      style={{ animationDelay: `${400 + index * 100}ms` }}
                    >
                      <div className="text-sm font-medium text-white">{station.station_name}</div>
                      <div className="text-xs text-gray-400">{station.station_id}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analysis and Charts Section */}
        {showAnalysis && searchResult?.selectedStations && searchResult.selectedStations.length > 0 && (
          <div className="space-y-8 mt-8">
            {/* Analysis with Streaming */}
            <StreamingAnalysis
              query={searchResult.query}
              stations={searchResult.selectedStations}
              onChartsReceived={handleChartsReceived}
            />

            {/* Charts */}
            {chartData && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Weather Data Visualization</h2>
                <WeatherCharts data={chartData} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
