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
      <div className="">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">W</span>
                </div>
                <span className="text-xl font-semibold">WindSearch</span>
              </div>
              <a href="/about" className="text-gray-300 hover:text-white transition-colors duration-200">
                About
              </a>
            </div>
            <a
              href="https://github.com/lucasliao0403/windsearch"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 min-h-[calc(100vh-120px)] flex flex-col">
        {/* Centered Content Area */}
        <div className={`flex-1 flex flex-col ${!showResults ? 'justify-center' : 'justify-start pt-8'}`}>
          {/* Hero Section */}
          {!showResults && (
            <div className="text-center py-10 animate-in fade-in duration-700">
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent animate-in slide-in-from-bottom-4 duration-1000 delay-150">
                Ask about weather.
              </h1>
              <p className="text-lg text-gray-400 animate-in slide-in-from-bottom-4 duration-1000 delay-300">
                Get weather insights from current global station data
              </p>
            </div>
          )}

          {/* Search Interface */}
          <div className={`transition-all duration-700 ease-out animate-in slide-in-from-bottom-4 duration-1000 delay-500`}>
            <form onSubmit={handleSearch} className="relative">
              <div className={`relative transition-all duration-500 ease-out rounded-2xl ${
                isSearchFocused ? 'ring-2 ring-white/50' : ''
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

            {/* Suggested Searches */}
            {!showResults && (
              <div className="mt-6 text-center animate-in fade-in duration-700 delay-700">
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => setQuery("What's the weather in Palo Alto?")}
                    className="px-3 py-1.5 text-sm bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700 rounded-lg transition-all duration-200 hover:border-gray-600 cursor-pointer"
                  >
                    What's the weather in Palo Alto?
                  </button>
                  <button
                    onClick={() => setQuery("Will it rain tomorrow in Waterloo, Ontario?")}
                    className="px-3 py-1.5 text-sm bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700 rounded-lg transition-all duration-200 hover:border-gray-600 cursor-pointer"
                  >
                    Will it rain tomorrow in Waterloo, Ontario?
                  </button>
                  <button
                    onClick={() => setQuery("Current temperature in Tokyo")}
                    className="px-3 py-1.5 text-sm bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700 rounded-lg transition-all duration-200 hover:border-gray-600 cursor-pointer"
                  >
                    Current temperature in Tokyo
                  </button>
                </div>
              </div>
            )}
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

        {/* Footer */}
        <div className="text-center pt-8 mt-16">
          <div className="text-sm text-gray-500 mb-4">Made by Lucas Liao</div>
          <div className="flex justify-center gap-6">
            <a
              href="https://x.com/liao_lucas"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a
              href="https://github.com/lucasliao0403"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/lucas-liao-570a19278/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a
              href="https://www.liaolucas.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
