/**
 * Activity State Types
 * Per-snapshot tracking of strategy performance
 */

export interface BinUtilization {
  binId: number;
  allocatedLiquidity: number;
  utilizedLiquidity: number;
  utilizationRate: number; // 0-1
  isActive: boolean;
  feesEarned: number;
  volume: number;
}

export interface SnapshotActivity {
  snapshotId: string;
  timestamp: number;
  activeBins: number[];
  liquidityUtilization: BinUtilization[];
  totalLiquidityUsed: number;
  totalLiquidityAllocated: number;
  utilizationPercentage: number;
  feesEarned: number;
  volume: number;
}

export interface StrategyActivity {
  spot: SnapshotActivity[];
  curve: SnapshotActivity[];
  bidAsk: SnapshotActivity[];
}
