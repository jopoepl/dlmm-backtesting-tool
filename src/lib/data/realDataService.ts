// src/lib/data/realDataService.ts

import { supabase } from "./supabaseClient";
import { PoolSnapshot, BinSnapshot } from "@/types/snapshots";

// Fetch snapshots from Supabase within a time range
export async function getSnapshotsInRange(
  startTime: Date,
  endTime: Date,
  poolAddress?: string
): Promise<PoolSnapshot[]> {
  try {
    console.log("🔍 Fetching snapshots from Supabase...", {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      poolAddress,
    });

    let query = supabase
      .from("pool_snapshots")
      .select("*")
      .gte("timestamp", startTime.getTime())
      .lte("timestamp", endTime.getTime())
      .order("timestamp", { ascending: true });

    // Filter by pool address if provided
    if (poolAddress) {
      query = query.eq("pool_address", poolAddress);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Error fetching snapshots:", error);
      throw new Error(`Failed to fetch snapshots: ${error.message}`);
    }

    console.log(`✅ Fetched ${data?.length || 0} snapshots from Supabase`);

    // Transform the data to match our PoolSnapshot interface
    const snapshots: PoolSnapshot[] = (data || []).map((row: any) => ({
      id: row.id,
      created_at: row.created_at,
      timestamp: row.timestamp,
      pool_address: row.pool_address,
      pool_name: row.pool_name,
      active_bin_id: row.active_bin_id,
      bin_step: row.bin_step,
      base_factor: row.base_factor,
      protocol_fee: row.protocol_fee,
      reserve_x: row.reserve_x,
      reserve_x_decimal: row.reserve_x_decimal,
      reserve_y: row.reserve_y,
      reserve_y_decimal: row.reserve_y_decimal,
      current_price: row.current_price,
      bin_data: row.bin_data || [],
      market_price: row.market_price,
      market_volume_24h: row.market_volume_24h,
      market_change_24h: row.market_change_24h,
      price_deviation: row.price_deviation,
    }));

    return snapshots;
  } catch (error) {
    console.error("❌ Error in getSnapshotsInRange:", error);
    throw error;
  }
}

// Get the latest snapshot for a pool
export async function getLatestSnapshot(
  poolAddress?: string
): Promise<PoolSnapshot | null> {
  try {
    console.log("🔍 Fetching latest snapshot from Supabase...", {
      poolAddress,
    });

    let query = supabase
      .from("pool_snapshots")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(1);

    // Filter by pool address if provided
    if (poolAddress) {
      query = query.eq("pool_address", poolAddress);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Error fetching latest snapshot:", error);
      throw new Error(`Failed to fetch latest snapshot: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log("ℹ️ No snapshots found");
      return null;
    }

    const row = data[0] as any;
    const snapshot: PoolSnapshot = {
      id: row.id,
      created_at: row.created_at,
      timestamp: row.timestamp,
      pool_address: row.pool_address,
      pool_name: row.pool_name,
      active_bin_id: row.active_bin_id,
      bin_step: row.bin_step,
      base_factor: row.base_factor,
      protocol_fee: row.protocol_fee,
      reserve_x: row.reserve_x,
      reserve_x_decimal: row.reserve_x_decimal,
      reserve_y: row.reserve_y,
      reserve_y_decimal: row.reserve_y_decimal,
      current_price: row.current_price,
      bin_data: row.bin_data || [],
      market_price: row.market_price,
      market_volume_24h: row.market_volume_24h,
      market_change_24h: row.market_change_24h,
      price_deviation: row.price_deviation,
    };

    console.log("✅ Latest snapshot fetched successfully");
    return snapshot;
  } catch (error) {
    console.error("❌ Error in getLatestSnapshot:", error);
    throw error;
  }
}

// Get all available snapshots (for snapshot selector)
export async function getAllSnapshots(
  poolAddress?: string,
  limit: number = 100
): Promise<PoolSnapshot[]> {
  try {
    console.log("🔍 Fetching all snapshots from Supabase...", {
      poolAddress,
      limit,
    });

    let query = supabase
      .from("pool_snapshots")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit);

    // Filter by pool address if provided
    if (poolAddress) {
      query = query.eq("pool_address", poolAddress);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Error fetching all snapshots:", error);
      throw new Error(`Failed to fetch snapshots: ${error.message}`);
    }

    console.log(`✅ Fetched ${data?.length || 0} snapshots from Supabase`);

    // Transform the data to match our PoolSnapshot interface
    const snapshots: PoolSnapshot[] = (data || []).map((row: any) => ({
      id: row.id,
      created_at: row.created_at,
      timestamp: row.timestamp,
      pool_address: row.pool_address,
      pool_name: row.pool_name,
      active_bin_id: row.active_bin_id,
      bin_step: row.bin_step,
      base_factor: row.base_factor,
      protocol_fee: row.protocol_fee,
      reserve_x: row.reserve_x,
      reserve_x_decimal: row.reserve_x_decimal,
      reserve_y: row.reserve_y,
      reserve_y_decimal: row.reserve_y_decimal,
      current_price: row.current_price,
      bin_data: row.bin_data || [],
      market_price: row.market_price,
      market_volume_24h: row.market_volume_24h,
      market_change_24h: row.market_change_24h,
      price_deviation: row.price_deviation,
    }));

    return snapshots;
  } catch (error) {
    console.error("❌ Error in getAllSnapshots:", error);
    throw error;
  }
}

// Convert PoolSnapshot to liquidity distribution for the chart
export function snapshotToLiquidityDistribution(snapshot: PoolSnapshot) {
  if (!snapshot.bin_data || snapshot.bin_data.length === 0) {
    return [];
  }

  return snapshot.bin_data.map((bin) => {
    const liquidityX =
      parseFloat(bin.liquidity_x) / Math.pow(10, snapshot.reserve_x_decimal);
    const liquidityY =
      parseFloat(bin.liquidity_y) / Math.pow(10, snapshot.reserve_y_decimal);
    const totalLiquidity = liquidityX + liquidityY;

    return {
      bin_id: bin.bin_id,
      price: bin.price,
      liquidity_x: liquidityX,
      liquidity_y: liquidityY,
      total_liquidity: totalLiquidity,
      is_active: bin.bin_id === snapshot.active_bin_id,
    };
  });
}

// Check if we have data available for the given time range
export async function checkDataAvailability(
  startTime: Date,
  endTime: Date,
  poolAddress?: string
): Promise<{ hasData: boolean; count: number; error?: string }> {
  try {
    let query = supabase
      .from("pool_snapshots")
      .select("id", { count: "exact" })
      .gte("timestamp", startTime.getTime())
      .lte("timestamp", endTime.getTime());

    if (poolAddress) {
      query = query.eq("pool_address", poolAddress);
    }

    const { count, error } = await query;

    if (error) {
      return {
        hasData: false,
        count: 0,
        error: error.message,
      };
    }

    return {
      hasData: (count || 0) > 0,
      count: count || 0,
    };
  } catch (error) {
    return {
      hasData: false,
      count: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
