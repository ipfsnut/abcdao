'use client';

export type CardState = 'active' | 'created' | 'pending';

export interface PoolCardData {
  id: string;
  baseSymbol: string;
  quoteSymbol: string;
  fee: string;
  purpose: string;
  cardState: CardState;
  tvl?: number;
  volume24h?: number;
  deployTxHash?: string | null;
  notes?: string | null;
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(2)}`;
}

const STATE_STYLES: Record<CardState, { border: string; pairColor: string; textColor: string }> = {
  active: {
    border: 'border-l-green-500',
    pairColor: 'text-green-400',
    textColor: 'text-green-600',
  },
  created: {
    border: 'border-l-yellow-500',
    pairColor: 'text-yellow-400/80',
    textColor: 'text-green-700',
  },
  pending: {
    border: 'border-l-green-900/50',
    pairColor: 'text-green-600/60',
    textColor: 'text-green-800',
  },
};

export function PoolCard({ pool }: { pool: PoolCardData }) {
  const styles = STATE_STYLES[pool.cardState];

  return (
    <div
      className={`bg-green-950/20 border border-green-900/30 border-l-4 ${styles.border} rounded-xl p-5`}
    >
      {/* Header row: pair + fee badge */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-lg font-bold ${styles.pairColor}`}>
          {pool.baseSymbol}/{pool.quoteSymbol}
        </span>
        <span className="text-xs bg-green-900/30 text-green-500 px-2 py-0.5 rounded">
          {pool.fee}
        </span>
      </div>

      {/* Purpose */}
      <div className={`text-xs ${styles.textColor} mb-3`}>{pool.purpose}</div>

      {/* State-specific content */}
      {pool.cardState === 'active' && (
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-green-700 text-xs">TVL</span>
            <div className="text-green-400 font-semibold">
              {pool.tvl != null ? formatUsd(pool.tvl) : '—'}
            </div>
          </div>
          <div>
            <span className="text-green-700 text-xs">24h Vol</span>
            <div className="text-green-400 font-semibold">
              {pool.volume24h != null ? formatUsd(pool.volume24h) : '—'}
            </div>
          </div>
        </div>
      )}

      {pool.cardState === 'created' && (
        <div className="flex items-center gap-2 text-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" />
          </span>
          <span className="text-yellow-500/80 text-xs">Awaiting indexing</span>
          {pool.deployTxHash && (
            <a
              href={`https://basescan.org/tx/${pool.deployTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-600/60 hover:text-yellow-400 text-xs underline ml-auto"
            >
              View TX
            </a>
          )}
        </div>
      )}

      {pool.cardState === 'pending' && (
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex rounded-full h-2 w-2 bg-green-900/50" />
          <span className="text-green-800 text-xs">In deployment queue</span>
        </div>
      )}
    </div>
  );
}

export function PoolCardSkeleton() {
  return (
    <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-5 w-28 bg-green-900/30 rounded" />
        <div className="h-4 w-14 bg-green-900/30 rounded" />
      </div>
      <div className="h-3 w-24 bg-green-900/20 rounded mb-3" />
      <div className="flex items-center gap-6">
        <div>
          <div className="h-3 w-8 bg-green-900/20 rounded mb-1" />
          <div className="h-4 w-16 bg-green-900/30 rounded" />
        </div>
        <div>
          <div className="h-3 w-12 bg-green-900/20 rounded mb-1" />
          <div className="h-4 w-16 bg-green-900/30 rounded" />
        </div>
      </div>
    </div>
  );
}
