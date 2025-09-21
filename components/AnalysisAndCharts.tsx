import StreamingAnalysis from './StreamingAnalysis';
import WeatherCharts, { ChartData } from './WeatherCharts';

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

interface AnalysisAndChartsProps {
  showAnalysis: boolean;
  searchResult: SearchResult | null;
  chartData: ChartData | null;
  onChartsReceived: (data: ChartData) => void;
  isActive?: boolean;
  isFollowUp?: boolean;
}

export default function AnalysisAndCharts({
  showAnalysis,
  searchResult,
  chartData,
  onChartsReceived,
  isActive = true,
  isFollowUp = false
}: AnalysisAndChartsProps) {
  if (!showAnalysis || !searchResult?.selectedStations || searchResult.selectedStations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8 mt-8">
      {/* Analysis with Streaming */}
      <StreamingAnalysis
        query={searchResult.query}
        stations={searchResult.selectedStations}
        onChartsReceived={onChartsReceived}
        isActive={isActive}
        isFollowUp={isFollowUp}
      />

      {/* Charts - only show for initial queries, not follow-ups */}
      {!isFollowUp && chartData && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Weather Data Visualization</h2>
          <WeatherCharts data={chartData} />
        </div>
      )}
    </div>
  );
}