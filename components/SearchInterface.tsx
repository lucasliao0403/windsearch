interface SearchInterfaceProps {
  query: string;
  setQuery: (query: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  isSearchFocused: boolean;
  setIsSearchFocused: (focused: boolean) => void;
  showResults: boolean;
}

export default function SearchInterface({
  query,
  setQuery,
  onSubmit,
  loading,
  isSearchFocused,
  setIsSearchFocused,
  showResults
}: SearchInterfaceProps) {
  // Performance logging
  const renderStart = performance.now();
  console.log('🔄 [PERF] SearchInterface render started');

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const changeStart = performance.now();
    setQuery(e.target.value);
    console.log(`⌨️ [PERF] Query change took ${performance.now() - changeStart}ms`);
  };

  // Log render completion
  setTimeout(() => {
    console.log(`✅ [PERF] SearchInterface render completed in ${performance.now() - renderStart}ms`);
  }, 0);

  return (
    <div className={`transition-all duration-700 ease-out ${!showResults ? 'animate-in slide-in-from-bottom-4 duration-1000 delay-500' : ''}`}>
      <form onSubmit={onSubmit} className="relative">
        <div className={`relative transition-all duration-500 ease-out rounded-2xl ${
          isSearchFocused ? 'ring-2 ring-white/50' : ''
        }`}>
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder={showResults ? "Ask a follow-up question..." : "Ask about weather..."}
            className={`w-full p-4 pl-6 pr-16 bg-gray-800/85 backdrop-blur-sm border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-gray-800/70 transition-all duration-300 ease-out ${showResults ? 'text-base' : 'text-lg'}`}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 rounded-xl transition-all duration-300 ease-out group hover:shadow-lg hover:shadow-blue-500/25"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 text-white transition-all duration-300 ease-out group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              onClick={() => {
                setQuery("What's the weather in Palo Alto?");
                // Trigger search automatically
                setTimeout(() => {
                  const form = document.querySelector('form');
                  if (form) {
                    form.requestSubmit();
                  }
                }, 100);
              }}
              className="px-3 py-1.5 text-sm bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700 rounded-lg transition-all duration-200 hover:border-gray-600 cursor-pointer"
            >
              What&apos;s the weather in Palo Alto?
            </button>
            <button
              onClick={() => {
                setQuery("Will it rain tomorrow in Waterloo, Ontario?");
                // Trigger search automatically
                setTimeout(() => {
                  const form = document.querySelector('form');
                  if (form) {
                    form.requestSubmit();
                  }
                }, 100);
              }}
              className="px-3 py-1.5 text-sm bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700 rounded-lg transition-all duration-200 hover:border-gray-600 cursor-pointer"
            >
              Will it rain tomorrow in Waterloo, Ontario?
            </button>
            <button
              onClick={() => {
                setQuery("Current temperature in Tokyo");
                // Trigger search automatically
                setTimeout(() => {
                  const form = document.querySelector('form');
                  if (form) {
                    form.requestSubmit();
                  }
                }, 100);
              }}
              className="px-3 py-1.5 text-sm bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700 rounded-lg transition-all duration-200 hover:border-gray-600 cursor-pointer"
            >
              Current temperature in Tokyo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}