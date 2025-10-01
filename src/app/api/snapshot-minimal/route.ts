import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 API: Starting minimal snapshot collection...");
    console.log("⏰ Timestamp:", new Date().toISOString());

    // Return a minimal response without heavy dependencies
    const mockSnapshot = {
      timestamp: Date.now(),
      pool_address: "mock-pool-address",
      current_price: 0.001,
      market_price: 0.001,
      bin_data_count: 0,
      message: "Minimal snapshot - heavy dependencies excluded",
    };

    console.log("✅ API: Minimal snapshot completed successfully");

    return NextResponse.json({
      success: true,
      message: "Minimal snapshot collected successfully",
      data: mockSnapshot,
    });
  } catch (error) {
    console.error("❌ API: Error in minimal snapshot collection:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to collect minimal snapshot",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
