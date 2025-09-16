/**
 * Example usage of the DLMM Service
 * This demonstrates how to use the various functions to get pool data
 */

import { DLMMService, SAROS_USDC_PAIR_ADDRESS } from "./client";

// Create a service instance
const dlmmService = new DLMMService();

/**
 * Example: Get complete pool information
 */
export async function getPoolDataExample() {
  try {
    console.log("🔄 Fetching complete pool info...");

    const poolInfo = await dlmmService.getCompletePoolInfo(
      SAROS_USDC_PAIR_ADDRESS
    );

    if (poolInfo) {
      console.log("✅ Pool Info Retrieved:");
      console.log("📊 Pool Address:", poolInfo.metaData.poolAddress);
      console.log("💰 Base Amount:", poolInfo.reserves.baseAmount);
      console.log("💰 Quote Amount:", poolInfo.reserves.quoteAmount);
      console.log("💱 Current Market Price:", poolInfo.currentMarketPrice);
      console.log("🎯 Active Bin Price:", poolInfo.activeBinPrice);
      console.log("🎯 Active Bin:", poolInfo.activeBin);
      console.log("📏 Bin Step:", poolInfo.binStep);
    }

    return poolInfo;
  } catch (error) {
    console.error("❌ Error getting pool data:", error);
    return null;
  }
}

/**
 * Example: Get pool reserves only
 */
export async function getPoolReservesExample() {
  try {
    console.log("🔄 Fetching pool reserves...");

    const reserves = await dlmmService.getPoolReserves(SAROS_USDC_PAIR_ADDRESS);

    if (reserves) {
      console.log("✅ Pool Reserves:");
      console.log("📊 Base Amount:", reserves.baseAmount);
      console.log("📊 Quote Amount:", reserves.quoteAmount);
      console.log("🔢 Base Decimals:", reserves.baseDecimals);
      console.log("🔢 Quote Decimals:", reserves.quoteDecimals);
    }

    return reserves;
  } catch (error) {
    console.error("❌ Error getting pool reserves:", error);
    return null;
  }
}

/**
 * Example: Get surrounding bins
 */
export async function getSurroundingBinsExample() {
  try {
    console.log("🔄 Fetching surrounding bins...");

    const bins = await dlmmService.getSurroundingBins(
      SAROS_USDC_PAIR_ADDRESS,
      5
    );

    if (bins.length > 0) {
      console.log("✅ Surrounding Bins:");
      bins.forEach((bin) => {
        console.log(
          `Bin ${bin.binId}: Price ${bin.price.toFixed(6)}, Base ${
            bin.baseAmount
          }, Quote ${bin.quoteAmount}`
        );
      });
    }

    return bins;
  } catch (error) {
    console.error("❌ Error getting surrounding bins:", error);
    return [];
  }
}

/**
 * Example: Get current market price
 */
export async function getMarketPriceExample() {
  try {
    console.log("🔄 Fetching current market price...");

    const price = await dlmmService.getCurrentMarketPrice(
      SAROS_USDC_PAIR_ADDRESS
    );

    if (price !== null) {
      console.log("✅ Current Market Price:", price);
    }

    return price;
  } catch (error) {
    console.error("❌ Error getting market price:", error);
    return null;
  }
}

/**
 * Example: Get active bin price (exact bin price)
 */
export async function getActiveBinPriceExample() {
  try {
    console.log("🔄 Fetching active bin price...");

    const price = await dlmmService.getActiveBinPrice(SAROS_USDC_PAIR_ADDRESS);

    if (price !== null) {
      console.log("✅ Active Bin Price:", price);
    }

    return price;
  } catch (error) {
    console.error("❌ Error getting active bin price:", error);
    return null;
  }
}

/**
 * Example: Get pool pair account data
 */
export async function getPairAccountExample() {
  try {
    console.log("🔄 Fetching pair account data...");

    const pairAccount = await dlmmService.getPoolPairAccount(
      SAROS_USDC_PAIR_ADDRESS
    );

    if (pairAccount) {
      console.log("✅ Pair Account Data:");
      console.log("🎯 Active Bin:", pairAccount.activeId);
      console.log("📏 Bin Step:", pairAccount.binStep);
      console.log("💸 Base Fee %:", pairAccount.baseFeePct);
      console.log("💸 Quote Fee %:", pairAccount.quoteFeePct);
      console.log("🏛️ Protocol Fee %:", pairAccount.protocolFeePct);
    }

    return pairAccount;
  } catch (error) {
    console.error("❌ Error getting pair account:", error);
    return null;
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log("🚀 Running DLMM Service Examples...\n");

  await getPoolDataExample();
  console.log("\n" + "=".repeat(50) + "\n");

  await getPoolReservesExample();
  console.log("\n" + "=".repeat(50) + "\n");

  await getMarketPriceExample();
  console.log("\n" + "=".repeat(50) + "\n");

  await getPairAccountExample();
  console.log("\n" + "=".repeat(50) + "\n");

  await getSurroundingBinsExample();

  console.log("\n✅ All examples completed!");
}
