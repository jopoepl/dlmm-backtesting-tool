"use client";
import React from "react";

import { TrendingUp } from "lucide-react";

interface LiquidityAmountInputProps {
  liquidity: number;
  onLiquidityChange: (liquidity: number) => void;
}

const LiquidityAmountInput: React.FC<LiquidityAmountInputProps> = ({
  liquidity,
  onLiquidityChange,
}) => {
  const handleLiquidityChange = (value: number) => {
    onLiquidityChange(value);
  };

  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900">
            Select Liquidity Amount
          </h3>
        </div>
        <span className="text-sm font-semibold text-blue-600">
          ${liquidity.toLocaleString()} USDC
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={liquidity}
            onChange={(e) => handleLiquidityChange(Number(e.target.value))}
            min="100"
            max="100000"
            step="100"
            className="w-24 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-xs text-gray-600">USDC</span>
          <div className="flex gap-1 ml-auto">
            {[1000, 5000, 10000, 25000].map((amount) => (
              <button
                key={amount}
                onClick={() => handleLiquidityChange(amount)}
                className={`px-2 py-1 text-xs rounded ${
                  liquidity === amount
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                ${amount.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <input
          type="range"
          min="100"
          max="50000"
          step="100"
          value={liquidity}
          onChange={(e) => handleLiquidityChange(Number(e.target.value))}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer 
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 
                        [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 
                        [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-sm
                        [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full 
                        [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:cursor-pointer 
                        [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-sm"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((liquidity -
              100) /
              (50000 - 100)) *
              100}%, #e5e7eb ${((liquidity - 100) / (50000 - 100)) *
              100}%, #e5e7eb 100%)`,
          }}
        />
      </div>
    </div>
  );
};

export default LiquidityAmountInput;
