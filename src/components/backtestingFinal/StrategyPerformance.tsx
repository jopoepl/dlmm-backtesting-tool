import React, { useState } from "react";
import { Strategy } from "@/types/strategy";

// Info icon component
const InfoIcon: React.FC<{
  title: string;
  content: string;
  className?: string;
}> = ({ title, content, className = "" }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center justify-center w-3 h-3 rounded-full bg-gray-400 hover:bg-gray-500 text-white text-xs font-bold transition-colors ${className}`}
        aria-label={`Info about ${title}`}
      >
        i
      </button>
      {showTooltip && (
        <div className="absolute z-10 w-80 p-3 mt-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg left-1/2 transform -translate-x-1/2">
          <div className="font-semibold mb-1">{title}</div>
          <div className="text-gray-300">{content}</div>
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      )}
    </div>
  );
};

interface StrategyPerformanceProps {
  strategy: Strategy;
  performance?: any;
  config?: {
    totalLiquidity: number;
    binRange: number;
    selectedPeriod: string;
    days: number;
    totalBins: number;
  };
}

const StrategyPerformance: React.FC<StrategyPerformanceProps> = ({
  strategy,
  performance,
  config,
}) => {
  const [showDebug, setShowDebug] = useState(false);
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="space-y-4">
      {/* Performance Results */}
      {performance ? (
        <div className="space-y-6">
          {/* Header with Configuration */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              Backtesting Results
            </h2>
            {config && (
              <span className="text-sm text-gray-600">
                ${config.totalLiquidity.toLocaleString()} invested among{" "}
                {config.totalBins} bins for {config.days} days
              </span>
            )}
          </div>
          {/* Time in Range Metrics */}
          <div className="bg-white rounded border border-black p-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Time in Range Analysis
              </h3>
              <InfoIcon
                title="Time in Range"
                content="Measures the percentage of time each strategy's bins were active (contained the current price). Higher percentages indicate better strategy positioning relative to market movements."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(() => {
                const spot = performance.timeInRange?.spotInRange || 0;
                const curve = performance.timeInRange?.curveInRange || 0;
                const bidAsk = performance.timeInRange?.bidAskInRange || 0;
                const max = Math.max(spot, curve, bidAsk);
                const allEqual =
                  spot === curve && curve === bidAsk && spot === max;
                const isSpotBest = allEqual || max === spot;
                const isCurveBest = allEqual || max === curve;
                const isBidAskBest = allEqual || max === bidAsk;

                return (
                  <>
                    <div
                      className={`rounded p-3 border border-black ${
                        isSpotBest ? "bg-green-50" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-xs font-medium ${
                              isSpotBest ? "text-green-800" : "text-gray-800"
                            }`}
                          >
                            Spot Strategy
                          </span>
                          <InfoIcon
                            title="Spot Strategy"
                            content="Equal liquidity allocation across all bins in the range. Provides consistent coverage but may not optimize for market conditions."
                          />
                        </div>
                        <span
                          className={`text-lg font-bold ${
                            isSpotBest ? "text-green-900" : "text-gray-900"
                          }`}
                        >
                          {(spot * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded h-1.5">
                        <div
                          className={`h-1.5 rounded transition-all duration-500 ${
                            isSpotBest ? "bg-green-600" : "bg-gray-600"
                          }`}
                          style={{
                            width: `${spot * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div
                      className={`rounded p-3 border border-black ${
                        isCurveBest ? "bg-green-50" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-xs font-medium ${
                              isCurveBest ? "text-green-800" : "text-gray-800"
                            }`}
                          >
                            Curve Strategy
                          </span>
                          <InfoIcon
                            title="Curve Strategy"
                            content="Gaussian distribution of liquidity, concentrated around the current price. More efficient for stable markets with predictable price movements."
                          />
                        </div>
                        <span
                          className={`text-lg font-bold ${
                            isCurveBest ? "text-green-900" : "text-gray-900"
                          }`}
                        >
                          {(curve * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded h-1.5">
                        <div
                          className={`h-1.5 rounded transition-all duration-500 ${
                            isCurveBest ? "bg-green-600" : "bg-gray-600"
                          }`}
                          style={{
                            width: `${curve * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div
                      className={`rounded p-3 border border-black ${
                        isBidAskBest ? "bg-green-50" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-xs font-medium ${
                              isBidAskBest ? "text-green-800" : "text-gray-800"
                            }`}
                          >
                            Bid-Ask Strategy
                          </span>
                          <InfoIcon
                            title="Bid-Ask Strategy"
                            content="U-shaped distribution concentrating liquidity at the edges. Optimized for volatile markets with frequent price swings."
                          />
                        </div>
                        <span
                          className={`text-lg font-bold ${
                            isBidAskBest ? "text-green-900" : "text-gray-900"
                          }`}
                        >
                          {(bidAsk * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded h-1.5">
                        <div
                          className={`h-1.5 rounded transition-all duration-500 ${
                            isBidAskBest ? "bg-green-600" : "bg-gray-600"
                          }`}
                          style={{
                            width: `${bidAsk * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Liquidity Efficiency Metrics */}
          <div className="bg-white rounded border border-black p-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Liquidity Efficiency
              </h3>
              <InfoIcon
                title="Liquidity Efficiency"
                content="Measures how effectively each strategy utilizes its allocated liquidity. Calculated as the average proportion of total deployed liquidity that was active during each snapshot."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(() => {
                const spot = performance.liquidityEfficiency?.spot || 0;
                const curve = performance.liquidityEfficiency?.curve || 0;
                const bidAsk = performance.liquidityEfficiency?.bidAsk || 0;
                const max = Math.max(spot, curve, bidAsk);
                const isSpotBest = max === spot;
                const isCurveBest = max === curve;
                const isBidAskBest = max === bidAsk;

                return (
                  <>
                    <div
                      className={`rounded p-3 border border-black ${
                        isSpotBest ? "bg-green-50" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-xs font-medium ${
                              isSpotBest ? "text-green-800" : "text-gray-800"
                            }`}
                          >
                            Spot Efficiency
                          </span>
                          <InfoIcon
                            title="Spot Efficiency"
                            content="Efficiency of equal distribution strategy. Shows how much of the allocated liquidity was actually earning fees during active periods."
                          />
                        </div>
                        <span
                          className={`text-lg font-bold ${
                            isSpotBest ? "text-green-900" : "text-gray-900"
                          }`}
                        >
                          {(spot * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p
                        className={`text-xs ${
                          isSpotBest ? "text-green-600" : "text-gray-600"
                        }`}
                      >
                        Average liquidity utilization
                      </p>
                    </div>

                    <div
                      className={`rounded p-3 border border-black ${
                        isCurveBest ? "bg-green-50" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-xs font-medium ${
                              isCurveBest ? "text-green-800" : "text-gray-800"
                            }`}
                          >
                            Curve Efficiency
                          </span>
                          <InfoIcon
                            title="Curve Efficiency"
                            content="Efficiency of Gaussian distribution strategy. Measures how well the concentrated liquidity around the current price performs."
                          />
                        </div>
                        <span
                          className={`text-lg font-bold ${
                            isCurveBest ? "text-green-900" : "text-gray-900"
                          }`}
                        >
                          {(curve * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p
                        className={`text-xs ${
                          isCurveBest ? "text-green-600" : "text-gray-600"
                        }`}
                      >
                        Average liquidity utilization
                      </p>
                    </div>

                    <div
                      className={`rounded p-3 border border-black ${
                        isBidAskBest ? "bg-green-50" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-xs font-medium ${
                              isBidAskBest ? "text-green-800" : "text-gray-800"
                            }`}
                          >
                            Bid-Ask Efficiency
                          </span>
                          <InfoIcon
                            title="Bid-Ask Efficiency"
                            content="Efficiency of U-shaped distribution strategy. Shows how well edge-concentrated liquidity captures trading volume."
                          />
                        </div>
                        <span
                          className={`text-lg font-bold ${
                            isBidAskBest ? "text-green-900" : "text-gray-900"
                          }`}
                        >
                          {(bidAsk * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p
                        className={`text-xs ${
                          isBidAskBest ? "text-green-600" : "text-gray-600"
                        }`}
                      >
                        Average liquidity utilization
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Fee Earnings */}
          <div className="bg-white rounded border border-black p-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Fee Earnings (USD)
              </h3>
              <InfoIcon
                title="Fee Earnings"
                content="Total fees earned by each strategy based on trading volume and liquidity share. Calculated using daily volume data, protocol fees, and each strategy's proportional liquidity in active bins."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(() => {
                const spot = performance.strategyWiseFees?.spot || 0;
                const curve = performance.strategyWiseFees?.curve || 0;
                const bidAsk = performance.strategyWiseFees?.bidAsk || 0;
                const max = Math.max(spot, curve, bidAsk);
                const isSpotBest = max === spot;
                const isCurveBest = max === curve;
                const isBidAskBest = max === bidAsk;

                return (
                  <>
                    <div
                      className={`rounded p-3 border border-black ${
                        isSpotBest ? "bg-green-50" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-xs font-medium ${
                              isSpotBest ? "text-green-800" : "text-gray-800"
                            }`}
                          >
                            Spot Fees
                          </span>
                          <InfoIcon
                            title="Spot Fees"
                            content="Fees earned by the equal distribution strategy. Based on the strategy's share of liquidity in active bins during trading periods."
                          />
                        </div>
                        <span
                          className={`text-lg font-bold ${
                            isSpotBest ? "text-green-900" : "text-gray-900"
                          }`}
                        >
                          ${spot.toFixed(2)}
                        </span>
                      </div>
                      <p
                        className={`text-xs ${
                          isSpotBest ? "text-green-600" : "text-gray-600"
                        }`}
                      >
                        Total fees earned
                      </p>
                    </div>

                    <div
                      className={`rounded p-3 border border-black ${
                        isCurveBest ? "bg-green-50" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-xs font-medium ${
                              isCurveBest ? "text-green-800" : "text-gray-800"
                            }`}
                          >
                            Curve Fees
                          </span>
                          <InfoIcon
                            title="Curve Fees"
                            content="Fees earned by the Gaussian distribution strategy. Higher concentration around current price may lead to more consistent fee generation."
                          />
                        </div>
                        <span
                          className={`text-lg font-bold ${
                            isCurveBest ? "text-green-900" : "text-gray-900"
                          }`}
                        >
                          ${curve.toFixed(2)}
                        </span>
                      </div>
                      <p
                        className={`text-xs ${
                          isCurveBest ? "text-green-600" : "text-gray-600"
                        }`}
                      >
                        Total fees earned
                      </p>
                    </div>

                    <div
                      className={`rounded p-3 border border-black ${
                        isBidAskBest ? "bg-green-50" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-xs font-medium ${
                              isBidAskBest ? "text-green-800" : "text-gray-800"
                            }`}
                          >
                            Bid-Ask Fees
                          </span>
                          <InfoIcon
                            title="Bid-Ask Fees"
                            content="Fees earned by the U-shaped distribution strategy. Edge-concentrated liquidity may capture more volume during volatile periods."
                          />
                        </div>
                        <span
                          className={`text-lg font-bold ${
                            isBidAskBest ? "text-green-900" : "text-gray-900"
                          }`}
                        >
                          ${bidAsk.toFixed(2)}
                        </span>
                      </div>
                      <p
                        className={`text-xs ${
                          isBidAskBest ? "text-green-600" : "text-gray-600"
                        }`}
                      >
                        Total fees earned
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Strategy Comparison Summary */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded border border-black p-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Strategy Performance Summary
              </h3>
              <InfoIcon
                title="Performance Summary"
                content="Key performance indicators comparing all strategies. Shows the best performing strategy for each metric and total earnings across all strategies."
              />
            </div>
            <div className="space-y-2">
              {config && (
                <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-gray-700">
                      Configuration:
                    </span>
                    <InfoIcon
                      title="Strategy Configuration"
                      content="Shows the selected parameters for this backtesting analysis including liquidity amount, bin range, and time period."
                    />
                  </div>
                  <span className="text-xs text-gray-600">
                    ${config.totalLiquidity.toLocaleString()} invested among{" "}
                    {config.totalBins} bins for {config.days} days
                  </span>
                </div>
              )}

              {performance.strategyWiseFees && (
                <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-gray-700">
                      Most Fees Earned:
                    </span>
                    <InfoIcon
                      title="Most Fees Earned"
                      content="The strategy that earned the highest amount of fees during the backtesting period."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">
                      {(() => {
                        const spot = performance.strategyWiseFees.spot || 0;
                        const curve = performance.strategyWiseFees.curve || 0;
                        const bidAsk = performance.strategyWiseFees.bidAsk || 0;
                        const max = Math.max(spot, curve, bidAsk);
                        if (max === spot) return "Spot";
                        if (max === curve) return "Curve";
                        return "Bid-Ask";
                      })()}
                    </span>
                    <span className="text-sm font-bold text-gray-700">
                      $
                      {Math.max(
                        performance.strategyWiseFees.spot || 0,
                        performance.strategyWiseFees.curve || 0,
                        performance.strategyWiseFees.bidAsk || 0
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {performance.timeInRange && (
                <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-gray-700">
                      Time in Range:
                    </span>
                    <InfoIcon
                      title="Time in Range"
                      content="Percentage of time any strategy was active. All strategies share the same time in range since they use identical bin ranges based on the same spread."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">
                      All Strategies
                    </span>
                    <span className="text-sm font-bold text-gray-700">
                      {(
                        (performance.timeInRange.spotInRange || 0) * 100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>
              )}

              {performance.liquidityEfficiency && (
                <div className="flex justify-between items-center py-1.5">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-gray-700">
                      Best Efficiency:
                    </span>
                    <InfoIcon
                      title="Best Efficiency"
                      content="The highest liquidity utilization rate among all strategies. Shows which strategy most effectively used its allocated capital."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">
                      {(() => {
                        const spot = performance.liquidityEfficiency.spot || 0;
                        const curve =
                          performance.liquidityEfficiency.curve || 0;
                        const bidAsk =
                          performance.liquidityEfficiency.bidAsk || 0;
                        const max = Math.max(spot, curve, bidAsk);
                        if (max === spot) return "Spot";
                        if (max === curve) return "Curve";
                        return "Bid-Ask";
                      })()}
                    </span>
                    <span className="text-sm font-bold text-gray-700">
                      {(
                        Math.max(
                          performance.liquidityEfficiency.spot || 0,
                          performance.liquidityEfficiency.curve || 0,
                          performance.liquidityEfficiency.bidAsk || 0
                        ) * 100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded p-6 border-2 border-dashed border-gray-300 text-center">
          <div className="animate-pulse">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-3 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Calculating Performance...
            </p>
            <p className="text-xs text-gray-600">
              Running backtesting analysis on your strategy
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategyPerformance;
