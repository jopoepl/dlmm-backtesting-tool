"use client";

import { useState, lazy, Suspense } from "react";
// import { WalletButton } from "@/components/wallet/WalletButton";
import { Modal } from "@/components/ui/Modal";
import {
  testDatabaseConnection,
  checkTablesExist,
} from "@/lib/data/supabaseClient";
import {
  collectPoolSnapshot,
  saveSnapshotToDatabase,
} from "@/lib/data/snapshotService";
import { DLMMService, SAROS_USDC_PAIR_ADDRESS } from "@/lib/dlmm/client";
import { PriceService } from "@/lib/data/priceService";

// Lazy load heavy components
const Backtesting = lazy(() =>
  import("@/components/backtestingFinal/Backtesting")
);

export default function Home() {
  const priceService = new PriceService();
  const [testResults, setTestResults] = useState<{
    type:
      | "api"
      | "database"
      | "snapshot"
      | "dlmm"
      | "dlmm-reserves"
      | "dlmm-bins"
      | "dlmm-bins-advanced"
      | "dlmm-complete"
      | null;
    data: unknown;
    error: string | null;
    loading: boolean;
  }>({
    type: null,
    data: null,
    error: null,
    loading: false,
  });
  const [showTestModal, setShowTestModal] = useState(false);

  const testCoinGeckoAPI = async () => {
    setTestResults({ type: "api", data: null, error: null, loading: true });
    setShowTestModal(true);

    try {
      const data = await priceService.getPriceData();
      setTestResults({ type: "api", data, error: null, loading: false });
    } catch (error) {
      setTestResults({
        type: "api",
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        loading: false,
      });
    }
  };

  const testDatabase = async () => {
    setTestResults({
      type: "snapshot",
      data: null,
      error: null,
      loading: true,
    });
    setShowTestModal(true);

    try {
      console.log("🔍 Testing database connection and collecting snapshot...");

      // Test actual database connection first
      const connectionResult = await testDatabaseConnection();

      if (!connectionResult.success) {
        setTestResults({
          type: "snapshot",
          data: null,
          error: connectionResult.error || "Database connection failed",
          loading: false,
        });
        return;
      }

      console.log("✅ Database connected, collecting pool snapshot...");

      // Collect pool snapshot
      const snapshot = await collectPoolSnapshot(SAROS_USDC_PAIR_ADDRESS);
      console.log("📊 Snapshot collected:", snapshot);

      // Save snapshot to database
      console.log("💾 Saving snapshot to database...");
      const saveResult = await saveSnapshotToDatabase(snapshot);

      if (!saveResult) {
        setTestResults({
          type: "snapshot",
          data: null,
          error: "Failed to save snapshot to database",
          loading: false,
        });
        return;
      }

      // Check tables to get updated counts
      const tablesResult = await checkTablesExist();

      setTestResults({
        type: "snapshot",
        data: {
          status: "success",
          snapshot: {
            pool_address: snapshot.pool_address,
            pool_name: snapshot.pool_name,
            timestamp: new Date(snapshot.timestamp).toISOString(),
            current_price: snapshot.current_price,
            market_price: snapshot.market_price,
            price_deviation: snapshot.price_deviation,
            bin_count: snapshot.bin_data.length,
            active_bin_id: snapshot.active_bin_id,
          },
          database: {
            poolRecords: tablesResult.details?.pool_snapshots_count || 0,
            binRecords: tablesResult.details?.bin_snapshots_count || 0,
          },
          message: "Snapshot collected and saved successfully!",
        },
        error: null,
        loading: false,
      });
    } catch (error) {
      console.error("Snapshot test error:", error);
      setTestResults({
        type: "snapshot",
        data: null,
        error:
          error instanceof Error ? error.message : "Snapshot collection failed",
        loading: false,
      });
    }
  };

  const testDLMMPoolInfo = async () => {
    setTestResults({
      type: "dlmm",
      data: null,
      error: null,
      loading: true,
    });
    setShowTestModal(true);

    try {
      console.log("🔍 Testing DLMM pool metadata...");
      const dlmmService = new DLMMService();

      // Test pool metadata fetch
      const poolMetadata = await dlmmService.fetchPoolMetadata(
        SAROS_USDC_PAIR_ADDRESS
      );

      if (!poolMetadata) {
        setTestResults({
          type: "dlmm",
          data: null,
          error: "Failed to fetch pool metadata - returned null",
          loading: false,
        });
        return;
      }

      setTestResults({
        type: "dlmm",
        data: {
          status: "success",
          poolMetadata: poolMetadata,
          timestamp: new Date().toISOString(),
        },
        error: null,
        loading: false,
      });
    } catch (error) {
      console.error("DLMM test error:", error);
      setTestResults({
        type: "dlmm",
        data: null,
        error:
          error instanceof Error
            ? error.message
            : "DLMM pool metadata test failed",
        loading: false,
      });
    }
  };

  const testDLMMReserves = async () => {
    setTestResults({
      type: "dlmm-reserves",
      data: null,
      error: null,
      loading: true,
    });
    setShowTestModal(true);

    try {
      console.log("🔍 Testing DLMM pool reserves...");
      const dlmmService = new DLMMService();

      const reserves = await dlmmService.getPoolReserves(
        SAROS_USDC_PAIR_ADDRESS
      );

      if (!reserves) {
        setTestResults({
          type: "dlmm-reserves",
          data: null,
          error: "Failed to fetch pool reserves - returned null",
          loading: false,
        });
        return;
      }

      setTestResults({
        type: "dlmm-reserves",
        data: {
          status: "success",
          reserves: reserves,
          timestamp: new Date().toISOString(),
        },
        error: null,
        loading: false,
      });
    } catch (error) {
      console.error("DLMM reserves test error:", error);
      setTestResults({
        type: "dlmm-reserves",
        data: null,
        error:
          error instanceof Error
            ? error.message
            : "DLMM pool reserves test failed",
        loading: false,
      });
    }
  };

  const testDLMMBins = async () => {
    setTestResults({
      type: "dlmm-bins",
      data: null,
      error: null,
      loading: true,
    });
    setShowTestModal(true);

    try {
      console.log("🔍 Testing DLMM surrounding bins...");
      const dlmmService = new DLMMService();

      const bins = await dlmmService.getSurroundingBins(
        SAROS_USDC_PAIR_ADDRESS,
        10
      );

      setTestResults({
        type: "dlmm-bins",
        data: {
          status: "success",
          bins: bins,
          binCount: bins.length,
          timestamp: new Date().toISOString(),
        },
        error: null,
        loading: false,
      });
    } catch (error) {
      console.error("DLMM bins test error:", error);
      setTestResults({
        type: "dlmm-bins",
        data: null,
        error:
          error instanceof Error
            ? error.message
            : "DLMM surrounding bins test failed",
        loading: false,
      });
    }
  };

  const testDLMMBinsSimple = async () => {
    setTestResults({
      type: "dlmm-bins-advanced",
      data: null,
      error: null,
      loading: true,
    });
    setShowTestModal(true);

    try {
      console.log("🔍 Testing DLMM surrounding bins (simple method)...");
      const dlmmService = new DLMMService();

      const bins = await dlmmService.getSurroundingBinsSimple(
        SAROS_USDC_PAIR_ADDRESS,
        10
      );

      setTestResults({
        type: "dlmm-bins-advanced",
        data: {
          status: "success",
          bins: bins,
          binCount: bins.length,
          method: "getBinArrayInfo (simple - active array only)",
          timestamp: new Date().toISOString(),
        },
        error: null,
        loading: false,
      });
    } catch (error) {
      console.error("DLMM bins simple test error:", error);
      setTestResults({
        type: "dlmm-bins-advanced",
        data: null,
        error:
          error instanceof Error
            ? error.message
            : "DLMM surrounding bins (simple) test failed",
        loading: false,
      });
    }
  };

  const testDLMMComplete = async () => {
    setTestResults({
      type: "dlmm-complete",
      data: null,
      error: null,
      loading: true,
    });
    setShowTestModal(true);

    try {
      console.log("🔍 Testing complete DLMM pool info...");
      const dlmmService = new DLMMService();

      const completeInfo = await dlmmService.getCompletePoolInfo(
        SAROS_USDC_PAIR_ADDRESS
      );

      if (!completeInfo) {
        setTestResults({
          type: "dlmm-complete",
          data: null,
          error: "Failed to fetch complete pool info - returned null",
          loading: false,
        });
        return;
      }

      setTestResults({
        type: "dlmm-complete",
        data: {
          status: "success",
          completeInfo: completeInfo,
          timestamp: new Date().toISOString(),
        },
        error: null,
        loading: false,
      });
    } catch (error) {
      console.error("DLMM complete test error:", error);
      setTestResults({
        type: "dlmm-complete",
        data: null,
        error:
          error instanceof Error
            ? error.message
            : "DLMM complete pool info test failed",
        loading: false,
      });
    }
  };

  const closeTestModal = () => {
    setShowTestModal(false);
    setTestResults({ type: null, data: null, error: null, loading: false });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">
                DLMM Analytics Dashboard
              </h1>
              {process.env.NEXT_PUBLIC_NODE_ENV === "development" && (
                <>
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                    Demo Mode
                  </span>
                  <button
                    onClick={testCoinGeckoAPI}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    Test CoinGecko API
                  </button>
                  <button
                    onClick={testDatabase}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                  >
                    Collect & Save Snapshot
                  </button>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={testDLMMPoolInfo}
                      className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
                    >
                      Pool Metadata
                    </button>
                    <button
                      onClick={testDLMMReserves}
                      className="bg-indigo-500 text-white px-3 py-1 rounded text-sm hover:bg-indigo-600"
                    >
                      Pool Reserves
                    </button>
                    <button
                      onClick={testDLMMBins}
                      className="bg-pink-500 text-white px-3 py-1 rounded text-sm hover:bg-pink-600"
                    >
                      Surrounding Bins
                    </button>
                    <button
                      onClick={testDLMMBinsSimple}
                      className="bg-rose-500 text-white px-3 py-1 rounded text-sm hover:bg-rose-600"
                    >
                      Bins (Simple)
                    </button>
                    <button
                      onClick={testDLMMComplete}
                      className="bg-violet-500 text-white px-3 py-1 rounded text-sm hover:bg-violet-600"
                    >
                      Complete Info
                    </button>
                  </div>
                </>
              )}
            </div>
            {/* <WalletButton /> */}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto">
        {/* Main Backtesting Component */}
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-64">
              <div className="text-lg">Loading backtesting interface...</div>
            </div>
          }
        >
          <Backtesting />
        </Suspense>
      </div>

      {/* Test Results Modal */}
      <Modal
        isOpen={showTestModal}
        onCloseAction={closeTestModal}
        title={`Test ${
          testResults.type === "api"
            ? "CoinGecko API"
            : testResults.type === "database"
            ? "Database"
            : testResults.type === "snapshot"
            ? "Snapshot Collection & Save"
            : testResults.type === "dlmm"
            ? "DLMM Pool Metadata"
            : testResults.type === "dlmm-reserves"
            ? "DLMM Pool Reserves"
            : testResults.type === "dlmm-bins"
            ? "DLMM Surrounding Bins"
            : testResults.type === "dlmm-bins-advanced"
            ? "DLMM Surrounding Bins (Advanced)"
            : "DLMM Complete Info"
        } Results`}
        size="lg"
      >
        <div className="space-y-4">
          {testResults.loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">
                {testResults.type === "api"
                  ? "Testing API connection..."
                  : testResults.type === "database"
                  ? "Testing database connection..."
                  : testResults.type === "snapshot"
                  ? "Collecting snapshot and saving to database..."
                  : testResults.type === "dlmm"
                  ? "Testing DLMM pool metadata..."
                  : testResults.type === "dlmm-reserves"
                  ? "Testing DLMM pool reserves..."
                  : testResults.type === "dlmm-bins"
                  ? "Testing DLMM surrounding bins..."
                  : testResults.type === "dlmm-bins-advanced"
                  ? "Testing DLMM surrounding bins (advanced)..."
                  : "Testing DLMM complete info..."}
              </span>
            </div>
          ) : testResults.error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-red-400 mr-3">❌</div>
                <div>
                  <h4 className="text-red-800 font-medium">Test Failed</h4>
                  <p className="text-red-700 text-sm mt-1">
                    {testResults.error}
                  </p>
                </div>
              </div>
            </div>
          ) : testResults.data ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="text-green-400 mr-3">✅</div>
                <h4 className="text-green-800 font-medium">Test Successful</h4>
              </div>

              {testResults.type === "api" ? (
                <div className="space-y-2">
                  <p className="text-green-700 text-sm">
                    <strong>API Response:</strong>{" "}
                    {JSON.stringify(testResults.data, null, 2)}
                  </p>
                </div>
              ) : testResults.type === "database" ? (
                <div className="space-y-2">
                  <p className="text-green-700 text-sm">
                    <strong>Status:</strong>{" "}
                    {(testResults.data as { status?: string })?.status}
                  </p>
                  <p className="text-green-700 text-sm">
                    <strong>Connection:</strong>{" "}
                    {
                      (testResults.data as { connectionTime?: string })
                        ?.connectionTime
                    }
                  </p>
                  <p className="text-green-700 text-sm">
                    <strong>Available Tables:</strong>{" "}
                    {((testResults.data as { tables?: string[] })?.tables
                      ?.length || 0) > 0
                      ? (testResults.data as { tables: string[] }).tables.join(
                          ", "
                        )
                      : "No tables found"}
                  </p>
                  {(testResults.data as { poolRecords?: number })
                    ?.poolRecords !== undefined && (
                    <p className="text-green-700 text-sm">
                      <strong>Pool Records:</strong>{" "}
                      {
                        (testResults.data as { poolRecords: number })
                          .poolRecords
                      }
                    </p>
                  )}
                  {(testResults.data as { binRecords?: number })?.binRecords !==
                    undefined && (
                    <p className="text-green-700 text-sm">
                      <strong>Bin Records:</strong>{" "}
                      {(testResults.data as { binRecords: number }).binRecords}
                    </p>
                  )}
                </div>
              ) : testResults.type === "snapshot" ? (
                <div className="space-y-4">
                  <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                    <p className="text-green-800 font-medium text-sm mb-2">
                      ✅ {(testResults.data as { message?: string })?.message}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-green-800 text-sm">
                      Snapshot Details:
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">
                          Pool Address:
                        </p>
                        <p className="text-blue-600 font-mono text-xs">
                          {
                            (testResults.data as {
                              snapshot?: { pool_address?: string };
                            })?.snapshot?.pool_address
                          }
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Pool Name:</p>
                        <p className="text-gray-600">
                          {
                            (testResults.data as {
                              snapshot?: { pool_name?: string };
                            })?.snapshot?.pool_name
                          }
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Timestamp:</p>
                        <p className="text-gray-600">
                          {
                            (testResults.data as {
                              snapshot?: { timestamp?: string };
                            })?.snapshot?.timestamp
                          }
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">
                          Active Bin ID:
                        </p>
                        <p className="text-blue-600">
                          {
                            (testResults.data as {
                              snapshot?: { active_bin_id?: number };
                            })?.snapshot?.active_bin_id
                          }
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">
                          Current Price:
                        </p>
                        <p className="text-green-600">
                          {(testResults.data as {
                            snapshot?: { current_price?: number };
                          })?.snapshot?.current_price?.toFixed(6)}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">
                          Market Price:
                        </p>
                        <p className="text-blue-600">
                          {(testResults.data as {
                            snapshot?: { market_price?: number };
                          })?.snapshot?.market_price?.toFixed(6)}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">
                          Price Deviation:
                        </p>
                        <p className="text-orange-600">
                          {(
                            ((testResults.data as {
                              snapshot?: { price_deviation?: number };
                            })?.snapshot?.price_deviation || 0) * 100
                          ).toFixed(2)}
                          %
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Bin Count:</p>
                        <p className="text-purple-600">
                          {
                            (testResults.data as {
                              snapshot?: { bin_count?: number };
                            })?.snapshot?.bin_count
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-green-800 text-sm">
                      Database Status:
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">
                          Pool Records:
                        </p>
                        <p className="text-green-600">
                          {
                            (testResults.data as {
                              database?: { poolRecords?: number };
                            })?.database?.poolRecords
                          }
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">
                          Bin Records:
                        </p>
                        <p className="text-green-600">
                          {
                            (testResults.data as {
                              database?: { binRecords?: number };
                            })?.database?.binRecords
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : testResults.type === "dlmm" ? (
                <div className="space-y-2">
                  <p className="text-green-700 text-sm">
                    <strong>Status:</strong>{" "}
                    {(testResults.data as { status?: string })?.status}
                  </p>
                  <p className="text-green-700 text-sm">
                    <strong>Timestamp:</strong>{" "}
                    {(testResults.data as { timestamp?: string })?.timestamp}
                  </p>
                  <div className="mt-3">
                    <p className="text-green-700 text-sm font-medium mb-2">
                      <strong>Pool Metadata:</strong>
                    </p>
                    <div className="bg-gray-50 border rounded-lg p-3 max-h-96 overflow-y-auto">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(
                          (testResults.data as { poolMetadata?: unknown })
                            ?.poolMetadata,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : testResults.type === "dlmm-reserves" ? (
                <div className="space-y-2">
                  <p className="text-green-700 text-sm">
                    <strong>Status:</strong>{" "}
                    {(testResults.data as { status?: string })?.status}
                  </p>
                  <p className="text-green-700 text-sm">
                    <strong>Timestamp:</strong>{" "}
                    {(testResults.data as { timestamp?: string })?.timestamp}
                  </p>
                  <div className="mt-3">
                    <p className="text-green-700 text-sm font-medium mb-2">
                      <strong>Pool Reserves:</strong>
                    </p>
                    <div className="bg-gray-50 border rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-800">
                            Base Amount:
                          </p>
                          <p className="text-blue-600">
                            {(testResults.data as {
                              reserves?: { baseAmount?: number };
                            })?.reserves?.baseAmount?.toFixed(6)}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            Quote Amount:
                          </p>
                          <p className="text-blue-600">
                            {(testResults.data as {
                              reserves?: { quoteAmount?: number };
                            })?.reserves?.quoteAmount?.toFixed(6)}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            Base Decimals:
                          </p>
                          <p className="text-gray-600">
                            {
                              (testResults.data as {
                                reserves?: { baseDecimals?: number };
                              })?.reserves?.baseDecimals
                            }
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            Quote Decimals:
                          </p>
                          <p className="text-gray-600">
                            {
                              (testResults.data as {
                                reserves?: { quoteDecimals?: number };
                              })?.reserves?.quoteDecimals
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : testResults.type === "dlmm-bins" ? (
                <div className="space-y-2">
                  <p className="text-green-700 text-sm">
                    <strong>Status:</strong>{" "}
                    {(testResults.data as { status?: string })?.status}
                  </p>
                  <p className="text-green-700 text-sm">
                    <strong>Bin Count:</strong>{" "}
                    {(testResults.data as { binCount?: number })?.binCount}
                  </p>
                  <p className="text-green-700 text-sm">
                    <strong>Method:</strong> getBinArrayInfo
                  </p>
                  <p className="text-green-700 text-sm">
                    <strong>Timestamp:</strong>{" "}
                    {(testResults.data as { timestamp?: string })?.timestamp}
                  </p>
                  <div className="mt-3">
                    <p className="text-green-700 text-sm font-medium mb-2">
                      <strong>Surrounding Bins:</strong>
                    </p>
                    <div className="bg-gray-50 border rounded-lg p-3 max-h-96 overflow-y-auto">
                      <div className="space-y-2">
                        {(
                          (testResults.data as {
                            bins?: {
                              binId: number;
                              price: number;
                              baseAmount: number;
                              quoteAmount: number;
                            }[];
                          })?.bins || []
                        )
                          .slice(0, 20)
                          .map(
                            (
                              bin: {
                                binId: number;
                                price: number;
                                baseAmount: number;
                                quoteAmount: number;
                              },
                              index: number
                            ) => (
                              <div
                                key={index}
                                className="flex justify-between items-center p-2 bg-white rounded border"
                              >
                                <span className="font-mono text-sm">
                                  Bin {bin.binId}
                                </span>
                                <span className="text-sm">
                                  Price: {bin.price.toFixed(6)}
                                </span>
                                <span className="text-sm text-gray-600">
                                  Base: {bin.baseAmount}
                                </span>
                                <span className="text-sm text-gray-600">
                                  Quote: {bin.quoteAmount}
                                </span>
                              </div>
                            )
                          )}
                        {(
                          (testResults.data as { bins?: unknown[] })?.bins || []
                        ).length > 20 && (
                          <p className="text-gray-500 text-sm text-center">
                            ... and{" "}
                            {(
                              (testResults.data as { bins?: unknown[] })
                                ?.bins || []
                            ).length - 20}{" "}
                            more bins
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : testResults.type === "dlmm-bins-advanced" ? (
                <div className="space-y-2">
                  <p className="text-green-700 text-sm">
                    <strong>Status:</strong>{" "}
                    {(testResults.data as { status?: string })?.status}
                  </p>
                  <p className="text-green-700 text-sm">
                    <strong>Bin Count:</strong>{" "}
                    {(testResults.data as { binCount?: number })?.binCount}
                  </p>
                  <p className="text-green-700 text-sm">
                    <strong>Method:</strong>{" "}
                    {(testResults.data as { method?: string })?.method}
                  </p>
                  <p className="text-green-700 text-sm">
                    <strong>Timestamp:</strong>{" "}
                    {(testResults.data as { timestamp?: string })?.timestamp}
                  </p>
                  <div className="mt-3">
                    <p className="text-green-700 text-sm font-medium mb-2">
                      <strong>Surrounding Bins (Advanced):</strong>
                    </p>
                    <div className="bg-gray-50 border rounded-lg p-3 max-h-96 overflow-y-auto">
                      <div className="space-y-2">
                        {(
                          (testResults.data as {
                            bins?: {
                              binId: number;
                              price: number;
                              baseAmount: number;
                              quoteAmount: number;
                            }[];
                          })?.bins || []
                        )
                          .slice(0, 20)
                          .map(
                            (
                              bin: {
                                binId: number;
                                price: number;
                                baseAmount: number;
                                quoteAmount: number;
                              },
                              index: number
                            ) => (
                              <div
                                key={index}
                                className="flex justify-between items-center p-2 bg-white rounded border"
                              >
                                <span className="font-mono text-sm">
                                  Bin {bin.binId}
                                </span>
                                <span className="text-sm">
                                  Price: {bin.price.toFixed(6)}
                                </span>
                                <span className="text-sm text-gray-600">
                                  Base: {bin.baseAmount}
                                </span>
                                <span className="text-sm text-gray-600">
                                  Quote: {bin.quoteAmount}
                                </span>
                              </div>
                            )
                          )}
                        {(
                          (testResults.data as { bins?: unknown[] })?.bins || []
                        ).length > 20 && (
                          <p className="text-gray-500 text-sm text-center">
                            ... and{" "}
                            {(
                              (testResults.data as { bins?: unknown[] })
                                ?.bins || []
                            ).length - 20}{" "}
                            more bins
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : testResults.type === "dlmm-complete" ? (
                <div className="space-y-2">
                  <p className="text-green-700 text-sm">
                    <strong>Status:</strong>{" "}
                    {(testResults.data as { status?: string })?.status}
                  </p>
                  <p className="text-green-700 text-sm">
                    <strong>Timestamp:</strong>{" "}
                    {(testResults.data as { timestamp?: string })?.timestamp}
                  </p>
                  <div className="mt-3 space-y-4">
                    {/* Pool Metadata Summary */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h4 className="font-medium text-blue-800 mb-2">
                        Pool Metadata
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p>
                          <strong>Pool Address:</strong>{" "}
                          {
                            (testResults.data as {
                              completeInfo?: {
                                metaData?: { poolAddress?: string };
                              };
                            })?.completeInfo?.metaData?.poolAddress
                          }
                        </p>
                        <p>
                          <strong>Trade Fee:</strong>{" "}
                          {
                            (testResults.data as {
                              completeInfo?: {
                                metaData?: { tradeFee?: number };
                              };
                            })?.completeInfo?.metaData?.tradeFee
                          }
                          %
                        </p>
                        <p>
                          <strong>Base Mint:</strong>{" "}
                          {
                            (testResults.data as {
                              completeInfo?: {
                                metaData?: { baseMint?: string };
                              };
                            })?.completeInfo?.metaData?.baseMint
                          }
                        </p>
                        <p>
                          <strong>Quote Mint:</strong>{" "}
                          {
                            (testResults.data as {
                              completeInfo?: {
                                metaData?: { quoteMint?: string };
                              };
                            })?.completeInfo?.metaData?.quoteMint
                          }
                        </p>
                      </div>
                    </div>

                    {/* Reserves Summary */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <h4 className="font-medium text-green-800 mb-2">
                        Pool Reserves
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p>
                          <strong>Base Amount:</strong>{" "}
                          {(
                            (testResults.data as {
                              completeInfo?: {
                                reserves?: { baseAmount?: number };
                              };
                            })?.completeInfo?.reserves?.baseAmount || 0
                          ).toFixed(6)}
                        </p>
                        <p>
                          <strong>Quote Amount:</strong>{" "}
                          {(
                            (testResults.data as {
                              completeInfo?: {
                                reserves?: { quoteAmount?: number };
                              };
                            })?.completeInfo?.reserves?.quoteAmount || 0
                          ).toFixed(6)}
                        </p>
                        <p>
                          <strong>Current Price:</strong>{" "}
                          {(
                            (testResults.data as {
                              completeInfo?: { currentMarketPrice?: number };
                            })?.completeInfo?.currentMarketPrice || 0
                          ).toFixed(6)}
                        </p>
                      </div>
                    </div>

                    {/* Pair Account Summary */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <h4 className="font-medium text-purple-800 mb-2">
                        Pair Account
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p>
                          <strong>Active Bin:</strong>{" "}
                          {
                            (testResults.data as {
                              completeInfo?: { activeBin?: number };
                            })?.completeInfo?.activeBin
                          }
                        </p>
                        <p>
                          <strong>Bin Step:</strong>{" "}
                          {
                            (testResults.data as {
                              completeInfo?: { binStep?: number };
                            })?.completeInfo?.binStep
                          }
                        </p>
                        <p>
                          <strong>Base Fee:</strong>{" "}
                          {
                            (testResults.data as {
                              completeInfo?: {
                                pairAccount?: { baseFeePct?: number };
                              };
                            })?.completeInfo?.pairAccount?.baseFeePct
                          }
                          %
                        </p>
                        <p>
                          <strong>Quote Fee:</strong>{" "}
                          {
                            (testResults.data as {
                              completeInfo?: {
                                pairAccount?: { quoteFeePct?: number };
                              };
                            })?.completeInfo?.pairAccount?.quoteFeePct
                          }
                          %
                        </p>
                      </div>
                    </div>

                    {/* Bin Array Info */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <h4 className="font-medium text-orange-800 mb-2">
                        Bin Array Info
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p>
                          <strong>Array Index:</strong>{" "}
                          {
                            (testResults.data as {
                              completeInfo?: {
                                binArrayInfo?: { binArrayIndex?: number };
                              };
                            })?.completeInfo?.binArrayInfo?.binArrayIndex
                          }
                        </p>
                        <p>
                          <strong>Bin Count:</strong>{" "}
                          {(testResults.data as {
                            completeInfo?: {
                              binArrayInfo?: { bins?: unknown[] };
                            };
                          })?.completeInfo?.binArrayInfo?.bins?.length || 0}
                        </p>
                        <p>
                          <strong>Lower Bin ID:</strong>{" "}
                          {
                            (testResults.data as {
                              completeInfo?: {
                                binArrayInfo?: { lowerBinId?: number };
                              };
                            })?.completeInfo?.binArrayInfo?.lowerBinId
                          }
                        </p>
                        <p>
                          <strong>Upper Bin ID:</strong>{" "}
                          {
                            (testResults.data as {
                              completeInfo?: {
                                binArrayInfo?: { upperBinId?: number };
                              };
                            })?.completeInfo?.binArrayInfo?.upperBinId
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={closeTestModal}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
