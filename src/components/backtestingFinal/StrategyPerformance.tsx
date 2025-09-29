import React, { useState } from "react";
import { Strategy } from "@/types/strategy";

interface StrategyPerformanceProps {
  strategy: Strategy;
}

const StrategyPerformance: React.FC<StrategyPerformanceProps> = ({
  strategy,
}) => {
  const [showDebug, setShowDebug] = useState(false);
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="space-y-4">
      {/* Debug Toggle - Only in development */}
      {isDevelopment && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-blue-800">
              Strategy State Debug
            </h3>
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {showDebug ? "Hide" : "Show"} Strategy Object
            </button>
          </div>

          {showDebug && (
            <div className="mt-4">
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-sm font-mono">
                <pre>{JSON.stringify(strategy, null, 2)}</pre>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <p>
                  <strong>Spot Strategy:</strong> {strategy.spot.length} bins
                </p>
                <p>
                  <strong>Curve Strategy:</strong> {strategy.curve.length} bins
                </p>
                <p>
                  <strong>Bid-Ask Strategy:</strong> {strategy.bidAsk.length}{" "}
                  bins
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Original placeholder */}
      <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
        <p className="text-lg font-medium text-gray-700 mb-2">
          Backtesting Results Component
        </p>
        <p className="text-gray-600 mb-3">Will contain:</p>
        <ul className="space-y-1 text-sm text-gray-600">
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Performance metrics (returns, fees, volume)
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Risk metrics (Sharpe ratio, max drawdown)
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Strategy comparison charts
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Time series performance data
          </li>
        </ul>
      </div>
    </div>
  );
};

export default StrategyPerformance;
