import {
  DLMMSnapshot,
  SwapEvent,
  LiquidityDistribution,
} from "@/types/dlmmData";

// Mock snapshot data based on your provided data
export const mockSnapshots: DLMMSnapshot[] = [
  {
    id: 52,
    timestamp: 1758193207098,
    created_at: "2025-09-18 11:00:07.867418+00",
    pool_address: "ADPKeitAZsAeRJfhG2GoDrZENB3xt9eZmggkj7iAXY78",
    pool_name: "SAROS/USDC Pool",
    active_bin_id: 8388518,
    reserve_x: 11927633643705,
    reserve_y: 89450749357,
    bin_step: 100,
    base_factor: 8000,
    protocol_fee: 2000,
    current_price: 0.4083911852,
    market_price: 0.408227,
    price_deviation: 0.000402,
    market_volume_24h: 0.0,
    market_change_24h: 0.0,
    bin_data: [
      {
        price: 0.36971121232911897,
        bin_id: 8388508,
        liquidity_x: "0",
        liquidity_y: "1177100982",
        total_supply: "38177609142193",
      },
      {
        price: 0.3734083244524101,
        bin_id: 8388509,
        liquidity_x: "0",
        liquidity_y: "1144388017",
        total_supply: "38372403149302",
      },
      {
        price: 0.37714240769693425,
        bin_id: 8388510,
        liquidity_x: "0",
        liquidity_y: "1194054460",
        total_supply: "38565087222257",
      },
      {
        price: 0.3809138317739036,
        bin_id: 8388511,
        liquidity_x: "0",
        liquidity_y: "1242928696",
        total_supply: "38755674129972",
      },
      {
        price: 0.3847229700916426,
        bin_id: 8388512,
        liquidity_x: "0",
        liquidity_y: "1298562678",
        total_supply: "38949559906569",
      },
      {
        price: 0.388570199792559,
        bin_id: 8388513,
        liquidity_x: "0",
        liquidity_y: "1225245689",
        total_supply: "39151639250282",
      },
      {
        price: 0.3924559017904846,
        bin_id: 8388514,
        liquidity_x: "0",
        liquidity_y: "1126286367",
        total_supply: "39357625961273",
      },
      {
        price: 0.3963804608083895,
        bin_id: 8388515,
        liquidity_x: "0",
        liquidity_y: "1057959301",
        total_supply: "39567733135454",
      },
      {
        price: 0.4003442654164734,
        bin_id: 8388516,
        liquidity_x: "0",
        liquidity_y: "1046612776",
        total_supply: "39772085074435",
      },
      {
        price: 0.40434770807063813,
        bin_id: 8388517,
        liquidity_x: "0",
        liquidity_y: "26100000384",
        total_supply: "991567603810070",
      },
      {
        price: 0.40839118515134454,
        bin_id: 8388518,
        liquidity_x: "75596709808",
        liquidity_y: "98017",
        total_supply: "1198648976500494",
      },
      {
        price: 0.41247509700285795,
        bin_id: 8388519,
        liquidity_x: "74702628897",
        liquidity_y: "0",
        total_supply: "1216079724008160",
      },
      {
        price: 0.4165998479728865,
        bin_id: 8388520,
        liquidity_x: "76237264867",
        liquidity_y: "0",
        total_supply: "1250242808658409",
      },
      {
        price: 0.4207658464526154,
        bin_id: 8388521,
        liquidity_x: "77082069259",
        liquidity_y: "0",
        total_supply: "1278829367230099",
      },
      {
        price: 0.4249735049171416,
        bin_id: 8388522,
        liquidity_x: "78436705766",
        liquidity_y: "0",
        total_supply: "1302565542509817",
      },
      {
        price: 0.429223239966313,
        bin_id: 8388523,
        liquidity_x: "78189550165",
        liquidity_y: "0",
        total_supply: "1325691329571165",
      },
      {
        price: 0.4335154723659761,
        bin_id: 8388524,
        liquidity_x: "79373242963",
        liquidity_y: "0",
        total_supply: "1354990979272178",
      },
      {
        price: 0.4378506270896359,
        bin_id: 8388525,
        liquidity_x: "80402211496",
        liquidity_y: "0",
        total_supply: "1379402346727361",
      },
      {
        price: 0.44222913336053227,
        bin_id: 8388526,
        liquidity_x: "81379180030",
        liquidity_y: "0",
        total_supply: "1403126938404650",
      },
      {
        price: 0.4466514246941376,
        bin_id: 8388527,
        liquidity_x: "82710148563",
        liquidity_y: "0",
        total_supply: "4829876315194287",
      },
      {
        price: 0.451117938941079,
        bin_id: 8388528,
        liquidity_x: "83739157326",
        liquidity_y: "0",
        total_supply: "4914354502347821",
      },
    ],
    reserve_x_decimal: 6,
    reserve_y_decimal: 6,
  },
  {
    id: 53,
    timestamp: 1758196805161,
    created_at: "2025-09-18 12:00:05.943245+00",
    pool_address: "ADPKeitAZsAeRJfhG2GoDrZENB3xt9eZmggkj7iAXY78",
    pool_name: "SAROS/USDC Pool",
    active_bin_id: 8388518,
    reserve_x: 11927633643705,
    reserve_y: 89450749357,
    bin_step: 100,
    base_factor: 8000,
    protocol_fee: 2000,
    current_price: 0.4083911852,
    market_price: 0.407377,
    price_deviation: 0.00249,
    market_volume_24h: 0.0,
    market_change_24h: 0.0,
    bin_data: [
      {
        price: 0.36971121232911897,
        bin_id: 8388508,
        liquidity_x: "0",
        liquidity_y: "1177100982",
        total_supply: "38177609142193",
      },
      {
        price: 0.3734083244524101,
        bin_id: 8388509,
        liquidity_x: "0",
        liquidity_y: "1144388017",
        total_supply: "38372403149302",
      },
      {
        price: 0.37714240769693425,
        bin_id: 8388510,
        liquidity_x: "0",
        liquidity_y: "1194054460",
        total_supply: "38565087222257",
      },
      {
        price: 0.3809138317739036,
        bin_id: 8388511,
        liquidity_x: "0",
        liquidity_y: "1242928696",
        total_supply: "38755674129972",
      },
      {
        price: 0.3847229700916426,
        bin_id: 8388512,
        liquidity_x: "0",
        liquidity_y: "1298562678",
        total_supply: "38949559906569",
      },
      {
        price: 0.388570199792559,
        bin_id: 8388513,
        liquidity_x: "0",
        liquidity_y: "1225245689",
        total_supply: "39151639250282",
      },
      {
        price: 0.3924559017904846,
        bin_id: 8388514,
        liquidity_x: "0",
        liquidity_y: "1126286367",
        total_supply: "39357625961273",
      },
      {
        price: 0.3963804608083895,
        bin_id: 8388515,
        liquidity_x: "0",
        liquidity_y: "1057959301",
        total_supply: "39567733135454",
      },
      {
        price: 0.4003442654164734,
        bin_id: 8388516,
        liquidity_x: "0",
        liquidity_y: "1046612776",
        total_supply: "39772085074435",
      },
      {
        price: 0.40434770807063813,
        bin_id: 8388517,
        liquidity_x: "0",
        liquidity_y: "26100000384",
        total_supply: "991567603810070",
      },
      {
        price: 0.40839118515134454,
        bin_id: 8388518,
        liquidity_x: "75596709808",
        liquidity_y: "98017",
        total_supply: "1198648976500494",
      },
      {
        price: 0.41247509700285795,
        bin_id: 8388519,
        liquidity_x: "74702628897",
        liquidity_y: "0",
        total_supply: "1216079724008160",
      },
      {
        price: 0.4165998479728865,
        bin_id: 8388520,
        liquidity_x: "76237264867",
        liquidity_y: "0",
        total_supply: "1250242808658409",
      },
      {
        price: 0.4207658464526154,
        bin_id: 8388521,
        liquidity_x: "77082069259",
        liquidity_y: "0",
        total_supply: "1278829367230099",
      },
      {
        price: 0.4249735049171416,
        bin_id: 8388522,
        liquidity_x: "78436705766",
        liquidity_y: "0",
        total_supply: "1302565542509817",
      },
      {
        price: 0.429223239966313,
        bin_id: 8388523,
        liquidity_x: "78189550165",
        liquidity_y: "0",
        total_supply: "1325691329571165",
      },
      {
        price: 0.4335154723659761,
        bin_id: 8388524,
        liquidity_x: "79373242963",
        liquidity_y: "0",
        total_supply: "1354990979272178",
      },
      {
        price: 0.4378506270896359,
        bin_id: 8388525,
        liquidity_x: "80402211496",
        liquidity_y: "0",
        total_supply: "1379402346727361",
      },
      {
        price: 0.44222913336053227,
        bin_id: 8388526,
        liquidity_x: "81379180030",
        liquidity_y: "0",
        total_supply: "1403126938404650",
      },
      {
        price: 0.4466514246941376,
        bin_id: 8388527,
        liquidity_x: "82710148563",
        liquidity_y: "0",
        total_supply: "4829876315194287",
      },
      {
        price: 0.451117938941079,
        bin_id: 8388528,
        liquidity_x: "83739157326",
        liquidity_y: "0",
        total_supply: "4914354502347821",
      },
    ],
    reserve_x_decimal: 6,
    reserve_y_decimal: 6,
  },
  {
    id: 54,
    timestamp: 1758200406557,
    created_at: "2025-09-18 13:00:07.22456+00",
    pool_address: "ADPKeitAZsAeRJfhG2GoDrZENB3xt9eZmggkj7iAXY78",
    pool_name: "SAROS/USDC Pool",
    active_bin_id: 8388518,
    reserve_x: 11852367897587,
    reserve_y: 120587259511,
    bin_step: 100,
    base_factor: 8000,
    protocol_fee: 2000,
    current_price: 0.4083911852,
    market_price: 0.408078,
    price_deviation: 0.000767,
    market_volume_24h: 0.0,
    market_change_24h: 0.0,
    bin_data: [
      {
        price: 0.36971121232911897,
        bin_id: 8388508,
        liquidity_x: "0",
        liquidity_y: "1177100982",
        total_supply: "38177609142193",
      },
      {
        price: 0.3734083244524101,
        bin_id: 8388509,
        liquidity_x: "0",
        liquidity_y: "1144388017",
        total_supply: "38372403149302",
      },
      {
        price: 0.37714240769693425,
        bin_id: 8388510,
        liquidity_x: "0",
        liquidity_y: "1194054460",
        total_supply: "38565087222257",
      },
      {
        price: 0.3809138317739036,
        bin_id: 8388511,
        liquidity_x: "0",
        liquidity_y: "1242928696",
        total_supply: "38755674129972",
      },
      {
        price: 0.3847229700916426,
        bin_id: 8388512,
        liquidity_x: "0",
        liquidity_y: "1298562678",
        total_supply: "38949559906569",
      },
      {
        price: 0.388570199792559,
        bin_id: 8388513,
        liquidity_x: "0",
        liquidity_y: "1225245689",
        total_supply: "39151639250282",
      },
      {
        price: 0.3924559017904846,
        bin_id: 8388514,
        liquidity_x: "0",
        liquidity_y: "1126286367",
        total_supply: "39357625961273",
      },
      {
        price: 0.3963804608083895,
        bin_id: 8388515,
        liquidity_x: "0",
        liquidity_y: "1057959301",
        total_supply: "39567733135454",
      },
      {
        price: 0.4003442654164734,
        bin_id: 8388516,
        liquidity_x: "0",
        liquidity_y: "1046612776",
        total_supply: "39772085074435",
      },
      {
        price: 0.40434770807063813,
        bin_id: 8388517,
        liquidity_x: "0",
        liquidity_y: "26100000384",
        total_supply: "991567603810070",
      },
      {
        price: 0.40839118515134454,
        bin_id: 8388518,
        liquidity_x: "1350076",
        liquidity_y: "31071760968",
        total_supply: "1198648976500494",
      },
      {
        price: 0.41247509700285795,
        bin_id: 8388519,
        liquidity_x: "74995511573",
        liquidity_y: "0",
        total_supply: "1216079724008160",
      },
      {
        price: 0.4165998479728865,
        bin_id: 8388520,
        liquidity_x: "76237264867",
        liquidity_y: "0",
        total_supply: "1250242808658409",
      },
      {
        price: 0.4207658464526154,
        bin_id: 8388521,
        liquidity_x: "77082069259",
        liquidity_y: "0",
        total_supply: "1278829367230099",
      },
      {
        price: 0.4249735049171416,
        bin_id: 8388522,
        liquidity_x: "78436705766",
        liquidity_y: "0",
        total_supply: "1302565542509817",
      },
      {
        price: 0.429223239966313,
        bin_id: 8388523,
        liquidity_x: "78189550165",
        liquidity_y: "0",
        total_supply: "1325691329571165",
      },
      {
        price: 0.4335154723659761,
        bin_id: 8388524,
        liquidity_x: "79373242963",
        liquidity_y: "0",
        total_supply: "1354990979272178",
      },
      {
        price: 0.4378506270896359,
        bin_id: 8388525,
        liquidity_x: "80402211496",
        liquidity_y: "0",
        total_supply: "1379402346727361",
      },
      {
        price: 0.44222913336053227,
        bin_id: 8388526,
        liquidity_x: "81379180030",
        liquidity_y: "0",
        total_supply: "1403126938404650",
      },
      {
        price: 0.4466514246941376,
        bin_id: 8388527,
        liquidity_x: "82710148563",
        liquidity_y: "0",
        total_supply: "4829876315194287",
      },
      {
        price: 0.451117938941079,
        bin_id: 8388528,
        liquidity_x: "83739157326",
        liquidity_y: "0",
        total_supply: "4914354502347821",
      },
    ],
    reserve_x_decimal: 6,
    reserve_y_decimal: 6,
  },
];

// Mock swap events between snapshots
export const mockSwaps: SwapEvent[] = [
  {
    id: "swap_1",
    timestamp: 1758193207098 + 600000, // 10 minutes after first snapshot
    pool_address: "ADPKeitAZsAeRJfhG2GoDrZENB3xt9eZmggkj7iAXY78",
    swap_type: "swapXForY",
    amount_in: 1000000, // 1 USDC
    amount_out: 2448000, // SAROS tokens
    price_impact: 0.0001,
    fee: 2000, // 0.2% fee
    bin_id: 8388518,
    user_address: "0x1234...",
  },
  {
    id: "swap_2",
    timestamp: 1758193207098 + 1200000, // 20 minutes after first snapshot
    pool_address: "ADPKeitAZsAeRJfhG2GoDrZENB3xt9eZmggkj7iAXY78",
    swap_type: "swapYForX",
    amount_in: 5000000, // 5 SAROS tokens
    amount_out: 2040000, // USDC
    price_impact: 0.0002,
    fee: 10000,
    bin_id: 8388518,
    user_address: "0x5678...",
  },
  {
    id: "swap_3",
    timestamp: 1758193207098 + 1800000, // 30 minutes after first snapshot
    pool_address: "ADPKeitAZsAeRJfhG2GoDrZENB3xt9eZmggkj7iAXY78",
    swap_type: "swapXForY",
    amount_in: 2500000, // 2.5 USDC
    amount_out: 6120000, // SAROS tokens
    price_impact: 0.0003,
    fee: 5000,
    bin_id: 8388518,
    user_address: "0x9abc...",
  },
];

// Helper function to convert snapshot to liquidity distribution
export function snapshotToLiquidityDistribution(
  snapshot: DLMMSnapshot
): LiquidityDistribution[] {
  return snapshot.bin_data.map((bin) => {
    // Convert from raw token amounts to readable amounts
    const liquidity_x =
      parseFloat(bin.liquidity_x) / Math.pow(10, snapshot.reserve_x_decimal);
    const liquidity_y =
      parseFloat(bin.liquidity_y) / Math.pow(10, snapshot.reserve_y_decimal);

    // Use actual token amounts (already converted from raw values)
    const total_liquidity = liquidity_x + liquidity_y;

    return {
      bin_id: bin.bin_id,
      price: bin.price,
      liquidity_x: liquidity_x,
      liquidity_y: liquidity_y,
      total_liquidity: total_liquidity,
      is_active: bin.bin_id === snapshot.active_bin_id,
    };
  });
}

// Get mock data
export function getMockSnapshots(): DLMMSnapshot[] {
  return mockSnapshots;
}

export function getMockSwaps(): SwapEvent[] {
  return mockSwaps;
}
