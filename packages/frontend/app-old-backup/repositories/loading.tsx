export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="h-8 bg-green-900/20 rounded mb-6"></div>
          
          {/* Repository slots skeleton */}
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm mb-8">
            <div className="h-6 bg-green-900/20 rounded mb-4 w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-950/20 border border-green-700/50 rounded-lg p-4">
                <div className="h-8 bg-green-800/20 rounded mb-2"></div>
                <div className="h-4 bg-green-800/20 rounded w-2/3"></div>
              </div>
              <div className="bg-blue-950/20 border border-blue-700/50 rounded-lg p-4">
                <div className="h-8 bg-blue-800/20 rounded mb-2"></div>
                <div className="h-4 bg-blue-800/20 rounded w-2/3"></div>
              </div>
              <div className="bg-purple-950/20 border border-purple-700/50 rounded-lg p-4">
                <div className="h-8 bg-purple-800/20 rounded mb-2"></div>
                <div className="h-4 bg-purple-800/20 rounded w-2/3"></div>
              </div>
            </div>
          </div>
          
          {/* Repositories list skeleton */}
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm mb-8">
            <div className="h-6 bg-green-900/20 rounded mb-6 w-1/2"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-950/20 border border-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-5 bg-gray-800/20 rounded mb-2 w-1/3"></div>
                      <div className="h-4 bg-gray-800/20 rounded w-1/2"></div>
                    </div>
                    <div className="h-8 bg-gray-800/20 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Add repository form skeleton */}
          <div className="bg-black/40 border border-blue-900/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="h-6 bg-blue-900/20 rounded mb-6 w-1/3"></div>
            <div className="space-y-4">
              <div className="h-4 bg-blue-800/20 rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-blue-950/20 border border-blue-700/50 rounded-lg"></div>
              <div className="h-4 bg-blue-800/20 rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-blue-950/20 border border-blue-700/50 rounded-lg"></div>
              <div className="h-12 bg-blue-900/50 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}