// src/lib/data/supabaseClient.ts

import { createClient } from "@supabase/supabase-js";
import { PoolSnapshotsTable, BinSnapshotsTable } from "@/types/snapshots";

// Database schema type
export interface Database {
  public: {
    Tables: {
      pool_snapshots: {
        Row: PoolSnapshotsTable;
        Insert: Omit<PoolSnapshotsTable, "id" | "created_at">;
        Update: Partial<Omit<PoolSnapshotsTable, "id" | "created_at">>;
      };
      bin_snapshots: {
        Row: BinSnapshotsTable;
        Insert: Omit<BinSnapshotsTable, "id" | "created_at">;
        Update: Partial<Omit<BinSnapshotsTable, "id" | "created_at">>;
      };
    };
  };
}

// Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// For server-side operations (API routes, cron jobs)
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

// Client for public operations
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Client for server-side operations (bypasses RLS)
export const supabaseAdmin = supabaseServiceKey
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
console.log("🔍 Supabase admin client:", supabaseAdmin);

// Connection test function
export async function testDatabaseConnection(): Promise<{
  success: boolean;
  error?: string;
  details?: any;
}> {
  try {
    console.log("🔍 Testing Supabase connection...");

    // Test basic connection by selecting a simple query
    const { data, error } = await supabase
      .from("pool_snapshots")
      .select("id")
      .limit(1);

    if (error) {
      console.error("❌ Database connection failed:", error.message);
      return {
        success: false,
        error: error.message,
        details: error,
      };
    }

    console.log("✅ Database connection successful");
    console.log("📊 Sample data:", data);

    return {
      success: true,
      details: {
        connected: true,
        timestamp: new Date().toISOString(),
        sampleData: data,
      },
    };
  } catch (error) {
    console.error("❌ Database connection error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: error,
    };
  }
}

// Helper function to check if tables exist
export async function checkTablesExist(): Promise<{
  pool_snapshots: boolean;
  bin_snapshots: boolean;
  error?: string;
  details?: {
    pool_snapshots_count?: number;
    bin_snapshots_count?: number;
    pool_error?: string;
    bin_error?: string;
  };
}> {
  try {
    console.log("🔍 Checking table existence...");

    // Check pool_snapshots table
    const {
      data: poolData,
      error: poolError,
      count: poolCount,
    } = await supabase
      .from("pool_snapshots")
      .select("id", { count: "exact" })
      .limit(1);

    // Check bin_snapshots table
    const { data: binData, error: binError, count: binCount } = await supabase
      .from("bin_snapshots")
      .select("id", { count: "exact" })
      .limit(1);

    const poolExists = !poolError;
    const binExists = !binError;

    console.log("📊 Table check results:", {
      pool_snapshots: {
        exists: poolExists,
        count: poolCount,
        error: poolError?.message,
      },
      bin_snapshots: {
        exists: binExists,
        count: binCount,
        error: binError?.message,
      },
    });

    return {
      pool_snapshots: poolExists,
      bin_snapshots: binExists,
      error:
        poolError || binError
          ? "Some tables missing or inaccessible"
          : undefined,
      details: {
        pool_snapshots_count: poolCount || 0,
        bin_snapshots_count: binCount || 0,
        pool_error: poolError?.message,
        bin_error: binError?.message,
      },
    };
  } catch (error) {
    console.error("❌ Table check error:", error);
    return {
      pool_snapshots: false,
      bin_snapshots: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Function to get sample data for testing
export async function getSampleData(): Promise<{
  success: boolean;
  data?: {
    pool_snapshots?: any[];
    bin_snapshots?: any[];
  };
  error?: string;
}> {
  try {
    console.log("🔍 Fetching sample data...");

    // Get sample pool snapshots
    const { data: poolData, error: poolError } = await supabase
      .from("pool_snapshots")
      .select("*")
      .limit(3)
      .order("timestamp", { ascending: false });

    // Get sample bin snapshots
    const { data: binData, error: binError } = await supabase
      .from("bin_snapshots")
      .select("*")
      .limit(3)
      .order("created_at", { ascending: false });

    if (poolError || binError) {
      return {
        success: false,
        error:
          poolError?.message ||
          binError?.message ||
          "Failed to fetch sample data",
      };
    }

    console.log("✅ Sample data fetched successfully");
    console.log("📊 Pool snapshots:", poolData?.length || 0);
    console.log("📊 Bin snapshots:", binData?.length || 0);

    return {
      success: true,
      data: {
        pool_snapshots: poolData || [],
        bin_snapshots: binData || [],
      },
    };
  } catch (error) {
    console.error("❌ Sample data fetch error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Utility function for error handling
export function isSupabaseError(
  error: any
): error is { message: string; code?: string } {
  return error && typeof error.message === "string";
}
