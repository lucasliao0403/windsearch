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

interface ConversationEntry {
  id: string;
  query: string;
  searchResult: SearchResult | null;
  chartData: ChartData | null;
  timestamp: Date;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [currentChartData, setCurrentChartData] = useState<ChartData | null>(null);

  // Performance logging
  const renderStart = performance.now();
  console.log('🏠 [PERF] Home component render started');
  console.log(`📝 [PERF] Conversation state has ${conversation.length} entries`);
  console.log(`💾 [PERF] Memory estimate: ${JSON.stringify(conversation).length} chars in conversation state`);

  // Log render completion
  setTimeout(() => {
    console.log(`🏠 [PERF] Home component render completed in ${performance.now() - renderStart}ms`);
  }, 0);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    const entryId = Date.now().toString();

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          conversationContext: conversation.map(entry => ({
            query: entry.query,
            location: entry.searchResult?.extractedLocation,
            timestamp: entry.timestamp
          }))
        })
      });
      const data = await response.json();

      console.log('API Response:', data);

      if (response.ok) {
        const newEntry: ConversationEntry = {
          id: entryId,
          query,
          searchResult: data,
          chartData: null,
          timestamp: new Date()
        };

        setConversation(prev => [...prev, newEntry]);
        setCurrentChartData(null); // Reset chart data for new search
        setQuery(''); // Clear input after search
      } else {
        console.error('API Error:', data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChartsReceived = useCallback((data: ChartData, entryId?: string) => {
    console.log('📊 [PAGE] Received chart data in main component:', data);
    setCurrentChartData(data);

    if (entryId) {
      setConversation(prev => prev.map(entry =>
        entry.id === entryId ? { ...entry, chartData: data } : entry
      ));
    }
  }, []);

  const hasConversation = conversation.length > 0;

  const handleBackToSearch = () => {
    setConversation([]);
    setCurrentChartData(null);
    setQuery('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <div className="">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
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
        {!hasConversation ? (
          /* Initial state - centered search */
          <div className="flex-1 flex flex-col justify-center">
            <Hero showResults={false} />
            <SearchInterface
              query={query}
              setQuery={setQuery}
              onSubmit={handleSearch}
              loading={loading}
              isSearchFocused={isSearchFocused}
              setIsSearchFocused={setIsSearchFocused}
              showResults={false}
            />
          </div>
        ) : (
          /* Conversation state - content at top, search at bottom */
          <>
            {/* Back to Search Button */}
            <div className="">
              <button
                onClick={handleBackToSearch}
                className="flex items-center gap-2
                rounded-xl text-gray-300 hover:text-white transition-all duration-300 cursor-pointer"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                New Search
              </button>
            </div>

            <div className="flex-1 pt-4 pb-32">
              {conversation.map((entry, index) => (
                <div key={entry.id} className="mb-12">
                  {/* Query */}
                  <div className="mb-6">
                    <div className="text-xl font-medium text-white bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                      {entry.query}
                    </div>
                  </div>

                  {/* Results for this query */}
                  <SearchResults
                    searchResult={entry.searchResult}
                    showResults={true}
                  />

                  <AnalysisAndCharts
                    showAnalysis={true}
                    searchResult={entry.searchResult}
                    chartData={index === conversation.length - 1 ? currentChartData : entry.chartData}
                    onChartsReceived={(data) => handleChartsReceived(data, entry.id)}
                    isActive={index === conversation.length - 1}
                    isFollowUp={index > 0}
                  />
                </div>
              ))}
            </div>

            {/* Fixed bottom search bar */}
            <div className="fixed bottom-8 left-0 right-0 p-4">
              <div className="max-w-4xl mx-auto">
                <SearchInterface
                  query={query}
                  setQuery={setQuery}
                  onSubmit={handleSearch}
                  loading={loading}
                  isSearchFocused={isSearchFocused}
                  setIsSearchFocused={setIsSearchFocused}
                  showResults={true}
                />
              </div>
            </div>
          </>
        )}

        {!hasConversation && <Footer />}
      </div>
    </div>
  );
}
