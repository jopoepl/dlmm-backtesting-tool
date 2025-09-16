import { NextRequest, NextResponse } from "next/server";

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const COINGECKO_API_URL =
  process.env.COINGECKO_API_URL || "https://api.coingecko.com/api/v3";

enum Range {
  "1d" = "1d",
  "7d" = "7d",
  "30d" = "30d",
  "90d" = "90d",
}

// Convert range to Unix timestamps
function getUnixTimestamps(range: Range): { from: number; to: number } {
  const now = new Date();
  const to = Math.floor(now.getTime() / 1000);

  let from: number;

  switch (range) {
    case Range["1d"]:
      from = Math.floor((now.getTime() - 24 * 60 * 60 * 1000) / 1000);
      break;
    case Range["7d"]:
      from = Math.floor((now.getTime() - 7 * 24 * 60 * 60 * 1000) / 1000);
      break;
    case Range["30d"]:
      from = Math.floor((now.getTime() - 30 * 24 * 60 * 60 * 1000) / 1000);
      break;
    case Range["90d"]:
      from = Math.floor((now.getTime() - 90 * 24 * 60 * 60 * 1000) / 1000);
      break;
    default:
      from = Math.floor((now.getTime() - 7 * 24 * 60 * 60 * 1000) / 1000);
  }

  return { from, to };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coinId = searchParams.get("coinId") || "saros-finance";
    const range = (searchParams.get("range") as Range) || Range["7d"];

    // Get Unix timestamps for the range
    const { from, to } = getUnixTimestamps(range);

    // Build URL with Unix timestamps
    const url = `${COINGECKO_API_URL}/coins/${coinId}/market_chart/range?vs_currency=usd&from=${from}&to=${to}`;

    const options = {
      method: "GET",
      headers: { "x-cg-demo-api-key": `${COINGECKO_API_KEY}` },
    };

    console.log(`🔄 Fetching data for ${coinId} for ${range}...`);
    console.log(`🌐 URL: ${url}`);

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(
      "✅ Success! Data received:",
      data.prices?.length || 0,
      "price points"
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch price data" },
      { status: 500 }
    );
  }
}
