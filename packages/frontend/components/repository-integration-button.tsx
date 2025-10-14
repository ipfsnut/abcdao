import Link from 'next/link';

export function RepositoryIntegrationButton() {
  return (
    <Link
      href="/repository-guide"
      className="bg-blue-900/50 hover:bg-blue-900/70 text-blue-400 border border-blue-700/50 px-3 py-1.5 rounded-lg font-mono text-xs sm:text-sm transition-all duration-300 hover:matrix-glow flex items-center gap-2"
    >
      <span>📖</span>
      <span className="hidden sm:inline">Repository Integration</span>
      <span className="sm:hidden">Repo Guide</span>
    </Link>
  );
}