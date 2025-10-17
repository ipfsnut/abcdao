'use client';

export default function APIReferencePage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⚙️</span>
          <h1 className="text-4xl font-bold text-white">API Reference</h1>
        </div>
        <p className="text-xl text-gray-300 leading-relaxed">
          Integration endpoints for developers building on top of ABC DAO or integrating with the reward system.
        </p>
      </div>

      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-700/50 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">🚧 API Documentation Coming Soon</h2>
        <p className="text-gray-300 mb-6">
          Comprehensive API reference including authentication, endpoints, and integration examples.
        </p>
        <a href="/docs" className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
          View Current Docs →
        </a>
      </div>
    </div>
  );
}