// src/types/snapshots.ts

export interface BinSnapshot {
  bin_id: number;
  liquidity_x: string; // Raw amount as string (to handle large numbers)
  liquidity_y: string; // Raw amount as string
  price: number; // Price for this specific bin
  total_supply: string; // Total LP tokens in this bin
}

// Make sure PoolSnapshot includes everything we get from SDK
export interface PoolSnapshot {
  id?: number;
  created_at?: string;
  // Pool identity & timing
  timestamp: number;
  pool_address: string;
  pool_name: string;

  // From dlmm.getLbPair() - pool configuration
  active_bin_id: number;
  bin_step: number;
  base_factor: number;
  protocol_fee: number;

  // From dlmm.getLbPair() - reserves & state
  reserve_x: string;
  reserve_x_decimal: number;
  reserve_y: string;
  reserve_y_decimal: number;
  current_price: number;

  // From dlmm.getBinsAroundActiveBin() - bin data
  bin_data: BinSnapshot[];

  // From CoinGecko API - market context
  market_price: number;
  market_volume_24h: number;
  market_change_24h: number;
  price_deviation: number;
}

export interface SnapshotCollectionResult {
  success: boolean;
  snapshot?: PoolSnapshot;
  error?: string;
  timestamp: number;
  collection_time_ms: number; // How long collection took
}

export interface SnapshotQuery {
  pool_address?: string;
  start_timestamp?: number;
  end_timestamp?: number;
  limit?: number;
  offset?: number;
}

export interface PoolAnalytics {
  pool_address: string;
  pool_name: string;

  // Time Period
  start_timestamp: number;
  end_timestamp: number;
  total_snapshots: number;

  // Price Analytics
  price_range: {
    min: number;
    max: number;
    avg: number;
    volatility: number; // Standard deviation
  };

  // Activity Analytics
  active_bin_changes: number; // How many times active bin changed
  avg_liquidity: {
    token_x: number;
    token_y: number;
    total_usd: number;
  };

  // Market Correlation
  market_correlation: number; // How well pool price tracks market
  avg_price_deviation: number; // Average deviation from market price
  max_arbitrage_opportunity: number; // Largest price deviation seen
}

// Database table interfaces for type safety
export interface PoolSnapshotsTable {
  id: number;
  timestamp: number;
  created_at: string;
  pool_address: string;
  pool_name: string;
  active_bin_id: number;
  reserve_x: string;
  reserve_y: string;
  bin_step: number;
  base_factor: number;
  protocol_fee: number;
  current_price: number;
  market_price: number;
  price_deviation: number;
  market_volume_24h: number;
  market_change_24h: number;
  bin_data: BinSnapshot[]; // JSON field
  reserve_x_decimal: number;
  reserve_y_decimal: number;
}

export interface BinSnapshotsTable {
  id: number;
  snapshot_id: number;
  bin_id: number;
  liquidity_x: string;
  liquidity_y: string;
  price: number;
  total_supply: string;
  created_at: string;
}

// Helper types for API responses
export interface SnapshotAPIResponse {
  data: PoolSnapshot[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface PoolListResponse {
  pools: {
    address: string;
    name: string;
    last_snapshot: number;
    total_snapshots: number;
  }[];
}
