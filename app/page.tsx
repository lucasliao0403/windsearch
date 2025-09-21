'use client';

import { useState, useCallback } from 'react';
import { ChartData } from '../components/WeatherCharts';
import Hero from '../components/Hero';
import SearchInterface from '../components/SearchInterface';
import SearchResults from '../components/SearchResults';
import AnalysisAndCharts from '../components/AnalysisAndCharts';
import Footer from '../components/Footer';

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

  const handleChartsReceived = useCallback((data: ChartData) => {
    console.log('📊 [PAGE] Received chart data in main component:', data);
    console.log('📊 [PAGE] Setting chartData state...');
    setChartData(data);
  }, []);

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
          <Hero showResults={showResults} />

          <SearchInterface
            query={query}
            setQuery={setQuery}
            onSubmit={handleSearch}
            loading={loading}
            isSearchFocused={isSearchFocused}
            setIsSearchFocused={setIsSearchFocused}
            showResults={showResults}
          />

          <SearchResults
            searchResult={searchResult}
            showResults={showResults}
          />

          <AnalysisAndCharts
            showAnalysis={showAnalysis}
            searchResult={searchResult}
            chartData={chartData}
            onChartsReceived={handleChartsReceived}
          />
        </div>

        <Footer />
      </div>
    </div>
  );
}
