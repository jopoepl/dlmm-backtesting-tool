import { NextRequest, NextResponse } from "next/server";
import { logPoolData } from "@/lib/data/snapshotService";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 API: Starting snapshot collection...");
    console.log("⏰ Timestamp:", new Date().toISOString());

    // Collect and save snapshot
    const snapshot = await logPoolData();

    console.log("✅ API: Snapshot collection completed successfully");
    console.log(
      "📊 Snapshot timestamp:",
      new Date(snapshot.timestamp).toISOString()
    );
    console.log("🏊 Pool address:", snapshot.pool_address);
    console.log("💰 Current price:", snapshot.current_price);
    console.log("📈 Market price:", snapshot.market_price);
    console.log("📊 Bin data count:", snapshot.bin_data?.length || 0);

    return NextResponse.json({
      success: true,
      message: "Snapshot collected successfully",
      data: {
        timestamp: snapshot.timestamp,
        pool_address: snapshot.pool_address,
        current_price: snapshot.current_price,
        market_price: snapshot.market_price,
        bin_data_count: snapshot.bin_data?.length || 0,
      },
      snapshot: snapshot,
    });
  } catch (error) {
    console.error("❌ API: Error in snapshot collection:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to collect snapshot",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Allow POST requests as well for flexibility
  return GET(request);
}
