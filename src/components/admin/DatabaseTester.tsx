"use client";

import { useState } from "react";
import {
  testDatabaseConnection,
  checkTablesExist,
  getSampleData,
} from "@/lib/data/supabaseClient";
import { Database, Zap, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface TestResult {
  connection?: {
    success: boolean;
    error?: string;
    details?: unknown;
  };
  tables?: {
    pool_snapshots: boolean;
    bin_snapshots: boolean;
    error?: string;
    details?: {
      pool_snapshots_count?: number;
      bin_snapshots_count?: number;
      pool_error?: string;
      bin_error?: string;
    };
  };
  sampleData?: {
    success: boolean;
    data?: {
      pool_snapshots?: unknown[];
      bin_snapshots?: unknown[];
    };
    error?: string;
  };
}

export function DatabaseTester() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult>({});

  const runTests = async () => {
    setTesting(true);
    setResults({});

    try {
      console.log("🔍 Starting database tests...");

      // Test connection
      const connectionResult = await testDatabaseConnection();
      setResults((prev) => ({ ...prev, connection: connectionResult }));

      // Test tables if connection successful
      if (connectionResult.success) {
        const tablesResult = await checkTablesExist();
        setResults((prev) => ({ ...prev, tables: tablesResult }));

        // Get sample data if tables exist
        if (tablesResult.pool_snapshots || tablesResult.bin_snapshots) {
          const sampleDataResult = await getSampleData();
          setResults((prev) => ({ ...prev, sampleData: sampleDataResult }));
        }
      }
    } catch (error) {
      console.error("Test error:", error);
      setResults((prev) => ({
        ...prev,
        connection: {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }));
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (success?: boolean) => {
    if (success === undefined)
      return <AlertCircle className="w-5 h-5 text-gray-400" />;
    return success ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getStatusColor = (success?: boolean) => {
    if (success === undefined) return "text-gray-600";
    return success ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg border shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Database Connection Test
        </h2>
        <p className="text-gray-600">
          Test Supabase connection and verify database schema
        </p>
      </div>

      {/* Test Button */}
      <div className="mb-6">
        <button
          onClick={runTests}
          disabled={testing}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2
                     transition-colors"
        >
          {testing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Running Tests...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Run Database Tests
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {(results.connection || results.tables) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>

          {/* Connection Test */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              {getStatusIcon(results.connection?.success)}
              <span
                className={`font-medium ${getStatusColor(
                  results.connection?.success
                )}`}
              >
                Database Connection
              </span>
            </div>

            {results.connection?.success && (
              <div className="ml-8">
                <p className="text-sm text-green-600 mb-2">
                  ✅ Successfully connected to Supabase
                </p>
                {(results.connection.details as { sampleData?: unknown[] })
                  ?.sampleData && (
                  <p className="text-xs text-gray-600">
                    Sample data found:{" "}
                    {
                      (results.connection.details as { sampleData: unknown[] })
                        .sampleData.length
                    }{" "}
                    records
                  </p>
                )}
              </div>
            )}

            {results.connection?.error && (
              <div className="ml-8">
                <p className="text-sm text-red-600 mb-2">
                  ❌ Connection failed:
                </p>
                <code className="block text-xs bg-red-50 p-2 rounded text-red-800">
                  {results.connection.error}
                </code>
              </div>
            )}
          </div>

          {/* Tables Test */}
          {results.tables && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                {getStatusIcon(
                  results.tables.pool_snapshots && results.tables.bin_snapshots
                )}
                <span
                  className={`font-medium ${getStatusColor(
                    results.tables.pool_snapshots &&
                      results.tables.bin_snapshots
                  )}`}
                >
                  Database Tables
                </span>
              </div>

              <div className="ml-8 space-y-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.tables.pool_snapshots)}
                  <span
                    className={`text-sm ${getStatusColor(
                      results.tables.pool_snapshots
                    )}`}
                  >
                    pool_snapshots table
                  </span>
                  {results.tables.details?.pool_snapshots_count !==
                    undefined && (
                    <span className="text-xs text-gray-500">
                      ({results.tables.details.pool_snapshots_count} records)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {getStatusIcon(results.tables.bin_snapshots)}
                  <span
                    className={`text-sm ${getStatusColor(
                      results.tables.bin_snapshots
                    )}`}
                  >
                    bin_snapshots table
                  </span>
                  {results.tables.details?.bin_snapshots_count !==
                    undefined && (
                    <span className="text-xs text-gray-500">
                      ({results.tables.details.bin_snapshots_count} records)
                    </span>
                  )}
                </div>

                {results.tables.error && (
                  <div className="mt-2">
                    <p className="text-sm text-red-600">Error:</p>
                    <code className="block text-xs bg-red-50 p-2 rounded text-red-800">
                      {results.tables.error}
                    </code>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sample Data */}
          {results.sampleData && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                {getStatusIcon(results.sampleData.success)}
                <span
                  className={`font-medium ${getStatusColor(
                    results.sampleData.success
                  )}`}
                >
                  Sample Data
                </span>
              </div>

              {results.sampleData.success && results.sampleData.data && (
                <div className="ml-8 space-y-3">
                  {results.sampleData.data.pool_snapshots &&
                    results.sampleData.data.pool_snapshots.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Pool Snapshots (
                          {results.sampleData.data.pool_snapshots.length}{" "}
                          records):
                        </p>
                        <div className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(
                              results.sampleData.data.pool_snapshots[0],
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      </div>
                    )}

                  {results.sampleData.data.bin_snapshots &&
                    results.sampleData.data.bin_snapshots.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Bin Snapshots (
                          {results.sampleData.data.bin_snapshots.length}{" "}
                          records):
                        </p>
                        <div className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(
                              results.sampleData.data.bin_snapshots[0],
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      </div>
                    )}
                </div>
              )}

              {results.sampleData.error && (
                <div className="ml-8">
                  <p className="text-sm text-red-600 mb-2">
                    ❌ Failed to fetch sample data:
                  </p>
                  <code className="block text-xs bg-red-50 p-2 rounded text-red-800">
                    {results.sampleData.error}
                  </code>
                </div>
              )}
            </div>
          )}

          {/* Environment Check */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              Environment Variables
            </h4>
            <div className="text-sm space-y-1 ml-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(!!process.env.NEXT_PUBLIC_SUPABASE_URL)}
                <span>NEXT_PUBLIC_SUPABASE_URL</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)}
                <span>NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-600">
                  SUPABASE_SERVICE_ROLE_KEY (server-side only)
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 ml-2">
              Note: Service role key is only available on the server-side and
              cannot be checked from client components.
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Setup Instructions</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>1. Create a Supabase project at supabase.com</p>
          <p>2. Copy your project URL and API keys to .env.local</p>
          <p>3. Run the SQL schema in your Supabase SQL Editor</p>
          <p>4. Click &quot;Run Database Tests&quot; to verify setup</p>
        </div>
      </div>
    </div>
  );
}
