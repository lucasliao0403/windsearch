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

interface SearchResultsProps {
  searchResult: SearchResult | null;
  showResults: boolean;
}

export default function SearchResults({ searchResult, showResults }: SearchResultsProps) {
  if (!showResults || !searchResult) return null;

  return (
    <div className="space-y-6 mt-8 animate-in slide-in-from-bottom-8 duration-700 delay-200">
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
                className="flex-shrink-0 bg-gray-900/50 px-3 py-2 rounded-lg border border-gray-700 min-w-fit hover:bg-gray-900/70 hover:border-gray-600 transition-all duration-300 ease-out animate-in slide-in-from-left-4 duration-500"
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
  );
}