'use client';

import Link from 'next/link';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      {/* Back button */}
      <div className="fixed top-6 left-6 z-10">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800/70 hover:border-gray-600 transition-all duration-300"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      <div className="max-w-2xl mx-auto flex items-center justify-center min-h-screen">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
          <h1 className="text-4xl font-bold text-white mb-6">About WindSearch</h1>

          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              WindSearch queries real weather station data and provides AI-powered analysis of current conditions.
            </p>

            <p>
              <strong>Data Sources:</strong> The application uses the Windborne Systems API to access real-time
              measurements from global weather stations. When you enter a location query, it geocodes the location
              using OpenStreetMap Nominatim, then finds the nearest weather stations within a reasonable radius.
            </p>

            <p>
              <strong>AI Processing:</strong> Location extraction and analysis are handled by Anthropic&apos;s Claude models.
              Haiku performs quick location parsing and initial analysis, while Sonnet generates detailed summaries.
              The analysis streams in real-time using server-sent events, providing immediate feedback while processing.
            </p>

            <p>
              <strong>Technical Architecture:</strong> Built with Next.js 15 and React 19, using TypeScript for type safety.
              The frontend uses TailwindCSS for styling and Recharts for data visualization. The backend implements
              request queuing to prevent API rate limiting and includes data validation with fallback to historical data
              when recent measurements aren&apos;t available.
            </p>

            <p>
              <strong>Data Processing:</strong> The system validates data quality by checking timestamps and measurement
              completeness. If recent data is sparse, it falls back to historical readings and adjusts the analysis
              context accordingly. Charts display temperature, pressure, and wind patterns across multiple stations
              to show regional weather variations.
            </p>

            <p>
              <strong>Conversation Context:</strong> Follow-up queries maintain conversation history, allowing contextual
              questions like &quot;What about tomorrow?&quot; or &quot;How does this compare to last week?&quot; The interface
              dynamically adapts from a centered search to a bottom-pinned input for continuous interaction.
            </p>

            <div className="mt-8 pt-6 border-t border-gray-600">
              <p className="text-sm text-gray-400">
                Made by <a href="https://lucasliao.com" className="text-blue-400 hover:text-blue-300 transition-colors">Lucas Liao</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}