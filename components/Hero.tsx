interface HeroProps {
  showResults: boolean;
}

export default function Hero({ showResults }: HeroProps) {
  if (showResults) return null;

  return (
    <div className="text-center py-10 animate-in fade-in duration-700">
      <h1 className="text-5xl mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent animate-in slide-in-from-bottom-4 duration-1000 delay-150">
        WindSearch
      </h1>
      <p className="text-lg text-gray-400 animate-in slide-in-from-bottom-4 duration-1000 delay-300">
        Ask about weather in plain English. Get real data from global weather stations.
      </p>
    </div>
  );
}