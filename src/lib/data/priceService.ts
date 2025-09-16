// Unused imports removed to fix linting warnings

enum Range {
  "1d" = "1d",
  "7d" = "7d",
  "30d" = "30d",
  "90d" = "90d",
}

export class PriceService {
  async getPriceData(coinId?: string, rangeEnum?: Range) {
    const range = rangeEnum || Range["7d"];
    const coinIdToUse = coinId || "saros-finance";

    try {
      console.log(`🔄 Fetching data for ${coinIdToUse} for ${range}...`);

      // Call our API route instead of CoinGecko directly
      const response = await fetch(
        `/api/price?coinId=${coinIdToUse}&range=${range}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const priceData = data.prices;
      console.log("✅ Success! Data received:");
      console.log(`📊 Price points: ${data.prices?.length || 0}`);
      console.log(`📈 Volume points: ${data.total_volumes?.length || 0}`);
      console.log("📋 Sample data:", data.prices?.slice(0, 3));

      return priceData;
    } catch (error) {
      console.error("❌ Error:", error);
      throw error;
    }
  }
}
