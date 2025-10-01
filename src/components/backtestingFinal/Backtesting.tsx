"use client";
import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { supabase } from "@/lib/data/supabaseClient";
import { PoolSnapshot } from "@/types/snapshots";
import { Strategy } from "@/types/strategy";
import { SAROS_USDC_PAIR_ADDRESS } from "@/lib/dlmm/client";
import {
  allocateSpotLiquidity,
  allocateCurveLiquidity,
  allocateBidAskLiquidity,
  calculateStrategyPerformance,
} from "@/lib/backtestingFinal/backtestingCalculations";
import { BarChart3 } from "lucide-react";

// Lazy load heavy components
const StrategyConfig = lazy(() => import("./StrategyConfig"));
const StrategyPerformance = lazy(() => import("./StrategyPerformance"));
const LiquidityChart = lazy(() => import("./LiquidityChart"));
const BacktestingTable = lazy(() => import("./BacktestingTable"));

const Backtesting: React.FC = () => {
  // Snapshot data state
  const [snapshots, setSnapshots] = useState<PoolSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30d"); // Default: 30 days
  const [selectedPoolAddress, setSelectedPoolAddress] = useState<string>(
    SAROS_USDC_PAIR_ADDRESS
  );
  const [totalLiquidity, setTotalLiquidity] = useState(1000);
  const [binRange, setBinRange] = useState(1);
  const [strategy, setStrategy] = useState<Strategy>({
    spot: [],
    curve: [],
    bidAsk: [],
  });
  const [ohlcvData, setOhlcvData] = useState<any>(null);
  const [strategyPerformance, setStrategyPerformance] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "config" | "comparison" | "simulator"
  >("config");

  // Fetch snapshots from Supabase (only once, load 30 days)
  const fetchSnapshots = async () => {
    setLoading(true);
    setError(null);

    try {
      const endTime = Date.now();
      // For now I am using a fixed 30 day time period to fetch snapshot, can change this later
      const startTime = endTime - 30 * 24 * 60 * 60 * 1000; // 30 days

      const { data, error } = await supabase
        .from("pool_snapshots")
        .select("*")
        .eq("pool_address", selectedPoolAddress)
        .gte("timestamp", startTime)
        .lte("timestamp", endTime)
        .order("timestamp", { ascending: true }); // Loading the oldest first for backtesting

      if (error) {
        throw new Error(`Failed to fetch snapshots: ${error.message}`);
      }

      // Transform data to PoolSnapshot format
      const transformedSnapshots: PoolSnapshot[] = (data || []).map(
        (row: any) => ({
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
        })
      );

      setSnapshots(transformedSnapshots);
      console.log(
        `✅ Fetched ${transformedSnapshots.length} snapshots for last 30 days`
      );
      console.log("Snapshots:", transformedSnapshots[10]);
    } catch (err) {
      console.error("❌ Error fetching snapshots:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch snapshots"
      );
    } finally {
      setLoading(false);
    }
  };

  // Convert period string to days
  const periodToDays = (period: string): number => {
    const periodMap: { [key: string]: number } = {
      "1d": 1,
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "1y": 365,
      custom: 7, // Default to 7 days for custom
    };
    return periodMap[period] || 7;
  };

  const fetchOHLCVData = async (poolAddress: string) => {
    try {
      const response = await fetch(
        `https://api.geckoterminal.com/api/v2/networks/solana/pools/${poolAddress}/ohlcv/day`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("OHLCV Data:", data.data.attributes.ohlcv_list);
      setOhlcvData(data.data.attributes.ohlcv_list);
    } catch (error) {
      console.error("Error fetching OHLCV data:", error);
      throw error;
    }
  };

  // Fetch snapshots on component mount and when pool address changes
  useEffect(() => {
    fetchSnapshots();
  }, [selectedPoolAddress]);

  // Fetch OHLCV data when snapshots are available
  useEffect(() => {
    if (snapshots.length > 0) {
      fetchOHLCVData(selectedPoolAddress);
    }
  }, [snapshots, selectedPoolAddress]);

  // Calculate strategy performance when OHLCV data is available
  useEffect(() => {
    const calculatePerformance = async () => {
      if (snapshots.length > 0 && ohlcvData && ohlcvData.length > 0) {
        const performance = await calculateStrategyPerformance(
          strategy,
          snapshots,
          totalLiquidity,
          ohlcvData
        );

        console.log(
          `Strategy Performance for ${snapshots.length} snapshots:`,
          performance
        );

        setStrategyPerformance(performance);
      }
    };

    calculatePerformance();
  }, [snapshots, strategy, totalLiquidity, ohlcvData]);

  // Memoized filtered snapshots based on selected period
  const filteredSnapshots = useMemo(() => {
    if (snapshots.length === 0) return [];

    const days = periodToDays(selectedPeriod);

    // Use the latest snapshot as the reference point instead of current time
    const latestSnapshotTime = Math.max(...snapshots.map((s) => s.timestamp));
    //convert to date latestSnapshottime
    const latestDate = new Date(latestSnapshotTime);

    // To readable string
    console.log(latestDate.toString(), "latest snapshot time");

    const endTime = latestSnapshotTime;
    const startTime = endTime - days * 24 * 60 * 60 * 1000;

    const filtered = snapshots.filter(
      (snapshot) =>
        snapshot.timestamp >= startTime && snapshot.timestamp <= endTime
    );

    console.log(
      `📊 Filtered to ${filtered.length} snapshots for ${selectedPeriod} (${days} days)`
    );
    console.log(
      `📊 Time range: ${new Date(startTime).toISOString()} to ${new Date(
        endTime
      ).toISOString()}`
    );
    return filtered;
  }, [snapshots, selectedPeriod]);

  // Get the starting snapshot (oldest in filtered range)
  const startingSnapshot =
    filteredSnapshots.length > 0 ? filteredSnapshots[0] : null;
  const activeBinId = startingSnapshot?.active_bin_id;
  const currentPrice = startingSnapshot?.current_price;

  // Calculate strategy allocations when dependencies change
  useEffect(() => {
    if (startingSnapshot && totalLiquidity > 0) {
      const newStrategy = {
        spot: allocateSpotLiquidity({
          LiquidityToAllocate: totalLiquidity,
          snapshot: startingSnapshot,
          binRange: binRange,
        }),
        curve: allocateCurveLiquidity({
          LiquidityToAllocate: totalLiquidity,
          snapshot: startingSnapshot,
          binRange: binRange,
        }),
        bidAsk: allocateBidAskLiquidity({
          LiquidityToAllocate: totalLiquidity,
          snapshot: startingSnapshot,
          binRange: binRange,
        }),
      };
      setStrategy(newStrategy);
    }
  }, [startingSnapshot, totalLiquidity, binRange]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Accuracy Warning Note */}
      <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-2">
          <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <div className="text-[10px] text-amber-800">
            <p className="font-medium mb-1">Accuracy Note:</p>
            <p>
              Smaller time selection windows (1D, 7D) may not be accurate for
              high liquidity configurations (e.g., $10K) in less popular pools.
              Snapshot data from Sept 24-28 is not available due to technical
              issues for this pool - this is for demo purposes.
            </p>
          </div>
        </div>
      </div>

      {/* Header Section */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          SAROS DLMM Backtesting Dashboard
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Compare all three DLMM strategies against historical SAROS/USDC data.
          See which approach works best for different market conditions.
        </p>

        {/* Pool Selection Dropdown */}
        <div className="mt-4 flex justify-center">
          <div className="flex items-center gap-2">
            <label
              htmlFor="pool-select"
              className="text-sm font-medium text-gray-700"
            >
              Pool Address:
            </label>
            <select
              id="pool-select"
              value={selectedPoolAddress}
              onChange={(e) => setSelectedPoolAddress(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={SAROS_USDC_PAIR_ADDRESS}>
                SAROS/USDC ({SAROS_USDC_PAIR_ADDRESS.slice(0, 8)}...)
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Snapshot Info */}
      {startingSnapshot && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">
                  Active Bin
                </span>
                <span className="text-lg font-bold text-gray-900">
                  #{activeBinId}
                </span>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Price</span>
                <span className="text-lg font-bold text-emerald-600">
                  ${currentPrice?.toFixed(6)}
                </span>
                <span className="text-xs text-gray-500">SAROS/USDC</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Period:</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-medium">
                  {selectedPeriod}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Snapshots:</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md font-medium">
                  {filteredSnapshots.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-amber-800 font-medium">Loading snapshots...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <p className="text-red-800 font-medium">Error: {error}</p>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Strategy Configuration Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Select Strategy Configuration
          </h2>
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-32">
                <div className="text-lg">Loading strategy config...</div>
              </div>
            }
          >
            <StrategyConfig
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              filteredSnapshots={filteredSnapshots}
              totalLiquidity={totalLiquidity}
              onLiquidityChange={setTotalLiquidity}
              binRange={binRange}
              onBinRangeChange={setBinRange}
              strategy={strategy}
              startingSnapshot={startingSnapshot}
            />
          </Suspense>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("config")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "config"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Specific Config
              </button>
              <button
                onClick={() => setActiveTab("comparison")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "comparison"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Comparison Table
              </button>
              <button
                onClick={() => setActiveTab("simulator")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "simulator"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Simulator
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "config" && (
              <Suspense
                fallback={
                  <div className="flex justify-center items-center h-64">
                    <div className="text-lg">
                      Loading strategy performance...
                    </div>
                  </div>
                }
              >
                <StrategyPerformance
                  strategy={strategy}
                  performance={strategyPerformance}
                  config={{
                    totalLiquidity,
                    binRange,
                    selectedPeriod,
                    days: periodToDays(selectedPeriod),
                    totalBins:
                      filteredSnapshots.length > 0
                        ? Math.floor(
                            (binRange * 100) /
                              (filteredSnapshots[0].bin_step || 1)
                          ) *
                            2 +
                          1
                        : 0,
                  }}
                />
              </Suspense>
            )}

            {activeTab === "comparison" && (
              <Suspense
                fallback={
                  <div className="flex justify-center items-center h-64">
                    <div className="text-lg">Loading comparison table...</div>
                  </div>
                }
              >
                <BacktestingTable
                  snapshots={snapshots}
                  ohlcvData={ohlcvData}
                  periodToDays={periodToDays}
                />
              </Suspense>
            )}

            {activeTab === "simulator" && (
              <div className="space-y-6">
                <div>
                  <Suspense
                    fallback={
                      <div className="flex justify-center items-center h-64">
                        <div className="text-lg">
                          Loading liquidity chart...
                        </div>
                      </div>
                    }
                  >
                    <LiquidityChart
                      filteredSnapshots={filteredSnapshots}
                      startingSnapshot={startingSnapshot}
                    />
                  </Suspense>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Backtesting;
