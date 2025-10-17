'use client';

export default function TroubleshootingPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🛠️</span>
          <h1 className="text-4xl font-bold text-white">Troubleshooting</h1>
        </div>
        <p className="text-xl text-gray-300 leading-relaxed">
          Common issues, solutions, and support resources for ABC DAO users and developers.
        </p>
      </div>

      <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-700/50 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">🚧 Help Center Coming Soon</h2>
        <p className="text-gray-300 mb-6">
          Comprehensive troubleshooting guide with common issues, solutions, and support channels.
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/docs" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            View Current Docs →
          </a>
          <a href="https://github.com/ABC-DAO/abc-dao/issues" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Report Issue →
          </a>
        </div>
      </div>
    </div>
  );
}