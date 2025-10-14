'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  lines = 1
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-green-900/20 border border-green-900/30";
  
  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} rounded h-4`}
            style={{
              width: index === lines - 1 ? '75%' : '100%'
            }}
          />
        ))}
      </div>
    );
  }

  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

// Specialized skeleton components
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 xs:hidden">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-green-950/20 border border-green-900/50 rounded-lg p-2">
          <Skeleton variant="text" className="mb-1" width="60%" />
          <Skeleton variant="text" width="80%" />
        </div>
      ))}
    </div>
  );
}

export function TabContentSkeleton() {
  return (
    <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
      <Skeleton variant="text" className="mb-4" width="200px" height="24px" />
      <div className="space-y-4">
        <Skeleton variant="rectangular" height="120px" />
        <div className="flex gap-2">
          <Skeleton variant="rectangular" className="flex-1" height="44px" />
          <Skeleton variant="rectangular" width="60px" height="44px" />
        </div>
        <Skeleton variant="rectangular" height="48px" />
      </div>
    </div>
  );
}

export function RewardsSkeleton() {
  return (
    <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
      <Skeleton variant="text" className="mb-4" width="180px" height="24px" />
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-yellow-950/20 border border-yellow-700/50 rounded-lg p-4">
            <Skeleton variant="text" className="mb-2" width="80px" />
            <Skeleton variant="text" width="120px" height="20px" />
          </div>
          <div className="bg-green-950/20 border border-green-700/50 rounded-lg p-4">
            <Skeleton variant="text" className="mb-2" width="90px" />
            <Skeleton variant="text" width="130px" height="20px" />
          </div>
        </div>
        <Skeleton variant="rectangular" height="48px" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex justify-between items-center py-1">
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="20%" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}