import Link from 'next/link';

export function RepositoryIntegrationButton() {
  return (
    <Link
      href="/repository-guide"
      className="bg-green-950/20 hover:bg-green-900/30 text-green-400 hover:text-green-300 border border-green-900/50 hover:border-green-700/50 px-3 py-2 rounded-lg font-mono text-xs sm:text-sm transition-all duration-300 matrix-button hover:matrix-glow flex items-center gap-2 min-h-[36px]"
    >
      <span className="text-green-500">📖</span>
      <span className="hidden sm:inline">Repository Integration</span>
      <span className="sm:hidden">Repo Guide</span>
    </Link>
  );
}