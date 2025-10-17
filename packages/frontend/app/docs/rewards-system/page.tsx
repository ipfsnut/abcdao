'use client';

export default function RewardsSystemPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">💰</span>
          <h1 className="text-4xl font-bold text-white">Rewards System & Commit Tags</h1>
        </div>
        <p className="text-xl text-gray-300 leading-relaxed">
          Understanding how ABC DAO calculates rewards, commit tags for optimization, and advanced earning strategies.
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-700/50 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">🚧 Content Migration In Progress</h2>
        <p className="text-gray-300 mb-6">
          This section will include detailed information about reward calculations, commit tags, and earning optimization strategies.
        </p>
        <a href="/docs" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
          View Current Docs →
        </a>
      </div>
    </div>
  );
}