// import dlmm client and supabase client
import { DLMMService, SAROS_USDC_PAIR_ADDRESS } from "@/lib/dlmm/client";
import { supabaseAdmin, supabase } from "./supabaseClient";
import {
  PoolSnapshot,
  BinSnapshot,
  PoolSnapshotsTable,
} from "@/types/snapshots";

// initialize the classes
const dlmmService = new DLMMService();

// Helper function to add delay for rate limiting
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes("429") ||
        errorMessage.includes("Too Many Requests")
      ) {
        if (i === maxRetries - 1) throw error;
        const delayMs = baseDelay * Math.pow(2, i);
        console.log(
          `⏳ Rate limited, retrying in ${delayMs}ms... (attempt ${i +
            1}/${maxRetries})`
        );
        await delay(delayMs);
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries exceeded");
}

// Helper function to get market price with fallback
async function getMarketPriceWithFallback(
  poolAddress: string
): Promise<number> {
  try {
    // Try to get current market price with retry logic
    const marketPrice = await retryWithBackoff(
      () => dlmmService.getCurrentMarketPrice(poolAddress),
      2, // Reduced retries to avoid long delays
      1000 // Reduced base delay
    );
    return marketPrice || 0;
  } catch (error) {
    console.warn(
      "⚠️ Could not fetch market price due to rate limiting, using active bin price as fallback"
    );
    // Fallback to active bin price
    const activeBinPrice = await dlmmService.getActiveBinPrice(poolAddress);
    return activeBinPrice || 0;
  }
}

// fetch pool metadata and surrounding bin data using functions from the dlmm client
export async function collectPoolSnapshot(
  poolAddress: string = SAROS_USDC_PAIR_ADDRESS
): Promise<PoolSnapshot> {
  try {
    console.log(`🔍 Collecting snapshot for pool: ${poolAddress}`);

    // Fetch pool metadata
    const poolMetadata = await dlmmService.fetchPoolMetadata(poolAddress);
    console.log("📊 Pool Metadata:", poolMetadata);

    // Fetch surrounding bin data
    const surroundingBins = await dlmmService.getSurroundingBinsSimple(
      poolAddress,
      10
    );
    console.log("📈 Surrounding Bins:", surroundingBins);

    // Fetch complete pool info for additional context
    const completePoolInfo = await dlmmService.getCompletePoolInfo(poolAddress);
    console.log("🏊 Complete Pool Info:", completePoolInfo);

    // Get market price with fallback to handle rate limiting
    console.log("💰 Fetching market price...");
    const marketPrice = await getMarketPriceWithFallback(poolAddress);
    console.log("💵 Market Price:", marketPrice);

    // Transform data to PoolSnapshot format
    const poolSnapshot = transformToPoolSnapshot(
      poolMetadata,
      surroundingBins,
      completePoolInfo,
      marketPrice,
      poolAddress
    );

    console.log("✅ Pool Snapshot created successfully");
    return poolSnapshot;
  } catch (error) {
    console.error("❌ Error collecting pool snapshot:", error);
    throw error;
  }
}

// Helper function to get token symbol from mint address
function getTokenSymbol(mintAddress: string): string {
  const tokenMap: { [key: string]: string } = {
    SarosY6Vscao718M4A778z4CGtvcwcGef5M9MEH1LGL: "SAROS",
    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: "USDC",
    So11111111111111111111111111111111111111112: "SOL",
    Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: "USDT",
    DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: "BONK",
    mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: "mSOL",
    "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs": "ETH",
    A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM: "USDCet",
  };

  return tokenMap[mintAddress] || mintAddress.slice(0, 8) + "...";
}

// Transform the raw data into PoolSnapshot type
function transformToPoolSnapshot(
  poolMetadata: any,
  surroundingBins: any[],
  completePoolInfo: any,
  marketPrice: number,
  poolAddress: string
): PoolSnapshot {
  const timestamp = Date.now();
  const activeBinPrice = completePoolInfo?.activeBinPrice || 0;
  const priceDeviation =
    marketPrice > 0 ? Math.abs(activeBinPrice - marketPrice) / marketPrice : 0;

  // Get token symbols dynamically
  const baseTokenSymbol = getTokenSymbol(poolMetadata?.baseMint || "");
  const quoteTokenSymbol = getTokenSymbol(poolMetadata?.quoteMint || "");
  const poolName = `${baseTokenSymbol}/${quoteTokenSymbol} Pool`;

  // Transform bin data to BinSnapshot format
  const binData: BinSnapshot[] = surroundingBins.map((bin) => ({
    bin_id: bin.binId,
    liquidity_x: bin.baseAmount,
    liquidity_y: bin.quoteAmount,
    price: bin.price,
    total_supply: bin.liquidity,
  }));

  return {
    timestamp,
    pool_address: poolAddress,
    pool_name: poolName,

    // Pool configuration
    active_bin_id: completePoolInfo?.pairAccount?.activeId || 0,
    bin_step: completePoolInfo?.pairAccount?.binStep || 0,
    base_factor: completePoolInfo?.pairAccount?.baseFeePct || 0,
    protocol_fee: completePoolInfo?.pairAccount?.protocolFeePct || 0,

    // Reserves & state
    reserve_x: poolMetadata?.baseReserve || "0",
    reserve_x_decimal: poolMetadata?.extra?.tokenBaseDecimal || 6,
    reserve_y: poolMetadata?.quoteReserve || "0",
    reserve_y_decimal: poolMetadata?.extra?.tokenQuoteDecimal || 6,
    current_price: activeBinPrice,

    // Bin data
    bin_data: binData,

    // Market context (placeholder values for now)
    market_price: marketPrice,
    market_volume_24h: 0, // Would need external API
    market_change_24h: 0, // Would need external API
    price_deviation: priceDeviation,
  };
}

// Save snapshot to database
export async function saveSnapshotToDatabase(
  snapshot: PoolSnapshot
): Promise<boolean> {
  try {
    console.log("💾 Saving snapshot to database...");

    // Use supabaseAdmin if available, otherwise fall back to regular supabase client
    const client = supabaseAdmin;

    if (!client) {
      console.error("❌ No Supabase client available.");
      return false;
    }

    // Insert pool snapshot
    const insertData = {
      timestamp: snapshot.timestamp,
      pool_address: snapshot.pool_address,
      pool_name: snapshot.pool_name,
      active_bin_id: snapshot.active_bin_id,
      reserve_x: snapshot.reserve_x,
      reserve_y: snapshot.reserve_y,
      bin_step: snapshot.bin_step,
      base_factor: snapshot.base_factor,
      protocol_fee: snapshot.protocol_fee,
      current_price: snapshot.current_price,
      market_price: snapshot.market_price,
      price_deviation: snapshot.price_deviation,
      market_volume_24h: snapshot.market_volume_24h,
      market_change_24h: snapshot.market_change_24h,
      bin_data: snapshot.bin_data,
      reserve_x_decimal: snapshot.reserve_x_decimal,
      reserve_y_decimal: snapshot.reserve_y_decimal,
    };

    console.log("💾 Check Final Data:", insertData);

    const { data, error } = await client
      .from("pool_snapshots")
      .insert(insertData as any)
      .select();

    if (error) {
      console.error("❌ Error saving pool snapshot:", error);
      return false;
    }

    console.log("✅ Pool snapshot saved successfully:", data);
    return true;
  } catch (error) {
    console.error("❌ Error saving snapshot to database:", error);
    return false;
  }
}

//console.log the data to the console for now
export async function logPoolData(
  poolAddress: string = SAROS_USDC_PAIR_ADDRESS
): Promise<PoolSnapshot> {
  const snapshot = await collectPoolSnapshot(poolAddress);
  saveSnapshotToDatabase(snapshot);
  console.log(
    "📋 Complete PoolSnapshot Data:",
    JSON.stringify(snapshot, null, 2)
  );
  return snapshot;
}

//keep the code simple and easy to understand
//we ll add more details as per requirement

// // Direct execution when run as a script
// if (require.main === module) {
//   logPoolData().catch(console.error);
// }
