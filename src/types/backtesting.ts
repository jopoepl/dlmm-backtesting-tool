export interface BacktestingState {
  selectedStrategies: DLMMStrategy["name"][];
  timePeriod: {
    start: Date;
    end: Date;
    preset: "7d" | "30d" | "90d" | "custom";
  };
  backtestResults: BacktestResult[];
  loading: boolean;
  error: string | null;
  historicalData: PriceData[]; // We'll define PriceData later
}

export interface PriceData {
  timestamp: number; // Unix timestamp
  date: Date; // JavaScript Date object
  price: number; // SAROS price in USDC
  volume: number; // Hourly/daily volume
  open: number; // Opening price (same as price for now)
  high: number; // High price
  low: number; // Low price
  close: number; // Closing price (same as price)
}

export interface BacktestEngine {
  runBacktest(
    strategy: DLMMStrategy,
    priceData: PriceData[],
    params: BacktestParams
  ): BacktestResult;
  simulateSpotStrategy(prices: PriceData[]): BacktestResult;
  simulateCurveStrategy(prices: PriceData[]): BacktestResult;
  simulateBidAskStrategy(prices: PriceData[]): BacktestResult;
}

export interface BacktestParams {
  initialLiquidity: number; // Starting liquidity amount (e.g., $1000)
  binWidth: number; // Bin width percentage (e.g., 0.25 for 0.25%)
  feeRate: number; // Fee rate (e.g., 0.003 for 0.3%)
}

export interface MarketCondition {
  volatility: number; // Daily volatility percentage
  trend: "bullish" | "bearish" | "sideways";
  maxDrawdown: number; // Maximum price drop
  totalReturn: number; // Total price return over period
}

export type DataInterval = "hourly" | "daily";

export interface PriceServiceOptions {
  interval?: DataInterval;
  useCache?: boolean;
  fallbackToMock?: boolean;
}

export interface DLMMPosition {
  publicKey: string; // Unique ID of this position (like a receipt number)
  lbPair: string; // Which trading pair (SOL/USDC, RAY/USDC, etc.)
  owner: string; // Who owns this position (users wallet address)
  liquidityShares: string; // How much liquidity you provided
  rewardInfos: unknown[]; // Extra rewards (like mining rewards)
  feeInfos: unknown[]; // Trading fees youve earned
  positionData: {
    totalXAmount: string; // Will calculate Amount of Token X (eg SOL)
    totalYAmount: string; // Will calculate Amount of Token Y (eg USDC)
  };
}

export interface DLMMStrategy {
  name: "Spot" | "Curve" | "Bid-Ask"; // Strategy type
  description: string; // How it works
  riskLevel: "Low" | "Medium" | "High"; // Risk assessment
}

export interface BacktestResult {
  strategy: DLMMStrategy["name"]; // Which strategy was tested
  returns: number; // Profit/loss percentage
  fees: number; // Trading fees earned
  impermanentLoss: number; // Loss from price changes
  sharpeRatio: number; // Risk-adjusted returns
}
