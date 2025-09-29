import React from "react";

interface StrategyPeriod {
  start: number;
  end: number;
  active: boolean;
  liquidityPercentage?: number; // 0-100, percentage of total liquidity active
}

interface StrategyActivity {
  spot: StrategyPeriod[];
  curve: StrategyPeriod[];
  bidAsk: StrategyPeriod[];
}

interface GanttActivityChartProps {
  strategyActivity: StrategyActivity;
  timeRange?: {
    start: number;
    end: number;
  };
}

export function GanttActivityChart({
  strategyActivity,
  timeRange,
}: GanttActivityChartProps) {
  const strategies = [
    { key: "spot", name: "Spot", color: "bg-blue-500" },
    { key: "curve", name: "Curve", color: "bg-green-500" },
    { key: "bidAsk", name: "Bid-Ask", color: "bg-purple-500" },
  ];

  // Calculate time range if not provided
  const getTimeRange = () => {
    if (timeRange) return timeRange;

    const allTimestamps = [
      ...strategyActivity.spot.map((p) => p.start),
      ...strategyActivity.curve.map((p) => p.start),
      ...strategyActivity.bidAsk.map((p) => p.start),
    ];

    return {
      start: Math.min(...allTimestamps),
      end: Math.max(...allTimestamps),
    };
  };

  const { start: timeStart, end: timeEnd } = getTimeRange();
  const totalDuration = timeEnd - timeStart;

  // Convert timestamp to percentage position
  const getPosition = (timestamp: number) => {
    return ((timestamp - timeStart) / totalDuration) * 100;
  };

  // Convert duration to percentage width
  const getWidth = (start: number, end: number) => {
    return ((end - start) / totalDuration) * 100;
  };

  // Group consecutive periods of same activity status and similar liquidity percentage
  const groupPeriods = (periods: StrategyPeriod[]) => {
    if (periods.length === 0) return [];

    const grouped = [];
    let currentGroup = {
      start: periods[0].start,
      end: periods[0].end,
      active: periods[0].active,
      liquidityPercentage: periods[0].liquidityPercentage || 0,
    };

    for (let i = 1; i < periods.length; i++) {
      const period = periods[i];

      // If same activity status and similar liquidity percentage, extend current group
      const liquidityDiff = Math.abs(
        (period.liquidityPercentage || 0) - currentGroup.liquidityPercentage
      );
      if (period.active === currentGroup.active && liquidityDiff < 5) {
        // 5% tolerance
        currentGroup.end = period.end;
        // Average the liquidity percentage
        currentGroup.liquidityPercentage =
          (currentGroup.liquidityPercentage +
            (period.liquidityPercentage || 0)) /
          2;
      } else {
        // Different status or significant liquidity change, save current group and start new one
        grouped.push({ ...currentGroup });
        currentGroup = {
          start: period.start,
          end: period.end,
          active: period.active,
          liquidityPercentage: period.liquidityPercentage || 0,
        };
      }
    }

    // Add the last group
    grouped.push(currentGroup);
    return grouped;
  };

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Strategy Activity Timeline</h3>

      <div className="space-y-3">
        {strategies.map((strategy) => {
          const activity =
            strategyActivity[strategy.key as keyof StrategyActivity];
          const groupedPeriods = groupPeriods(activity);

          return (
            <div key={strategy.key} className="flex items-center">
              {/* Strategy label */}
              <div className="w-20 text-sm font-medium text-gray-700 flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${strategy.color}`}></div>
                {strategy.name}
              </div>

              {/* Timeline bar */}
              <div className="flex-1 h-6 bg-gray-200 rounded relative overflow-hidden">
                {groupedPeriods.map((period, index) => {
                  const left = getPosition(period.start);
                  const width = getWidth(period.start, period.end);
                  const opacity = period.active
                    ? (period.liquidityPercentage || 100) / 100
                    : 0.3;

                  return (
                    <div
                      key={index}
                      className={`absolute h-full ${
                        period.active ? strategy.color : "bg-gray-400"
                      }`}
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        opacity: opacity,
                      }}
                      title={`${period.active ? "Active" : "Inactive"} - ${(
                        period.liquidityPercentage || 0
                      ).toFixed(1)}% liquidity`}
                    />
                  );
                })}
              </div>

              {/* Liquidity percentage label */}
              <div className="w-16 text-xs text-gray-600 text-right">
                {groupedPeriods.length > 0 &&
                groupedPeriods[groupedPeriods.length - 1].active
                  ? `${(
                      groupedPeriods[groupedPeriods.length - 1]
                        .liquidityPercentage || 0
                    ).toFixed(0)}%`
                  : "0%"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time labels */}
      <div className="mt-4 flex justify-between text-xs text-gray-500">
        <span>{new Date(timeStart).toLocaleString()}</span>
        <span>{new Date(timeEnd).toLocaleString()}</span>
      </div>
    </div>
  );
}
