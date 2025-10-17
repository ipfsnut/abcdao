'use client';

export default function RepositorySetupPage() {
  return (
    <div className="max-w-4xl">
      {/* Hero Section */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">📁</span>
          <h1 className="text-4xl font-bold text-white">Repository Setup</h1>
        </div>
        <p className="text-xl text-gray-300 leading-relaxed">
          Detailed guide for repository owners to set up ABC DAO integration and enable 
          automatic $ABC token rewards for contributors.
        </p>
      </div>

      {/* Coming Soon */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700/50 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">🚧 Coming Soon</h2>
        <p className="text-gray-300 mb-6">
          This page is being migrated from the main docs page. In the meantime, 
          you can find repository setup information in the current documentation.
        </p>
        <a
          href="/docs"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          View Current Docs →
        </a>
      </div>

      {/* Quick Preview */}
      <div className="mt-8 bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">What This Page Will Cover:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-2">Repository Registration</h4>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• API endpoints for automation</li>
              <li>• Bulk repository management</li>
              <li>• Partner program application</li>
              <li>• Premium staking benefits</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Webhook Configuration</h4>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• Step-by-step webhook setup</li>
              <li>• Security best practices</li>
              <li>• Troubleshooting webhook issues</li>
              <li>• Testing and validation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}