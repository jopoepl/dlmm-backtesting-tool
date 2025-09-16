"use client";

import { useState } from "react";
import { DLMMStrategy, BacktestResult } from "@/types/dlmm";
import { Play, BarChart3, TrendingUp, Clock } from "lucide-react";

interface TimePeriod {
  start: Date;
  end: Date;
  preset: "7d" | "30d" | "90d" | "custom";
  label: string;
}

interface BacktestingState {
  timePeriod: TimePeriod;
  backtestResults: BacktestResult[];
  loading: boolean;
  error: string | null;
  hasResults: boolean;
}

const DEFAULT_TIME_PERIODS: Omit<TimePeriod, "start" | "end">[] = [
  { preset: "7d", label: "Last 7 Days" },
  { preset: "30d", label: "Last 30 Days" },
  { preset: "90d", label: "Last 90 Days" },
  { preset: "custom", label: "Custom Range" },
];

// Always analyze all 3 strategies
const ALL_STRATEGIES: DLMMStrategy[] = [
  {
    id: "spot",
    name: "Spot",
    description: "All liquidity at current price",
    riskLevel: "High",
    parameters: {
      binRange: [0, 0],
      rebalanceThreshold: 0.1,
      maxSlippage: 0.05,
    },
  },
  {
    id: "curve",
    name: "Curve",
    description: "Liquidity spread around current price",
    riskLevel: "Medium",
    parameters: {
      binRange: [-5, 5],
      rebalanceThreshold: 0.2,
      maxSlippage: 0.03,
    },
  },
  {
    id: "bid-ask",
    name: "Bid-Ask",
    description: "Separate buy/sell market making",
    riskLevel: "Low",
    parameters: {
      binRange: [-10, 10],
      rebalanceThreshold: 0.3,
      maxSlippage: 0.02,
    },
  },
];

export function BacktestingDashboard() {
  const [state, setState] = useState<BacktestingState>({
    timePeriod: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
      preset: "30d",
      label: "Last 30 Days",
    },
    backtestResults: [],
    loading: false,
    error: null,
    hasResults: false,
  });

  const handleTimePeriodChange = (preset: TimePeriod["preset"]) => {
    const end = new Date();
    let start = new Date();
    let label = "";

    switch (preset) {
      case "7d":
        start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        label = "Last 7 Days";
        break;
      case "30d":
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        label = "Last 30 Days";
        break;
      case "90d":
        start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        label = "Last 90 Days";
        break;
      case "custom":
        // TODO: Implement custom date picker
        label = "Custom Range";
        break;
    }

    setState((prev) => ({
      ...prev,
      timePeriod: { start, end, preset, label },
      hasResults: false, // Clear results when period changes
    }));
  };

  const runBacktest = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // TODO: Implement actual backtesting logic
      // For now, simulate with timeout and mock data
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockResults: BacktestResult[] = [
        {
          strategy: "Spot",
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          initialValue: 1000,
          finalValue: 1153,
          totalReturn: 15.3,
          returns: 15.3,
          fees: 2.4,
          impermanentLoss: -3.2,
          maxDrawdown: -8.5,
          sharpeRatio: 1.85,
          trades: [],
          dailyReturns: [0.5, -1.2, 2.1, 0.8, -0.3, 1.5, 0.9],
        },
        {
          strategy: "Curve",
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          initialValue: 1000,
          finalValue: 1087,
          totalReturn: 8.7,
          returns: 8.7,
          fees: 3.1,
          impermanentLoss: -1.1,
          maxDrawdown: -4.2,
          sharpeRatio: 2.21,
          trades: [],
          dailyReturns: [0.3, 0.8, 1.2, -0.5, 0.6, 0.4, 0.9],
        },
        {
          strategy: "Bid-Ask",
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          initialValue: 1000,
          finalValue: 1042,
          totalReturn: 4.2,
          returns: 4.2,
          fees: 4.8,
          impermanentLoss: -0.3,
          maxDrawdown: -2.1,
          sharpeRatio: 2.87,
          trades: [],
          dailyReturns: [0.2, 0.6, 0.8, -0.1, 0.3, 0.4, 0.2],
        },
      ];

      setState((prev) => ({
        ...prev,
        backtestResults: mockResults,
        loading: false,
        hasResults: true,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to run backtest. Please try again.",
      }));
    }
  };

  const clearResults = () => {
    setState((prev) => ({
      ...prev,
      backtestResults: [],
      hasResults: false,
      error: null,
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          DLMM Strategy Backtesting
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Compare all three DLMM strategies against historical SAROS/USDC data.
          See which approach works best for different market conditions.
        </p>
      </div>

      {/* Strategy Overview Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {ALL_STRATEGIES.map((strategy) => (
          <div
            key={strategy.name}
            className="bg-white rounded-lg border p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {strategy.name} Strategy
              </h3>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  strategy.riskLevel === "High"
                    ? "bg-red-100 text-red-700"
                    : strategy.riskLevel === "Medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {strategy.riskLevel} Risk
              </span>
            </div>
            <p className="text-gray-600 text-sm">{strategy.description}</p>
          </div>
        ))}
      </div>

      {/* Time Period Selection */}
      <div className="bg-white rounded-lg border p-6 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Select Analysis Period
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DEFAULT_TIME_PERIODS.map((period) => (
            <button
              key={period.preset}
              onClick={() => handleTimePeriodChange(period.preset)}
              disabled={period.preset === "custom"} // Disable custom for now
              className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                state.timePeriod.preset === period.preset
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              } ${
                period.preset === "custom"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {period.label}
              {period.preset === "custom" && (
                <div className="text-xs text-gray-400 mt-1">Coming Soon</div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
          <strong>Selected Period:</strong> {state.timePeriod.label}
          <span className="ml-2 text-gray-500">
            ({state.timePeriod.start.toLocaleDateString()} -{" "}
            {state.timePeriod.end.toLocaleDateString()})
          </span>
        </div>
      </div>

      {/* Run Backtest Button */}
      <div className="text-center mb-8">
        <button
          onClick={runBacktest}
          disabled={state.loading}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto
                     transition-colors shadow-sm hover:shadow-md"
        >
          {state.loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Running Backtest...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Run Backtest for All Strategies
            </>
          )}
        </button>

        {state.hasResults && (
          <button
            onClick={clearResults}
            className="ml-4 text-gray-600 hover:text-gray-800 text-sm underline"
          >
            Clear Results
          </button>
        )}
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{state.error}</p>
        </div>
      )}

      {/* Results Section */}
      {state.hasResults && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Backtest Results
            </h2>
            <span className="text-sm text-gray-500">
              ({state.timePeriod.label})
            </span>
          </div>

          {/* Results Summary Table */}
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-900">
                    Strategy
                  </th>
                  <th className="text-right p-4 font-medium text-gray-900">
                    Total Return
                  </th>
                  <th className="text-right p-4 font-medium text-gray-900">
                    Fees Earned
                  </th>
                  <th className="text-right p-4 font-medium text-gray-900">
                    Impermanent Loss
                  </th>
                  <th className="text-right p-4 font-medium text-gray-900">
                    Sharpe Ratio
                  </th>
                  <th className="text-center p-4 font-medium text-gray-900">
                    Risk Level
                  </th>
                </tr>
              </thead>
              <tbody>
                {state.backtestResults.map((result, index) => (
                  <tr
                    key={result.strategy}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="p-4 font-medium text-gray-900">
                      {result.strategy}
                    </td>
                    <td
                      className={`p-4 text-right font-medium ${
                        result.returns > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {result.returns > 0 ? "+" : ""}
                      {result.returns.toFixed(1)}%
                    </td>
                    <td className="p-4 text-right text-green-600 font-medium">
                      ${result.fees.toFixed(2)}
                    </td>
                    <td className="p-4 text-right text-red-600 font-medium">
                      {result.impermanentLoss.toFixed(1)}%
                    </td>
                    <td className="p-4 text-right font-medium">
                      {result.sharpeRatio.toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      {
                        ALL_STRATEGIES.find((s) => s.name === result.strategy)
                          ?.riskLevel
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Placeholder for Future Components */}
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Performance Chart
            </h3>
            <div className="h-64 bg-gray-50 rounded flex items-center justify-center text-gray-500">
              📊 Interactive strategy comparison chart coming soon...
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Market Analysis
            </h3>
            <div className="bg-gray-50 rounded p-4 text-gray-500">
              🧠 AI-powered market condition analysis and strategy
              recommendations coming soon...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
