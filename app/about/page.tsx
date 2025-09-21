'use client';

import Link from 'next/link';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
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
              WindSearch lets you ask about weather in plain English and get real data from actual weather stations.
            </p>

            <p>
              Instead of guessing or using forecasts, it finds the nearest weather stations to your location,
              pulls their latest readings, and shows you what's actually happening.
            </p>

            <p>
              Ask follow-up questions naturally. "What about tomorrow?" or "How about Tokyo?" and it remembers
              the conversation context. The interface adapts like Perplexity - search starts centered, then
              moves to the bottom for continuous conversation.
            </p>

            <p>
              The AI provides quick analysis while streaming, then generates a detailed markdown summary
              with key findings, temperature conditions, and notable patterns. Interactive charts help you
              visualize trends in temperature, pressure, and wind speed across multiple stations.
            </p>

            <p>
              Works with both recent and historical data. If recent measurements aren't available, it analyzes
              older data and explains the context. Performance optimized to handle multiple conversations and
              large datasets smoothly. Built because most weather apps show forecasts or generic conditions -
              this shows real measurements with intelligent analysis.
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