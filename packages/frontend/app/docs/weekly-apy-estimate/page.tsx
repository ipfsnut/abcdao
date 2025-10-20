'use client';

export default function WeeklyAPYEstimatePage() {
  return (
    <div className="max-w-4xl">
      {/* Hero Section */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">📊</span>
          <h1 className="text-4xl font-bold text-white">Weekly APY Estimate</h1>
        </div>
        <p className="text-xl text-gray-300 leading-relaxed">
          Understanding how ABC DAO calculates and displays Annual Percentage Yield (APY) 
          for $ABC staking rewards based on weekly distribution cycles.
        </p>
      </div>

      {/* Overview */}
      <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-700/50 rounded-xl p-8 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">📈 How It Works</h2>
        <p className="text-gray-300 mb-6 leading-relaxed">
          ABC DAO uses a <strong>weekly reset cycle</strong> for APY calculations. Each week starts at 0% APY 
          and accumulates as ETH rewards are distributed to stakers. The displayed APY extrapolates 
          the current week's performance over a full 52-week year.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/40 border border-green-700/30 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🔄</div>
            <h3 className="text-green-400 font-bold mb-1">Weekly Reset</h3>
            <p className="text-gray-400 text-sm">APY starts at 0% each Sunday</p>
          </div>
          <div className="bg-black/40 border border-blue-700/30 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">📈</div>
            <h3 className="text-blue-400 font-bold mb-1">Accumulation</h3>
            <p className="text-gray-400 text-sm">Grows as ETH rewards distribute</p>
          </div>
          <div className="bg-black/40 border border-purple-700/30 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="text-purple-400 font-bold mb-1">Extrapolation</h3>
            <p className="text-gray-400 text-sm">Projects to 52-week annual rate</p>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="space-y-8">
        
        {/* Calculation Method */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">🧮 Calculation Methodology</h2>
          
          <div className="space-y-6">
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Step 1: Weekly ETH per $ABC Token</h3>
              <div className="bg-black/60 rounded p-3 font-mono text-sm text-green-400">
                weeklyETHPerABC = latestDistribution.ethAmount / latestDistribution.totalStaked
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Calculate how much ETH each staked $ABC token earned in the most recent distribution.
              </p>
            </div>

            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Step 2: Convert to USD Value</h3>
              <div className="bg-black/60 rounded p-3 font-mono text-sm text-green-400">
                weeklyReturn = weeklyETHPerABC × currentETHPrice
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Convert ETH rewards to USD using real-time ETH price data.
              </p>
            </div>

            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Step 3: Calculate Weekly Yield</h3>
              <div className="bg-black/60 rounded p-3 font-mono text-sm text-green-400">
                weeklyYield = weeklyReturn / currentABCPrice
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Determine the percentage yield relative to $ABC token value.
              </p>
            </div>

            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Step 4: Annualize to APY</h3>
              <div className="bg-black/60 rounded p-3 font-mono text-sm text-green-400">
                currentAPY = weeklyYield × 52 × 100
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Extrapolate weekly performance over 52 weeks to get annual percentage.
              </p>
            </div>
          </div>
        </div>

        {/* Why Weekly Cycles */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">❓ Why Weekly Cycles?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-white font-semibold mb-3">🎯 Accurate Reflection</h3>
              <p className="text-gray-400 text-sm mb-4">
                ETH rewards are distributed multiple times per week. A weekly cycle captures 
                the full distribution pattern without being too short-term volatile or too 
                long-term stale.
              </p>
              
              <h3 className="text-white font-semibold mb-3">⚡ Real-time Feedback</h3>
              <p className="text-gray-400 text-sm">
                Stakers can see their APY grow throughout the week as rewards accumulate, 
                providing immediate feedback on staking performance.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-3">🔄 Clean Reset</h3>
              <p className="text-gray-400 text-sm mb-4">
                Weekly resets prevent the APY from becoming stale or misleading. Each week 
                starts fresh, reflecting current protocol performance.
              </p>
              
              <h3 className="text-white font-semibold mb-3">📊 Protocol Rhythm</h3>
              <p className="text-gray-400 text-sm">
                Aligns with natural protocol cycles and gives a meaningful timeframe 
                for performance assessment without being too granular.
              </p>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-yellow-300 mb-4">⚠️ Important Considerations</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h3 className="text-yellow-200 font-semibold">Projection, Not Guarantee</h3>
                <p className="text-yellow-100 text-sm">
                  The APY is an extrapolation based on current week performance. Actual annual 
                  returns will vary based on protocol activity, ETH distribution amounts, and market conditions.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h3 className="text-yellow-200 font-semibold">Variable Distribution Schedule</h3>
                <p className="text-yellow-100 text-sm">
                  ETH rewards are distributed based on protocol revenue and activity. Some weeks 
                  may have higher or lower distributions than others.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h3 className="text-yellow-200 font-semibold">Price Volatility Impact</h3>
                <p className="text-yellow-100 text-sm">
                  APY calculations use current ETH and $ABC prices. Significant price movements 
                  can affect the displayed APY even with consistent ETH reward amounts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Implementation */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">⚙️ Technical Implementation</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">Data Sources</h3>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• ETH distribution history from staking contract events</li>
                <li>• Real-time $ABC and ETH price feeds</li>
                <li>• Total staked amounts from blockchain state</li>
                <li>• Distribution timestamps for weekly cycle tracking</li>
              </ul>
            </div>
            
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">Update Frequency</h3>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• APY recalculated after each ETH distribution</li>
                <li>• Price data refreshed every 30 seconds</li>
                <li>• Weekly reset occurs every Sunday at 00:00 UTC</li>
                <li>• Historical data maintained for trend analysis</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Historical Context */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">📚 For More Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/docs/rewards-system"
              className="bg-gray-900/50 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors block"
            >
              <h3 className="text-white font-semibold mb-2">🎁 Rewards System</h3>
              <p className="text-gray-400 text-sm">
                Learn about the overall reward distribution mechanism and how ETH flows to stakers.
              </p>
            </a>
            
            <a
              href="/staking"
              className="bg-gray-900/50 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors block"
            >
              <h3 className="text-white font-semibold mb-2">🏦 Staking Dashboard</h3>
              <p className="text-gray-400 text-sm">
                View current APY, stake tokens, and monitor your rewards in real-time.
              </p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}