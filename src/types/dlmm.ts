import { PublicKey } from "@solana/web3.js";

/**
 * DLMM Pool Metadata interface
 */
export interface PoolMetadata {
  poolAddress: string;
  baseMint: string;
  baseReserve: string;
  quoteMint: string;
  quoteReserve: string;
  tradeFee: number;
  extra: {
    tokenQuoteDecimal: number;
    tokenBaseDecimal: number;
  };
}

/**
 * Pool reserves with calculated amounts
 */
export interface PoolReserves {
  baseAmount: number;
  quoteAmount: number;
  baseReserve: string;
  quoteReserve: string;
  baseDecimals: number;
  quoteDecimals: number;
}

/**
 * Bin liquidity data
 */
export interface BinLiquidityData {
  binId: number;
  price: number;
  baseAmount: number;
  quoteAmount: number;
  liquidity: string;
}

/**
 * Pool pair account data
 */
export interface PoolPairAccount {
  activeId: number;
  binStep: number;
  baseFeePct: number;
  quoteFeePct: number;
  protocolFeePct: number;
  liquidity: string;
  rewardVaults: PublicKey[];
  oracle: PublicKey;
  oracleId: number;
}

/**
 * Bin array information
 */
export interface BinArrayInfo {
  binArrayIndex: number;
  bins: any[];
  lowerBinId: number;
  upperBinId: number;
}

/**
 * Complete pool information
 */
export interface PoolInfo {
  metaData: PoolMetadata;
  currentMarketPrice: number;
  activeBinPrice: number;
  reserves: PoolReserves;
  pairAccount: PoolPairAccount;
  binArrayInfo: BinArrayInfo;
  activeBin: number;
  binStep: number;
}

/**
 * DLMM Position interface
 */
export interface DLMMPosition {
  publicKey: string;
  lbPair: string;
  owner: string;
  liquidityShares: string;
  rewardInfos: any[];
  feeInfos: any[];
  positionData: {
    totalXAmount: string;
    totalYAmount: string;
  };
}

/**
 * DLMM Strategy interface for backtesting
 */
export interface DLMMStrategy {
  id: string;
  name: string;
  description: string;
  riskLevel: "Low" | "Medium" | "High";
  parameters: {
    binRange: [number, number];
    rebalanceThreshold: number;
    maxSlippage: number;
  };
}

/**
 * Backtest result interface
 */
export interface BacktestResult {
  strategy: string; // Strategy name for display
  startDate: Date;
  endDate: Date;
  initialValue: number;
  finalValue: number;
  totalReturn: number;
  returns: number; // For display purposes
  fees: number;
  impermanentLoss: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: any[];
  dailyReturns: number[];
}
