#!/usr/bin/env node

/**
 * DLMM Analytics Snapshot Scheduler
 *
 * This script runs the snapshot collection on a schedule using node-cron.
 * Much simpler than system cron - runs as a Node.js process.
 *
 * Usage: node scripts/snapshot-scheduler.js
 */

const cron = require("node-cron");
const path = require("path");

// Set the working directory to the project root
const projectRoot = path.join(__dirname, "..");
process.chdir(projectRoot);

// Load environment variables
require("dotenv").config({ path: path.join(projectRoot, ".env.local") });

console.log("🚀 Starting DLMM Analytics Snapshot Scheduler...");
console.log("📅 Started at:", new Date().toISOString());
console.log("📁 Working directory:", process.cwd());

// Import the snapshot service
let logPoolData;
try {
  const snapshotService = require("../src/lib/data/snapshotService.ts");
  logPoolData = snapshotService.logPoolData;
} catch (error) {
  console.error("❌ Failed to load snapshot service:", error.message);
  process.exit(1);
}

// Function to collect and save snapshot
async function collectSnapshot() {
  try {
    console.log("\n🔍 Collecting pool snapshot...");
    console.log("⏰ Timestamp:", new Date().toISOString());

    const snapshot = await logPoolData();

    console.log("✅ Snapshot collection completed successfully");
    console.log(
      "📊 Snapshot timestamp:",
      new Date(snapshot.timestamp).toISOString()
    );
    console.log("🏊 Pool address:", snapshot.pool_address);
    console.log("💰 Current price:", snapshot.current_price);
    console.log("📈 Market price:", snapshot.market_price);
    console.log("📊 Bin data count:", snapshot.bin_data?.length || 0);

    return true;
  } catch (error) {
    console.error("❌ Error in snapshot collection:", error);
    console.error("📝 Error details:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    return false;
  }
}

// Run immediately on startup (optional)
console.log("🔄 Running initial snapshot collection...");
collectSnapshot().then((success) => {
  if (success) {
    console.log("✅ Initial snapshot completed");
  } else {
    console.log("⚠️ Initial snapshot failed, but scheduler will continue");
  }
});

// Schedule snapshots every hour
// Cron format: minute hour day month weekday
// '0 * * * *' = every hour at minute 0
const cronSchedule = "0 * * * *"; // Every hour

console.log(`⏰ Scheduling snapshots every hour (${cronSchedule})`);

cron.schedule(
  cronSchedule,
  async () => {
    console.log("\n🕐 Scheduled snapshot collection triggered");
    await collectSnapshot();
  },
  {
    scheduled: true,
    timezone: "UTC",
  }
);

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

// Keep the process running
console.log("🔄 Scheduler is running. Press Ctrl+C to stop.");
console.log("📝 Logs will appear below when snapshots are collected...\n");
