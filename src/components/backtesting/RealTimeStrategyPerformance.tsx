{
  /* Real-time Strategy Performance */
}
import { useState } from "react";

interface RealTimeStrategyPerformanceProps {
  strategyCalculator: any;
  setHoveredTooltip: (tooltip: string | null) => void;
  hoveredTooltip: string | null;
  currentSnapshotIndex: number;
  totalSnapshots: number;
  isAnimating: boolean;
}

export function RealTimeStrategyPerformance({
  strategyCalculator,
  setHoveredTooltip,
  hoveredTooltip,
  currentSnapshotIndex,
  totalSnapshots,
  isAnimating,
}: RealTimeStrategyPerformanceProps) {
  return (
    <div className="bg-white rounded-lg  p-4 mb-8 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-700">
            {isAnimating
              ? "Live Strategy Performance"
              : "Final Strategy Performance"}
          </h3>
          {(totalSnapshots ?? 0) > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Progress:</span>
              <div className="flex items-center gap-1">
                <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        (((currentSnapshotIndex ?? 0) + 1) /
                          (totalSnapshots ?? 1)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium">
                  {(currentSnapshotIndex ?? 0) + 1}/{totalSnapshots ?? 0}
                </span>
              </div>
            </div>
          )}
        </div>
        <div
          className="text-xs text-gray-500 cursor-help relative"
          onMouseEnter={() => setHoveredTooltip("overview")}
          onMouseLeave={() => setHoveredTooltip(null)}
        >
          ℹ️ How to read these metrics
          {hoveredTooltip === "overview" && (
            <div className="absolute bottom-full right-0 mb-2 w-80 p-3 bg-gray-900 text-white text-xs rounded shadow-lg z-50">
              <div className="font-semibold mb-2">
                Understanding Strategy Performance
              </div>
              <div className="space-y-2 text-gray-300">
                <div>
                  <strong>Active:</strong> How many snapshots the strategy was
                  active (up to current snapshot)
                </div>
                <div>
                  <strong>Rate:</strong> Percentage of time the strategy was
                  active (up to current snapshot)
                </div>
                <div>
                  <strong>Avg Liquidity Utilization:</strong> Average
                  utilization when strategy is active (fair comparison)
                </div>
                <div>
                  <strong>Efficiency:</strong> Overall utilization across
                  processed snapshots
                </div>
                <div>
                  <strong>Peak:</strong> Highest utilization achieved so far
                </div>
              </div>
              <div className="mt-2 text-blue-300 text-xs">
                💡 Metrics update in real-time as snapshots are processed
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            key: "spot",
            name: "Spot",
            color: "text-red-600",
            bgColor: "bg-red-50",
            borderColor: "border-red-200",
          },
          {
            key: "curve",
            name: "Curve",
            color: "text-yellow-600",
            bgColor: "bg-yellow-50",
            borderColor: "border-yellow-200",
          },
          {
            key: "bidAsk",
            name: "Bid-Ask",
            color: "text-green-600",
            bgColor: "bg-green-50",
            borderColor: "border-green-200",
          },
        ].map((strategy) => {
          const calculator =
            strategyCalculator[strategy.key as keyof typeof strategyCalculator];
          const isCurrentlyActive = calculator.active;

          return (
            <div
              key={strategy.key}
              className={`p-3 rounded-lg border-2 transition-all ${
                isCurrentlyActive
                  ? `${strategy.bgColor} ${strategy.borderColor} border-2`
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`text-sm font-medium ${strategy.color}`}>
                  {strategy.name}
                </div>
                <div
                  className={`w-2 h-2 rounded-full ${
                    isCurrentlyActive
                      ? "bg-green-500 animate-pulse"
                      : "bg-gray-300"
                  }`}
                />
              </div>

              {/* Activity Stats */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span
                    className="cursor-help relative"
                    onMouseEnter={() =>
                      setHoveredTooltip(`${strategy.key}-active`)
                    }
                    onMouseLeave={() => setHoveredTooltip(null)}
                  >
                    Active:
                    {hoveredTooltip === `${strategy.key}-active` && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-50">
                        <div className="font-semibold mb-1">
                          Active Snapshots
                        </div>
                        <div>
                          Number of snapshots where this strategy was active
                          (active bin within strategy's bin range)
                        </div>
                        <div className="mt-1 text-gray-300">
                          Calculation: Count of snapshots where active bin ∈
                          strategy bins
                        </div>
                      </div>
                    )}
                  </span>
                  <span className="font-medium">
                    {calculator.totalActive}/{calculator.totalSnapshots}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span
                    className="cursor-help relative"
                    onMouseEnter={() =>
                      setHoveredTooltip(`${strategy.key}-rate`)
                    }
                    onMouseLeave={() => setHoveredTooltip(null)}
                  >
                    Rate:
                    {hoveredTooltip === `${strategy.key}-rate` && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-50">
                        <div className="font-semibold mb-1">Activity Rate</div>
                        <div>Percentage of time this strategy was active</div>
                        <div className="mt-1 text-gray-300">
                          Calculation: (Active snapshots / Total snapshots) ×
                          100
                        </div>
                      </div>
                    )}
                  </span>
                  <span className="font-medium">
                    {calculator.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Utilization Metrics */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span
                    className="text-gray-500 cursor-help relative"
                    onMouseEnter={() =>
                      setHoveredTooltip(`${strategy.key}-when-active`)
                    }
                    onMouseLeave={() => setHoveredTooltip(null)}
                  >
                    Avg Liquidity Utilization When Active:
                    {hoveredTooltip === `${strategy.key}-when-active` && (
                      <div className="absolute bottom-full left-0 mb-2 w-72 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-50">
                        <div className="font-semibold mb-1">
                          Average Utilization When Active
                        </div>
                        <div>
                          Average liquidity utilization when strategy is active
                          (fair comparison)
                        </div>
                        <div className="mt-1 text-gray-300">
                          Calculation: (Sum of utilization when active) /
                          (Number of active snapshots)
                        </div>
                        <div className="mt-1 text-blue-300">
                          Only includes snapshots where strategy is active
                        </div>
                      </div>
                    )}
                  </span>
                  <span className={`font-medium ${strategy.color}`}>
                    {calculator.avgUtilizationWhenActive.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span
                    className="text-gray-500 cursor-help relative"
                    onMouseEnter={() =>
                      setHoveredTooltip(`${strategy.key}-efficiency`)
                    }
                    onMouseLeave={() => setHoveredTooltip(null)}
                  >
                    Efficiency:
                    {hoveredTooltip === `${strategy.key}-efficiency` && (
                      <div className="absolute bottom-full left-0 mb-2 w-72 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-50">
                        <div className="font-semibold mb-1">
                          Overall Efficiency
                        </div>
                        <div>
                          Average utilization across all snapshots (shows
                          overall contribution)
                        </div>
                        <div className="mt-1 text-gray-300">
                          Calculation: (Sum of all utilization) / (Total
                          snapshots)
                        </div>
                        <div className="mt-1 text-blue-300">
                          Includes inactive snapshots (0% utilization)
                        </div>
                      </div>
                    )}
                  </span>
                  <span className="font-medium text-gray-700">
                    {calculator.overallEfficiency.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span
                    className="text-gray-500 cursor-help relative"
                    onMouseEnter={() =>
                      setHoveredTooltip(`${strategy.key}-peak`)
                    }
                    onMouseLeave={() => setHoveredTooltip(null)}
                  >
                    Peak:
                    {hoveredTooltip === `${strategy.key}-peak` && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-50">
                        <div className="font-semibold mb-1">
                          Peak Utilization
                        </div>
                        <div>
                          Highest utilization achieved during the analysis
                          period
                        </div>
                        <div className="mt-1 text-gray-300">
                          Calculation: Max(utilization across all active
                          snapshots)
                        </div>
                      </div>
                    )}
                  </span>
                  <span className="font-medium text-gray-700">
                    {calculator.peakUtilization.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
