import React, { useState } from "react";
import LiquidityAmountInput from "./LiquidityAmountInput";
import PeriodSelectionInput from "./PeriodSelectionInput";
import StrategyConfigInput from "./StrategyConfigInput";
import { PoolSnapshot } from "@/types/snapshots";
import { Strategy } from "@/types/strategy";

interface StrategyConfigProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  filteredSnapshots: PoolSnapshot[];
  totalLiquidity: number;
  onLiquidityChange: (liquidity: number) => void;
  binRange: number;
  onBinRangeChange: (range: number) => void;
  strategy: Strategy;
  startingSnapshot: PoolSnapshot | null;
}

const StrategyConfig: React.FC<StrategyConfigProps> = ({
  selectedPeriod,
  onPeriodChange,
  filteredSnapshots,
  totalLiquidity,
  onLiquidityChange,
  binRange,
  onBinRangeChange,
  strategy,
  startingSnapshot,
}) => {
  return (
    <div className="space-y-6">
      {/* First Row: Liquidity Amount and Period Selection - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LiquidityAmountInput
          liquidity={totalLiquidity}
          onLiquidityChange={onLiquidityChange}
        />
        <PeriodSelectionInput
          selectedPeriod={selectedPeriod}
          onPeriodChange={onPeriodChange}
        />
      </div>

      {/* Second Row: Strategy Configuration */}
      <div>
        <StrategyConfigInput
          filteredSnapshots={filteredSnapshots}
          totalLiquidity={totalLiquidity}
          binRange={binRange}
          onBinRangeChange={onBinRangeChange}
          strategy={strategy}
          startingSnapshot={startingSnapshot}
        />
      </div>

      {/* Placeholder for future components */}
      <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Additional Configuration
        </p>
        <p className="text-xs text-gray-600">
          More configuration options will be added here as needed
        </p>
      </div>
    </div>
  );
};

export default StrategyConfig;
