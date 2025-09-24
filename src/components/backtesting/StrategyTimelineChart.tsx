"use client";

import { PoolSnapshot } from "@/types/snapshots";

interface StrategyPeriod {
  start: number;
  end: number;
  active: boolean;
}

interface StrategyActivity {
  spot: StrategyPeriod[];
  curve: StrategyPeriod[];
  bidAsk: StrategyPeriod[];
}

interface StrategyCalculator {
  spot: {
    active: boolean;
    percentage: number;
    totalActive: number;
    totalSnapshots: number;
  };
  curve: {
    active: boolean;
    percentage: number;
    totalActive: number;
    totalSnapshots: number;
  };
  bidAsk: {
    active: boolean;
    percentage: number;
    totalActive: number;
    totalSnapshots: number;
  };
}

interface StrategyTimelineChartProps {
  snapshots: PoolSnapshot[];
  strategyActivity: StrategyActivity;
  strategyCalculator: StrategyCalculator;
  currentSnapshotIndex: number;
  isAnimating: boolean;
  timeRange: {
    start: number;
    end: number;
  };
}

export function StrategyTimelineChart({
  snapshots,
  strategyActivity,
  strategyCalculator,
  currentSnapshotIndex,
  isAnimating,
  timeRange,
}: StrategyTimelineChartProps) {
  if (snapshots.length === 0) return null;

  const strategies = [
    {
      key: "spot",
      name: "Spot",
      color: "bg-red-500",
      inactiveColor: "bg-gray-200",
    },
    {
      key: "curve",
      name: "Curve",
      color: "bg-yellow-500",
      inactiveColor: "bg-gray-200",
    },
    {
      key: "bidAsk",
      name: "Bid-Ask",
      color: "bg-green-500",
      inactiveColor: "bg-gray-200",
    },
  ] as const;

  const getCurrentTime = () => {
    if (snapshots[currentSnapshotIndex]) {
      return new Date(snapshots[currentSnapshotIndex].timestamp).getTime();
    }
    return timeRange.start;
  };

  const currentTime = getCurrentTime();
  const timePosition =
    ((currentTime - timeRange.start) / (timeRange.end - timeRange.start)) * 100;

  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Strategy Activity Timeline
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div
            className={`w-2 h-2 rounded-full ${
              isAnimating ? "bg-green-500 animate-pulse" : "bg-gray-400"
            }`}
          ></div>
          {isAnimating ? "Playing" : "Paused"}
        </div>
      </div>

      <div className="space-y-3">
        {/* Timeline container */}
        <div className="relative">
          {/* Time axis */}
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>{new Date(timeRange.start).toLocaleDateString()}</span>
            <span>{new Date(timeRange.end).toLocaleDateString()}</span>
          </div>

          {/* Current time indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-blue-600 z-10"
            style={{ left: `${timePosition}%` }}
          >
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-600 rounded-full"></div>
          </div>

          {/* Strategy rows */}
          <div className="space-y-2">
            {strategies.map((strategy, strategyIndex) => {
              const activity = strategyActivity[strategy.key];
              const calculator =
                strategyCalculator[
                  strategy.key as keyof typeof strategyCalculator
                ];
              const activePeriods = activity.filter((period) => period.active);
              const isCurrentlyActive = calculator.active;

              return (
                <div key={strategy.key} className="flex items-center">
                  {/* Strategy label */}
                  <div className="w-24 text-sm font-medium text-gray-700 flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded ${strategy.color} ${
                        isCurrentlyActive ? "animate-pulse" : ""
                      }`}
                    ></div>
                    {strategy.name}
                  </div>

                  {/* Timeline bar */}
                  <div className="flex-1 h-6 bg-gray-100 rounded relative overflow-hidden">
                    {/* Active segments */}
                    {activePeriods.map((period, periodIndex) => {
                      const startPos =
                        ((period.start - timeRange.start) /
                          (timeRange.end - timeRange.start)) *
                        100;
                      const endPos =
                        ((period.end - timeRange.start) /
                          (timeRange.end - timeRange.start)) *
                        100;
                      const width = endPos - startPos;

                      return (
                        <div
                          key={periodIndex}
                          className={`absolute h-full ${strategy.color} rounded-sm transition-all duration-300`}
                          style={{
                            left: `${startPos}%`,
                            width: `${width}%`,
                          }}
                          title={`${strategy.name}: ${new Date(
                            period.start
                          ).toLocaleString()} - ${new Date(
                            period.end
                          ).toLocaleString()}`}
                        />
                      );
                    })}

                    {/* Current time highlight */}
                    {isAnimating && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-blue-600 opacity-80"
                        style={{ left: `${timePosition}%` }}
                      />
                    )}

                    {/* Progress bar showing current percentage */}
                    <div
                      className={`absolute top-0 left-0 h-full ${strategy.color} opacity-30 rounded-sm transition-all duration-500`}
                      style={{
                        width: `${Math.min(
                          100,
                          (currentSnapshotIndex / snapshots.length) * 100
                        )}%`,
                      }}
                    />
                  </div>

                  {/* Real-time stats */}
                  <div className="w-20 text-right text-sm text-gray-600">
                    <div className="font-medium">{calculator.totalActive}</div>
                    <div className="text-xs text-gray-500">
                      {calculator.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend and stats */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-6 text-sm">
            {strategies.map((strategy) => (
              <div key={strategy.key} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${strategy.color}`}></div>
                <span>{strategy.name}</span>
              </div>
            ))}
          </div>

          <div className="text-sm text-gray-500">
            Current: {new Date(currentTime).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
