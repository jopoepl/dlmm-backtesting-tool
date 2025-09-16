// // Test script for price service
// // Run with: node test-price-service.js

// const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || "your-api-key-here";
// const COINGECKO_API_URL =
//   process.env.COINGECKO_API_URL || "https://api.coingecko.com/api/v3";

// const Range = {
//   "1d": "1d",
//   "7d": "7d",
//   "30d": "30d",
//   "90d": "90d",
// };

// async function getPriceData(coinId, rangeEnum) {
//   const range = rangeEnum || Range["7d"];
//   const coinIdToUse = coinId || "saros-finance";
//   const url = `${COINGECKO_API_URL}/coins/${coinIdToUse}/market_chart?vs_currency=usd&days=${range}`;

//   const options = {
//     method: "GET",
//     headers: {
//       "x-cg-demo-api-key": COINGECKO_API_KEY,
//       "Content-Type": "application/json",
//     },
//   };

//   try {
//     console.log(`🔄 Fetching data for ${coinIdToUse} for ${range}...`);
//     console.log(`🌐 URL: ${url}`);

//     const response = await fetch(url, options);

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const data = await response.json();
//     console.log("✅ Success! Data received:");
//     console.log(`📊 Price points: ${data.prices?.length || 0}`);
//     console.log(`📈 Volume points: ${data.total_volumes?.length || 0}`);
//     console.log("📋 Sample data:", data.prices?.slice(0, 3));

//     return data;
//   } catch (error) {
//     console.error("❌ Error:", error.message);
//     throw error;
//   }
// }

// // Test the function
// async function runTests() {
//   console.log("🧪 Testing Price Service...\n");

//   try {
//     // Test 1: Basic functionality
//     console.log("Test 1: Basic 7-day data");
//     await getPriceData();

//     console.log("\n" + "=".repeat(50) + "\n");

//     // Test 2: Different time ranges
//     console.log("Test 2: 1-day data");
//     await getPriceData("saros-finance", Range["1d"]);

//     console.log("\n" + "=".repeat(50) + "\n");

//     // Test 3: Different coin
//     console.log("Test 3: SOL data (fallback)");
//     await getPriceData("solana", Range["7d"]);
//   } catch (error) {
//     console.error("Test failed:", error);
//   }
// }

// runTests();
