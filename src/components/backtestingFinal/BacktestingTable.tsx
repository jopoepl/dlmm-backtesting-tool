import React, { useState, useEffect, useMemo } from "react";
import { Strategy, PoolSnapshot } from "@/types/strategy";
import {
  calculateStrategyPerformance,
  allocateSpotLiquidity,
  allocateCurveLiquidity,
  allocateBidAskLiquidity,
} from "@/lib/backtestingFinal/backtestingCalculations";

interface BacktestingTableProps {
  snapshots: PoolSnapshot[];
  ohlcvData: any;
  periodToDays: (period: string) => number;
}

interface ConfigResult {
  liquidity: number;
  binRange: number;
  totalBins: number;
  period: string;
  days: number;
  spot: {
    timeInRange: number;
    efficiency: number;
    fees: number;
  };
  curve: {
    timeInRange: number;
    efficiency: number;
    fees: number;
  };
  bidAsk: {
    timeInRange: number;
    efficiency: number;
    fees: number;
  };
}

const BacktestingTable: React.FC<BacktestingTableProps> = ({
  snapshots,
  ohlcvData,
  periodToDays,
}) => {
  const [results, setResults] = useState<ConfigResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuration combinations to test
  const configs = [
    // 7 days
    { liquidity: 1000, binRange: 1, bins: 3, period: "7d", days: 7 },
    { liquidity: 1000, binRange: 2, bins: 5, period: "7d", days: 7 },
    { liquidity: 1000, binRange: 5, bins: 11, period: "7d", days: 7 },
    { liquidity: 1000, binRange: 10, bins: 21, period: "7d", days: 7 },
    { liquidity: 2000, binRange: 1, bins: 3, period: "7d", days: 7 },
    { liquidity: 2000, binRange: 2, bins: 5, period: "7d", days: 7 },
    { liquidity: 2000, binRange: 5, bins: 11, period: "7d", days: 7 },
    { liquidity: 2000, binRange: 10, bins: 21, period: "7d", days: 7 },
    { liquidity: 5000, binRange: 1, bins: 3, period: "7d", days: 7 },
    { liquidity: 5000, binRange: 2, bins: 5, period: "7d", days: 7 },
    { liquidity: 5000, binRange: 5, bins: 11, period: "7d", days: 7 },
    { liquidity: 5000, binRange: 10, bins: 21, period: "7d", days: 7 },
    { liquidity: 10000, binRange: 1, bins: 3, period: "7d", days: 7 },
    { liquidity: 10000, binRange: 2, bins: 5, period: "7d", days: 7 },
    { liquidity: 10000, binRange: 5, bins: 11, period: "7d", days: 7 },
    { liquidity: 10000, binRange: 10, bins: 21, period: "7d", days: 7 },
    // 30 days
    { liquidity: 1000, binRange: 1, bins: 3, period: "30d", days: 30 },
    { liquidity: 1000, binRange: 2, bins: 5, period: "30d", days: 30 },
    { liquidity: 1000, binRange: 5, bins: 11, period: "30d", days: 30 },
    { liquidity: 1000, binRange: 10, bins: 21, period: "30d", days: 30 },
    { liquidity: 2000, binRange: 1, bins: 3, period: "30d", days: 30 },
    { liquidity: 2000, binRange: 2, bins: 5, period: "30d", days: 30 },
    { liquidity: 2000, binRange: 5, bins: 11, period: "30d", days: 30 },
    { liquidity: 2000, binRange: 10, bins: 21, period: "30d", days: 30 },
    { liquidity: 5000, binRange: 1, bins: 3, period: "30d", days: 30 },
    { liquidity: 5000, binRange: 2, bins: 5, period: "30d", days: 30 },
    { liquidity: 5000, binRange: 5, bins: 11, period: "30d", days: 30 },
    { liquidity: 5000, binRange: 10, bins: 21, period: "30d", days: 30 },
    { liquidity: 10000, binRange: 1, bins: 3, period: "30d", days: 30 },
    { liquidity: 10000, binRange: 2, bins: 5, period: "30d", days: 30 },
    { liquidity: 10000, binRange: 5, bins: 11, period: "30d", days: 30 },
    { liquidity: 10000, binRange: 10, bins: 21, period: "30d", days: 30 },
  ];

  // Calculate results for all configurations
  useEffect(() => {
    const calculateAllResults = async () => {
      if (snapshots.length === 0 || !ohlcvData || ohlcvData.length === 0)
        return;

      setLoading(true);
      setError(null);

      try {
        const results: ConfigResult[] = [];

        for (const config of configs) {
          console.log(
            `🔄 Calculating config: $${config.liquidity}, ${config.totalBins} bins, ${config.period}`
          );

          // Filter snapshots based on time period
          const latestSnapshotTime = Math.max(
            ...snapshots.map((s) => s.timestamp)
          );
          const latestDate = new Date(latestSnapshotTime);
          const endTime = latestSnapshotTime;
          const startTime = endTime - config.days * 24 * 60 * 60 * 1000;

          const filteredSnapshots = snapshots.filter(
            (snapshot) =>
              snapshot.timestamp >= startTime && snapshot.timestamp <= endTime
          );

          if (filteredSnapshots.length === 0) {
            console.log(`⚠️ No snapshots found for ${config.period}`);
            continue;
          }

          console.log(
            `📊 Using ${filteredSnapshots.length} snapshots for ${config.period}`
          );

          // Get the starting snapshot for strategy generation
          const startingSnapshot = filteredSnapshots[0];
          if (!startingSnapshot) continue;

          // Generate strategies for this configuration
          const spotStrategy = allocateSpotLiquidity({
            LiquidityToAllocate: config.liquidity,
            snapshot: startingSnapshot,
            binRange: config.binRange,
          });

          const curveStrategy = allocateCurveLiquidity({
            LiquidityToAllocate: config.liquidity,
            snapshot: startingSnapshot,
            binRange: config.binRange,
            concentration: "medium",
          });

          const bidAskStrategy = allocateBidAskLiquidity({
            LiquidityToAllocate: config.liquidity,
            snapshot: startingSnapshot,
            binRange: config.binRange,
            concentration: "medium",
          });

          // Create strategy object with generated allocations
          const strategy: Strategy = {
            spot: spotStrategy,
            curve: curveStrategy,
            bidAsk: bidAskStrategy,
          };

          // Calculate performance for each strategy
          const performance = await calculateStrategyPerformance(
            strategy,
            filteredSnapshots,
            config.liquidity,
            ohlcvData
          );

          console.log(
            `✅ Completed config: $${config.liquidity}, ${config.totalBins} bins, ${config.period}`
          );
          console.log(
            `   Spot: ${(
              performance.timeInRange?.spotInRange * 100 || 0
            ).toFixed(1)}% time, ${(
              performance.liquidityEfficiency?.spot * 100 || 0
            ).toFixed(1)}% efficiency, $${(
              performance.strategyWiseFees?.spot || 0
            ).toFixed(2)} fees`
          );
          console.log(
            `   Curve: ${(
              performance.timeInRange?.curveInRange * 100 || 0
            ).toFixed(1)}% time, ${(
              performance.liquidityEfficiency?.curve * 100 || 0
            ).toFixed(1)}% efficiency, $${(
              performance.strategyWiseFees?.curve || 0
            ).toFixed(2)} fees`
          );
          console.log(
            `   Bid-Ask: ${(
              performance.timeInRange?.bidAskInRange * 100 || 0
            ).toFixed(1)}% time, ${(
              performance.liquidityEfficiency?.bidAsk * 100 || 0
            ).toFixed(1)}% efficiency, $${(
              performance.strategyWiseFees?.bidAsk || 0
            ).toFixed(2)} fees`
          );

          results.push({
            liquidity: config.liquidity,
            binRange: config.binRange,
            totalBins: config.bins,
            period: config.period,
            days: config.days,
            spot: {
              timeInRange: performance.timeInRange?.spotInRange || 0,
              efficiency: performance.liquidityEfficiency?.spot || 0,
              fees: performance.strategyWiseFees?.spot || 0,
            },
            curve: {
              timeInRange: performance.timeInRange?.curveInRange || 0,
              efficiency: performance.liquidityEfficiency?.curve || 0,
              fees: performance.strategyWiseFees?.curve || 0,
            },
            bidAsk: {
              timeInRange: performance.timeInRange?.bidAskInRange || 0,
              efficiency: performance.liquidityEfficiency?.bidAsk || 0,
              fees: performance.strategyWiseFees?.bidAsk || 0,
            },
          });
        }

        setResults(results);
      } catch (err) {
        setError("Failed to calculate backtesting results");
        console.error("Backtesting calculation error:", err);
      } finally {
        setLoading(false);
      }
    };

    calculateAllResults();
  }, [snapshots, ohlcvData]);

  // Find best performing strategy and config
  const bestPerformers = useMemo(() => {
    if (results.length === 0) return null;

    let bestEfficiency = { value: 0, config: "", strategy: "" };
    let bestFees = { value: 0, config: "", strategy: "" };

    results.forEach((result) => {
      const configLabel = `$${result.liquidity.toLocaleString()}, ${
        result.totalBins
      } bins, ${result.period}`;

      // Check efficiency for summary
      const strategies = [
        { name: "Spot", value: result.spot.efficiency },
        { name: "Curve", value: result.curve.efficiency },
        { name: "Bid-Ask", value: result.bidAsk.efficiency },
      ];

      strategies.forEach((strategy) => {
        if (strategy.value > bestEfficiency.value) {
          bestEfficiency = {
            value: strategy.value,
            config: configLabel,
            strategy: strategy.name,
          };
        }
      });

      // Check fees for summary
      const feeStrategies = [
        { name: "Spot", value: result.spot.fees },
        { name: "Curve", value: result.curve.fees },
        { name: "Bid-Ask", value: result.bidAsk.fees },
      ];

      feeStrategies.forEach((strategy) => {
        if (strategy.value > bestFees.value) {
          bestFees = {
            value: strategy.value,
            config: configLabel,
            strategy: strategy.name,
          };
        }
      });
    });

    return { bestEfficiency, bestFees };
  }, [results]);

  if (loading) {
    return (
      <div className="bg-white rounded border border-black p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Calculating results...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded border border-black p-6">
        <div className="text-red-600 text-center">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-white rounded border border-black p-6">
        <div className="text-gray-600 text-center">
          <p>No data available for backtesting comparison</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          Strategy Performance Comparison
        </h2>
        <span className="text-sm text-gray-600">
          Comparing strategies across different configurations
        </span>
      </div>

      {/* Best Performers Summary */}
      {bestPerformers && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded border border-black p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">
            Best Performers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded p-3 border border-gray-200">
              <div className="text-xs font-medium text-gray-700 mb-1">
                Best Efficiency
              </div>
              <div className="text-sm font-bold text-gray-900">
                {bestPerformers.bestEfficiency.strategy}
              </div>
              <div className="text-xs text-gray-600">
                {bestPerformers.bestEfficiency.config}
              </div>
              <div className="text-xs text-green-600">
                {(bestPerformers.bestEfficiency.value * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-white rounded p-3 border border-gray-200">
              <div className="text-xs font-medium text-gray-700 mb-1">
                Most Fees Earned
              </div>
              <div className="text-sm font-bold text-gray-900">
                {bestPerformers.bestFees.strategy}
              </div>
              <div className="text-xs text-gray-600">
                {bestPerformers.bestFees.config}
              </div>
              <div className="text-xs text-green-600">
                ${bestPerformers.bestFees.value.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white rounded border border-black overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Configuration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spot Strategy
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Curve Strategy
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bid-Ask Strategy
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result, index) => {
                const configLabel = `$${result.liquidity.toLocaleString()}, ${
                  result.totalBins
                } bins, ${result.period}`;

                // Find best performer for this row based on fees
                const bestFees = Math.max(
                  result.spot.fees,
                  result.curve.fees,
                  result.bidAsk.fees
                );

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {configLabel}
                      </div>
                      <div className="text-xs text-gray-500">
                        {result.binRange}% range
                      </div>
                    </td>

                    {/* Spot Strategy */}
                    <td className="px-4 py-4">
                      <div
                        className={`rounded p-2 border-2 ${
                          result.spot.fees === bestFees
                            ? "bg-green-50 border-green-500"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="text-xs text-gray-600 mb-1">
                          Time in Range
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {(result.spot.timeInRange * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600 mb-1">
                          Efficiency
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {(result.spot.efficiency * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600 mb-1">Fees</div>
                        <div
                          className={`text-sm font-semibold ${
                            result.spot.fees === bestFees
                              ? "text-green-700"
                              : "text-gray-900"
                          }`}
                        >
                          ${result.spot.fees.toFixed(2)}
                        </div>
                      </div>
                    </td>

                    {/* Curve Strategy */}
                    <td className="px-4 py-4">
                      <div
                        className={`rounded p-2 border-2 ${
                          result.curve.fees === bestFees
                            ? "bg-green-50 border-green-500"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="text-xs text-gray-600 mb-1">
                          Time in Range
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {(result.curve.timeInRange * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600 mb-1">
                          Efficiency
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {(result.curve.efficiency * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600 mb-1">Fees</div>
                        <div
                          className={`text-sm font-semibold ${
                            result.curve.fees === bestFees
                              ? "text-green-700"
                              : "text-gray-900"
                          }`}
                        >
                          ${result.curve.fees.toFixed(2)}
                        </div>
                      </div>
                    </td>

                    {/* Bid-Ask Strategy */}
                    <td className="px-4 py-4">
                      <div
                        className={`rounded p-2 border-2 ${
                          result.bidAsk.fees === bestFees
                            ? "bg-green-50 border-green-500"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="text-xs text-gray-600 mb-1">
                          Time in Range
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {(result.bidAsk.timeInRange * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600 mb-1">
                          Efficiency
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {(result.bidAsk.efficiency * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600 mb-1">Fees</div>
                        <div
                          className={`text-sm font-semibold ${
                            result.bidAsk.fees === bestFees
                              ? "text-green-700"
                              : "text-gray-900"
                          }`}
                        >
                          ${result.bidAsk.fees.toFixed(2)}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BacktestingTable;
