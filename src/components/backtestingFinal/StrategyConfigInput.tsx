"use client";

import React, { useState } from "react";
import { ChartLine } from "lucide-react";
import StrategyLiquidityAllocationChart from "./StrategyLiquidityAllocationChart";
import { PoolSnapshot } from "@/types/snapshots";
import { LiquidityAllocation, Strategy } from "@/types/strategy";

interface StrategyConfigInputProps {
  filteredSnapshots: PoolSnapshot[];
  totalLiquidity: number;
  binRange: number;
  onBinRangeChange: (range: number) => void;
  strategy: Strategy;
  startingSnapshot: PoolSnapshot | null;
}

const StrategyConfigInput: React.FC<StrategyConfigInputProps> = ({
  filteredSnapshots,
  totalLiquidity,
  binRange,
  onBinRangeChange,
  strategy,
  startingSnapshot,
}) => {
  const [selectedStrategies, setSelectedStrategies] = useState([
    "spot",
    "curve",
    "bidAsk",
  ]);

  const handleBinRangeChange = (percent: number) => {
    onBinRangeChange(percent);
  };

  const handleStrategyToggle = (strategyKey: string) => {
    setSelectedStrategies((prev) =>
      prev.includes(strategyKey)
        ? prev.filter((s) => s !== strategyKey)
        : [...prev, strategyKey]
    );
  };

  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ChartLine className="w-4 h-4 text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900">
            Select Strategy Configuration
          </h3>
        </div>
      </div>

      <div className="space-y-4">
        {/* Bin Range Selection */}
        <div className="flex items-center gap-4">
          <label className="text-xs font-medium text-gray-700">
            Bin Range:
          </label>
          <div className="flex gap-2">
            {[1, 2, 5, 10].map((percent) => (
              <button
                key={percent}
                onClick={() => handleBinRangeChange(percent)}
                className={`px-3 py-1 text-xs rounded ${
                  binRange === percent
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {percent}% ({percent * 2 + 1} bins)
              </button>
            ))}
          </div>
        </div>

        {/* Strategy Selection */}
        <div className="flex items-center gap-4">
          <label className="text-xs font-medium text-gray-700">
            Strategies:
          </label>
          <div className="flex gap-2">
            {[
              { key: "spot", label: "Spot" },
              { key: "curve", label: "Curve" },
              { key: "bidAsk", label: "Bid-Ask" },
            ].map((strategy) => (
              <button
                key={strategy.key}
                onClick={() => handleStrategyToggle(strategy.key)}
                className={`px-3 py-1 text-xs rounded ${
                  selectedStrategies.includes(strategy.key)
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {strategy.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Strategy Liquidity Allocation Chart */}
      {startingSnapshot && (
        <StrategyLiquidityAllocationChart
          strategy={strategy}
          snapshot={startingSnapshot}
        />
      )}
    </div>
  );
};

export default StrategyConfigInput;
