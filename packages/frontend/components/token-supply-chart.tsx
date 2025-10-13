'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';

interface TokenSupplyData {
  total_supply: number;
  circulating_supply: number;
  breakdown: {
    [key: string]: {
      amount: number;
      percentage: number;
      color: string;
      label: string;
      description: string;
      locked: boolean;
    };
  };
  last_updated: string;
}

interface TokenSupplyChartProps {
  size?: number;
  showLegend?: boolean;
  showCenter?: boolean;
  interactive?: boolean;
}

export function TokenSupplyChart({ 
  size = 180, 
  showLegend = false, 
  showCenter = true,
  interactive = false 
}: TokenSupplyChartProps) {
  const [supplyData, setSupplyData] = useState<TokenSupplyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  useEffect(() => {
    fetchSupplyData();
  }, []);

  const fetchSupplyData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.backendUrl}/api/stats/supply`);
      if (!response.ok) {
        throw new Error('Failed to fetch supply data');
      }
      const data = await response.json();
      setSupplyData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching supply data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div 
        className="bg-green-950/20 border border-green-900/50 rounded-lg p-3 flex items-center justify-center" 
        style={{ width: size, height: size }}
      >
        <p className="text-green-600 font-mono text-xs">Loading...</p>
      </div>
    );
  }

  if (error || !supplyData) {
    return (
      <div 
        className="bg-red-950/20 border border-red-900/50 rounded-lg p-3 flex items-center justify-center" 
        style={{ width: size, height: size }}
      >
        <p className="text-red-400 font-mono text-xs">Error</p>
      </div>
    );
  }

  // Create donut chart paths
  const center = size / 2;
  const radius = (size / 2) - 20;
  const innerRadius = radius * 0.6; // 60% inner radius for donut effect
  
  let cumulativePercentage = 0;
  const segments = Object.entries(supplyData.breakdown).map(([key, data]) => {
    const startAngle = (cumulativePercentage / 100) * 360;
    const endAngle = ((cumulativePercentage + data.percentage) / 100) * 360;
    cumulativePercentage += data.percentage;

    // Convert angles to radians
    const startRad = (startAngle - 90) * (Math.PI / 180); // -90 to start at top
    const endRad = (endAngle - 90) * (Math.PI / 180);

    // Calculate path coordinates
    const largeArcFlag = data.percentage > 50 ? 1 : 0;
    
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    
    const x3 = center + innerRadius * Math.cos(endRad);
    const y3 = center + innerRadius * Math.sin(endRad);
    const x4 = center + innerRadius * Math.cos(startRad);
    const y4 = center + innerRadius * Math.sin(startRad);

    const pathData = [
      `M ${x1} ${y1}`, // Move to start point on outer circle
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, // Arc to end point on outer circle
      `L ${x3} ${y3}`, // Line to end point on inner circle
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`, // Arc to start point on inner circle
      'Z' // Close path
    ].join(' ');

    return {
      key,
      data,
      pathData,
      isHovered: hoveredSegment === key
    };
  });

  const formatSupply = (amount: number): string => {
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(1)}B`;
    }
    if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(1)}M`;
    }
    return amount.toLocaleString();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg 
          width={size} 
          height={size} 
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90" // Rotate to start at top
        >
          {/* Segments */}
          {segments.map((segment) => (
            <path
              key={segment.key}
              d={segment.pathData}
              fill={segment.data.color}
              opacity={segment.isHovered ? 0.8 : 0.6}
              stroke="rgba(0, 0, 0, 0.1)"
              strokeWidth="1"
              className={interactive ? "transition-all duration-200 cursor-pointer" : ""}
              onMouseEnter={interactive ? () => setHoveredSegment(segment.key) : undefined}
              onMouseLeave={interactive ? () => setHoveredSegment(null) : undefined}
            />
          ))}
        </svg>

        {/* Center text */}
        {showCenter && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-green-400 font-mono font-bold text-lg matrix-glow">
              100B
            </p>
            <p className="text-green-600 font-mono text-xs">
              $ABC
            </p>
            {hoveredSegment && supplyData.breakdown[hoveredSegment] && (
              <div className="mt-1 text-center">
                <p className="text-green-400 font-mono text-xs">
                  {supplyData.breakdown[hoveredSegment].label}
                </p>
                <p className="text-green-300 font-mono text-xs font-bold">
                  {formatSupply(supplyData.breakdown[hoveredSegment].amount)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 space-y-1">
          {Object.entries(supplyData.breakdown).map(([key, data]) => (
            <div key={key} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: data.color }}
              />
              <span className="text-green-400 font-mono text-xs">
                {data.label}: {data.percentage.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Compact version for stats bar
export function TokenSupplyMini() {
  return (
    <div className="min-w-[140px] sm:min-w-0 bg-green-950/20 border border-green-900/50 rounded-lg p-3 matrix-button">
      <p className="text-green-600 text-xs font-mono">Token_Supply</p>
      <div className="flex items-center gap-2 mt-1">
        <TokenSupplyChart size={32} showCenter={false} />
        <div>
          <p className="text-lg sm:text-xl font-bold text-green-400 matrix-glow">100B</p>
          <p className="text-green-600 font-mono text-xs">$ABC</p>
        </div>
      </div>
    </div>
  );
}