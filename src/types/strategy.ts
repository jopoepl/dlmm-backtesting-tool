/**
 * Strategy State Types
 * Core types for liquidity allocation across strategies
 */

export interface LiquidityAllocation {
  binId: number;
  liquidityX: number; // SAROS amount
  liquidityY: number; // USDC amount
  totalLiquidity: number;
  weight: number; // Allocation weight (0-1)
}

export interface Strategy {
  spot: LiquidityAllocation[];
  curve: LiquidityAllocation[];
  bidAsk: LiquidityAllocation[];
}

export interface StrategyConfig {
  binRange: number;
  totalLiquidity: number;
  activeBinId: number;
}

export type StrategyType = "spot" | "curve" | "bidAsk";
