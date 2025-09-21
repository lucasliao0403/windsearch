'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChartData } from './WeatherCharts';


interface Station {
  station_id: string;
  station_name: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

interface StreamingAnalysisProps {
  query: string;
  stations: Station[];
  onChartsReceived: (chartData: ChartData) => void;
}

export default function StreamingAnalysis({ query, stations, onChartsReceived }: StreamingAnalysisProps) {
  const [analysis, setAnalysis] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (stations.length === 0) return;

    setIsLoading(true);
    setError(null);
    setAnalysis('');
    setSummary('');
    setIsGeneratingSummary(false);

    console.log('🔄 [STREAM] Starting fresh analysis, clearing previous chart data');

    console.log('🚀 [STREAM] Starting analysis for', stations.length, 'stations');

    // Note: EventSource doesn't support POST directly, using fetch instead

    // We need to use fetch instead for POST requests
    startAnalysis();

    async function startAnalysis() {
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query, stations }),
        });

        if (!response.ok) {
          // Try to get the error message from the response
          try {
            const errorData = await response.json();
            throw new Error(`${response.status}: ${errorData.error || 'HTTP error'}`);
          } catch {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body reader available');
        }

        const decoder = new TextDecoder();

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Process complete lines
          const lines = buffer.split('\n');
          // Keep the last (potentially incomplete) line in the buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonData = line.slice(6).trim();
                if (jsonData) {
                  const data = JSON.parse(jsonData);

                  if (data.type === 'charts') {
                    console.log('📊 [STREAM] Received chart data:', data.data);
                    onChartsReceived(data.data);
                  } else if (data.type === 'analysis') {
                    console.log('📝 [STREAM] Received analysis chunk:', JSON.stringify(data.content));
                    setAnalysis(prev => {
                      const newAnalysis = prev + data.content;
                      console.log('📝 [STREAM] Current analysis length:', newAnalysis.length);
                      // Start showing summary generation after some analysis content
                      if (newAnalysis.length > 50 && !isGeneratingSummary) {
                        setIsGeneratingSummary(true);
                      }
                      return newAnalysis;
                    });
                  } else if (data.type === 'summary') {
                    console.log('🎯 [STREAM] Received Sonnet summary');
                    setIsGeneratingSummary(false);
                    setSummary(data.content);
                  }
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError, 'Line:', line);
              }
            }
          }
        }

        setIsLoading(false);
        console.log('✅ [STREAM] Analysis completed');
      } catch (fetchError) {
        console.error('💥 [STREAM] Analysis failed:', fetchError);

        // Extract and display the specific error message
        if (fetchError instanceof Error) {
          if (fetchError.message.includes('422:')) {
            // Extract the specific error message from the API
            const errorMessage = fetchError.message.split('422: ')[1] || 'Data validation failed';
            setError(errorMessage);
          } else {
            setError('Failed to generate analysis. Please try again.');
          }
        } else {
          setError('Failed to generate analysis. Please try again.');
        }

        setIsLoading(false);
        setIsGeneratingSummary(false);
      }
    }

    return () => {
      // Cleanup if needed
    };
  }, [query, stations, onChartsReceived]);

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-red-400 mb-2">Analysis Error</h3>
        <p className="text-red-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
      {/* Quick Analysis */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:bg-gray-800/60 hover:border-gray-600 transition-all duration-500 ease-out">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-xl font-semibold">Quick Analysis</h3>
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-400 animate-in fade-in duration-500">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm animate-pulse">Analyzing data...</span>
            </div>
          )}
        </div>

      {analysis ? (
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl font-semibold text-white mb-3 mt-6">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-medium text-white mb-2 mt-4">{children}</h3>,
              p: ({ children }) => <p className="text-gray-300 mb-3 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="text-gray-300 mb-3 pl-4 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="text-gray-300 mb-3 pl-4 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="list-disc">{children}</li>,
              strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
              em: ({ children }) => <em className="text-blue-300">{children}</em>,
              code: ({ children }) => (
                <code className="bg-gray-700 px-2 py-1 rounded text-green-300 font-mono text-sm">
                  {children}
                </code>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-400">
                  {children}
                </blockquote>
              ),
            }}
          >
            {analysis}
          </ReactMarkdown>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          <div className="animate-pulse bg-gray-700 h-4 rounded w-3/4"></div>
          <div className="animate-pulse bg-gray-700 h-4 rounded w-1/2"></div>
          <div className="animate-pulse bg-gray-700 h-4 rounded w-5/6"></div>
        </div>
        ) : (
          <p className="text-gray-400">Select weather stations to begin analysis...</p>
        )}
      </div>

      {/* Detailed Summary */}
      {(summary || isGeneratingSummary) && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:bg-gray-800/60 hover:border-gray-600 transition-all duration-500 ease-out animate-in slide-in-from-bottom-8 duration-700 delay-300">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xl font-semibold">Weather Summary</h3>
            {isGeneratingSummary && (
              <div className="flex items-center gap-2 text-yellow-400 animate-in fade-in duration-500">
                <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm animate-pulse">Creating summary...</span>
              </div>
            )}
          </div>

          {summary ? (
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-semibold text-white mb-3 mt-6">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-medium text-white mb-2 mt-4">{children}</h3>,
                  p: ({ children }) => <p className="text-gray-300 mb-3 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="text-gray-300 mb-3 pl-4 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="text-gray-300 mb-3 pl-4 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="list-disc">{children}</li>,
                  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="text-blue-300">{children}</em>,
                  code: ({ children }) => (
                    <code className="bg-gray-700 px-2 py-1 rounded text-green-300 font-mono text-sm">
                      {children}
                    </code>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-yellow-500 pl-4 italic text-gray-400">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {summary}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="animate-pulse bg-gray-700 h-4 rounded w-3/4"></div>
              <div className="animate-pulse bg-gray-700 h-4 rounded w-1/2"></div>
              <div className="animate-pulse bg-gray-700 h-4 rounded w-5/6"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}