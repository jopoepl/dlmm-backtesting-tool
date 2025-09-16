import {
  PriceData,
  MarketCondition,
  DataInterval,
  PriceServiceOptions,
} from "@/types/backtesting";

const COINGECKO_API = "https://api.coingecko.com/api/v3";

// Try these coin IDs for SAROS (we'll test which one works)
const POSSIBLE_SAROS_IDS = ["saros", "saros-finance", "saros-token"];
const FALLBACK_COIN_ID = "solana"; // Use SOL as fallback

export class PriceServiceTemplate {
  private cache: Map<
    string,
    { data: PriceData[]; timestamp: number }
  > = new Map();
  private validCoinId: string | null = null;

  /**
   * Fetch historical price data with smart interval selection
   */
  async getHistoricalPrices(
    days: number,
    options: PriceServiceOptions = {}
  ): Promise<PriceData[]> {
    const {
      interval = this.getOptimalInterval(days),
      useCache = true,
      fallbackToMock = true,
    } = options;

    const cacheKey = this.getCacheKey(days, interval);

    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      const isExpired =
        Date.now() - cached.timestamp > this.getCacheExpiry(interval);

      if (!isExpired) {
        console.log(`📦 Using cached ${interval} price data (${days} days)`);
        return cached.data;
      }
    }

    try {
      console.log(`🔄 Fetching ${interval} price data for ${days} days...`);

      const coinId = await this.getValidCoinId();
      const data = await this.fetchFromCoinGecko(coinId, days, interval);

      // Cache the results
      if (useCache) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        });
      }

      console.log(`✅ Fetched ${data.length} ${interval} price data points`);
      return data;
    } catch (error) {
      console.error("❌ Failed to fetch price data:", error);

      if (fallbackToMock) {
        console.log("🔄 Using mock data as fallback");
        return this.getMockPriceData(days, interval);
      }

      throw error;
    }
  }

  /**
   * Determine optimal data interval based on time period
   */
  private getOptimalInterval(days: number): DataInterval {
    // Use hourly for short periods, daily for longer periods
    if (days <= 30) {
      return "hourly"; // More accurate for recent backtests
    } else {
      return "daily"; // Avoid API rate limits for longer periods
    }
  }

  /**
   * Fetch data from CoinGecko API
   */
  private async fetchFromCoinGecko(
    coinId: string,
    days: number,
    interval: DataInterval
  ): Promise<PriceData[]> {
    // Build API URL
    const params = new URLSearchParams({
      vs_currency: "usd",
      days: days.toString(),
      interval: interval,
    });

    const url = `${COINGECKO_API}/coins/${coinId}/market_chart?${params}`;

    console.log(`🌐 Fetching from: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `CoinGecko API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Validate response structure
    if (!data.prices || !Array.isArray(data.prices)) {
      throw new Error("Invalid API response structure");
    }

    // Transform CoinGecko data to our format
    return this.transformCoinGeckoData(data);
  }

  /**
   * Transform CoinGecko response to our PriceData format
   */
  private transformCoinGeckoData(data: unknown): PriceData[] {
    const dataObj = data as {
      prices?: [number, number][];
      total_volumes?: [number, number][];
    };
    const prices = dataObj.prices || [];
    const volumes = dataObj.total_volumes || [];

    return prices.map((pricePoint: [number, number], index: number) => {
      const [timestamp, price] = pricePoint;
      const volume = volumes[index]?.[1] || 0;

      return {
        timestamp,
        date: new Date(timestamp),
        price,
        volume,
        open: price, // CoinGecko doesn't provide OHLC for this endpoint
        high: price,
        low: price,
        close: price,
      };
    });
  }

  /**
   * Find a working SAROS coin ID
   */
  private async getValidCoinId(): Promise<string> {
    if (this.validCoinId) {
      return this.validCoinId;
    }

    // Try each possible SAROS ID
    for (const coinId of POSSIBLE_SAROS_IDS) {
      try {
        const testUrl = `${COINGECKO_API}/coins/${coinId}`;
        const response = await fetch(testUrl);

        if (response.ok) {
          console.log(`✅ Found working SAROS coin ID: ${coinId}`);
          this.validCoinId = coinId;
          return coinId;
        }
      } catch {
        console.log(`❌ ${coinId} not found, trying next...`);
      }
    }

    // Fallback to SOL
    console.log(
      `⚠️ SAROS not found on CoinGecko, using ${FALLBACK_COIN_ID} as proxy`
    );
    this.validCoinId = FALLBACK_COIN_ID;
    return FALLBACK_COIN_ID;
  }

  /**
   * Generate realistic mock data for development/fallback
   */
  private getMockPriceData(days: number, interval: DataInterval): PriceData[] {
    const dataPoints = interval === "hourly" ? days * 24 : days;
    const prices: PriceData[] = [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let currentPrice = 21.5; // Starting SAROS price
    const timeIncrement =
      interval === "hourly" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    for (let i = 0; i < dataPoints; i++) {
      const timestamp = startDate.getTime() + i * timeIncrement;
      const date = new Date(timestamp);

      // Generate realistic price movement
      const volatility = interval === "hourly" ? 0.03 : 0.15; // Lower volatility for hourly
      const dailyChange = (Math.random() - 0.5) * volatility;
      currentPrice = currentPrice * (1 + dailyChange);

      // Keep price within reasonable bounds
      currentPrice = Math.max(15, Math.min(35, currentPrice));

      // Generate volume (lower for hourly)
      const baseVolume = interval === "hourly" ? 5000 : 50000;
      const volume = baseVolume + Math.random() * baseVolume;

      prices.push({
        timestamp,
        date,
        price: currentPrice,
        volume,
        open: currentPrice,
        high: currentPrice * (1 + Math.random() * 0.02),
        low: currentPrice * (1 - Math.random() * 0.02),
        close: currentPrice,
      });
    }

    return prices;
  }

  /**
   * Analyze market conditions from price data
   */
  analyzeMarketCondition(prices: PriceData[]): MarketCondition {
    if (prices.length < 2) {
      return {
        volatility: 0,
        trend: "sideways",
        maxDrawdown: 0,
        totalReturn: 0,
      };
    }

    const firstPrice = prices[0].price;
    const lastPrice = prices[prices.length - 1].price;

    // Calculate returns for volatility
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      const returnValue =
        (prices[i].price - prices[i - 1].price) / prices[i - 1].price;
      returns.push(returnValue);
    }

    // Calculate volatility (standard deviation)
    const avgReturn =
      returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance =
      returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) /
      returns.length;
    const volatility = Math.sqrt(variance) * 100;

    // Calculate maximum drawdown
    let maxDrawdown = 0;
    let peak = prices[0].price;

    for (const pricePoint of prices) {
      if (pricePoint.price > peak) {
        peak = pricePoint.price;
      }
      const drawdown = (peak - pricePoint.price) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    // Determine trend
    const totalReturn = (lastPrice - firstPrice) / firstPrice;
    let trend: MarketCondition["trend"];

    if (totalReturn > 0.05) trend = "bullish";
    else if (totalReturn < -0.05) trend = "bearish";
    else trend = "sideways";

    return {
      volatility,
      trend,
      maxDrawdown: maxDrawdown * 100,
      totalReturn: totalReturn * 100,
    };
  }

  /**
   * Utility methods
   */
  private getCacheKey(days: number, interval: DataInterval): string {
    return `${this.validCoinId || "unknown"}-${days}d-${interval}`;
  }

  private getCacheExpiry(interval: DataInterval): number {
    // Hourly data expires faster than daily data
    return interval === "hourly" ? 30 * 60 * 1000 : 60 * 60 * 1000; // 30min vs 1hr
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
    this.validCoinId = null;
  }

  /**
   * Get cache status for debugging
   */
  getCacheStatus(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const priceService = new PriceServiceTemplate();
