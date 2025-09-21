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
          <h1 className="text-5xl text-white mb-6">About WindSearch</h1>

          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              WindSearch queries real weather station data and provides AI-powered analysis of current conditions.
            </p>

            <p>
              This application uses the Windborne Systems API to access real-time measurements from global weather stations. 
              
              When you enter a location query, an LLM-identified location is geocoded using OpenStreetMap, 
              then the nearest weather stations within a reasonable radius are found for analysis. 
              Follow-up queries maintain conversation history.
            </p>

            <p>
              Built using Claude Sonnet and NextJS.
            </p>

            <div className="mt-8 pt-6 border-t border-gray-600">
              <p className="text-sm text-gray-400">
                Made by <a href="https://liaolucas.com" className="text-blue-400 hover:text-blue-300 transition-colors">Lucas Liao</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}