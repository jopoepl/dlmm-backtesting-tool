/**
 * Analysis State Types
 * Pre-calculated metrics for UI rendering and strategy comparison
 */

export interface StrategyMetrics {
  // Core Performance
  totalReturn: number;
  totalFeesEarned: number;
  totalVolume: number;
  initialValue: number;
  finalValue: number;

  // Risk Metrics
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;

  // Activity Metrics
  activeTimePercentage: number; // % of snapshots with active bins
  winRate: number; // % of profitable snapshots

  // Time Series Data
  dailyReturns: number[];
  cumulativeReturns: number[];
  liquidityUtilizationOverTime: number[];
}

export interface CrossStrategyMetrics {
  bestPerformingStrategy: string;
  riskAdjustedRanking: string[];
  relativePerformance: {
    spot: number;
    curve: number;
    bidAsk: number;
  };
}

export interface BacktestingAnalysis {
  spot: StrategyMetrics;
  curve: StrategyMetrics;
  bidAsk: StrategyMetrics;
  comparison: CrossStrategyMetrics;
  timeRange: {
    start: number;
    end: number;
    duration: number; // in days
  };
}
