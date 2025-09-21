'use client';

import { useState } from 'react';

interface SearchResult {
  query: string;
  extractedLocation: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  nearestStationsFound: number;
  selectedStations: any[];
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

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
      } else {
        console.error('API Error:', data);
        setSearchResult(null);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-black text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center">WindSearch</h1>
        <p className="text-gray-400 text-center mb-8">Ask anything about weather data</p>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What's the temperature in California this week?"
              className="flex-1 p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-lg"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {searchResult && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Search Results</h2>

            <div className="mb-4">
              <p className="text-gray-400">Query: <span className="text-white">{searchResult.query}</span></p>
              {searchResult.extractedLocation && (
                <p className="text-gray-400">Extracted Location: <span className="text-white">{searchResult.extractedLocation}</span></p>
              )}
              {searchResult.coordinates && (
                <p className="text-gray-400">Coordinates: <span className="text-white">{searchResult.coordinates.lat.toFixed(4)}°, {searchResult.coordinates.lng.toFixed(4)}°</span></p>
              )}
              {searchResult.nearestStationsFound !== undefined && (
                <p className="text-gray-400">Nearest Stations Found: <span className="text-white">{searchResult.nearestStationsFound}</span></p>
              )}
              {searchResult.selectedStations && (
                <p className="text-gray-400">Selected: <span className="text-white">{searchResult.selectedStations.length}</span></p>
              )}
            </div>

            {searchResult.selectedStations && searchResult.selectedStations.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Selected Weather Stations:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResult.selectedStations.map((station) => (
                    <div key={station.station_id} className="bg-gray-900 p-3 rounded">
                      <div className="font-medium">{station.station_name}</div>
                      <div className="text-sm text-gray-400">{station.station_id}</div>
                      <div className="text-sm text-gray-400">
                        {station.latitude.toFixed(4)}°, {station.longitude.toFixed(4)}°
                      </div>
                      {station.distance && (
                        <div className="text-sm text-blue-400">
                          {station.distance.toFixed(1)}km away
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
