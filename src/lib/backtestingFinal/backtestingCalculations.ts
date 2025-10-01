import { PoolSnapshot } from "@/types/snapshots";
import { Strategy } from "@/types/strategy";

export interface AllocationParams {
  LiquidityToAllocate: number; // Total liquidity to allocate
  snapshot: PoolSnapshot; // Pool snapshot containing binStep, activeBinId, currentPrice, etc.
  binRange: number; // Percentage range (e.g., 2 for 2%)
  concentration?: "low" | "medium" | "high"; // For curve and bid-ask strategies
}

export interface LiquidityAllocation {
  binId: number;
  liquidityX: number; // SAROS amount
  liquidityY: number; // USDC amount
  totalLiquidity: number;
  weight: number; // Allocation weight (0-1)
}

export const allocateSpotLiquidity = (
  liquidityAllocationParams: AllocationParams
) => {
  const { LiquidityToAllocate, snapshot, binRange } = liquidityAllocationParams;

  const binIds = getBinIds(snapshot.active_bin_id, binRange, snapshot.bin_step);

  const liquidityAllocation = getTokenAllocation(
    binIds,
    snapshot.active_bin_id,
    LiquidityToAllocate,
    snapshot.current_price,
    "spot"
  );

  return liquidityAllocation;
};

export const allocateCurveLiquidity = (
  liquidityAllocationParams: AllocationParams
) => {
  const { LiquidityToAllocate, snapshot, binRange } = liquidityAllocationParams;

  const binIds = getBinIds(snapshot.active_bin_id, binRange, snapshot.bin_step);

  const liquidityAllocation = getTokenAllocation(
    binIds,
    snapshot.active_bin_id,
    LiquidityToAllocate,
    snapshot.current_price,
    "curve"
  );

  return liquidityAllocation;
};

export const allocateBidAskLiquidity = (
  liquidityAllocationParams: AllocationParams
) => {
  const { LiquidityToAllocate, snapshot, binRange } = liquidityAllocationParams;

  const binIds = getBinIds(snapshot.active_bin_id, binRange, snapshot.bin_step);

  const liquidityAllocation = getTokenAllocation(
    binIds,
    snapshot.active_bin_id,
    LiquidityToAllocate,
    snapshot.current_price,
    "bid-ask"
  );

  return liquidityAllocation;
};

export const calculateStrategyPerformance = async (
  strategy: Strategy,
  snapshots: PoolSnapshot[],
  totalLiquidity: number,
  ohlcvData: any
) => {
  //Note - timeActive will be the same for all strategies since bin step is the same for the strategies in the config
  const strategyPerformance = {
    timeInRange: calculateTimeInRange(strategy, snapshots),
    liquidityEfficiency: await calculateLiquidityEfficiency(
      strategy,
      snapshots,
      totalLiquidity
    ),
    binWiseFees: await calculateBinWiseFees(strategy, snapshots, ohlcvData),
    strategyWiseFees: await strategyWiseFees(strategy, snapshots, ohlcvData),
  };

  console.log("Strategy Performance:", strategyPerformance);

  return strategyPerformance;
};

/** Time in Range Calculations Functions */

const calculateTimeInRange = (
  strategy: Strategy,
  snapshots: PoolSnapshot[]
) => {
  const strategyIsActive = checkWhenStrategyIsActive(strategy, snapshots);
  const spotInRange = strategyIsActive.spot / snapshots.length;
  const curveInRange = strategyIsActive.curve / snapshots.length;
  const bidAskInRange = strategyIsActive.bidAsk / snapshots.length;

  return {
    spotInRange,
    curveInRange,
    bidAskInRange,
  };
};

const checkWhenStrategyIsActive = (
  strategy: Strategy,
  snapshots: PoolSnapshot[]
) => {
  const strategyIsActive = { spot: 0, curve: 0, bidAsk: 0 };

  snapshots.forEach((snapshot) => {
    strategy.spot.forEach((s) => {
      if (s.binId === snapshot.active_bin_id) {
        strategyIsActive.spot += 1;
      }
    });

    strategy.curve.forEach((s) => {
      if (s.binId === snapshot.active_bin_id) {
        strategyIsActive.curve += 1;
      }
    });

    strategy.bidAsk.forEach((s) => {
      if (s.binId === snapshot.active_bin_id) {
        strategyIsActive.bidAsk += 1;
      }
    });
  });

  return strategyIsActive;
};

/** Liquidity Efficiency Calculations Functions */

const calculateLiquidityEfficiency = async (
  strategy: Strategy,
  snapshots: PoolSnapshot[],
  totalLiquidityDeployed: number
) => {
  const efficiency = {
    spot: 0,
    curve: 0,
    bidAsk: 0,
  };

  // Tracking efficiency per snapshot
  let counters = { spot: 0, curve: 0, bidAsk: 0 };

  snapshots.forEach((snapshot) => {
    const activeBinId = snapshot.active_bin_id;

    // Spot
    const spotLiquidity =
      strategy.spot.find((s) => s.binId === activeBinId)?.totalLiquidity || 0;
    efficiency.spot += spotLiquidity / totalLiquidityDeployed;
    counters.spot++;

    // Curve
    const curveLiquidity =
      strategy.curve.find((s) => s.binId === activeBinId)?.totalLiquidity || 0;
    efficiency.curve += curveLiquidity / totalLiquidityDeployed;
    counters.curve++;

    // BidAsk
    const bidAskLiquidity =
      strategy.bidAsk.find((s) => s.binId === activeBinId)?.totalLiquidity || 0;
    efficiency.bidAsk += bidAskLiquidity / totalLiquidityDeployed;
    counters.bidAsk++;
  });

  return {
    spot: efficiency.spot / counters.spot,
    curve: efficiency.curve / counters.curve,
    bidAsk: efficiency.bidAsk / counters.bidAsk,
  };
};

const getActiveBinsInAllSnapshots = (snapshots: PoolSnapshot[]) => {
  const activeBins: number[] = [];
  snapshots.forEach((snapshot) => {
    activeBins.push(snapshot.active_bin_id);
  });

  return activeBins;
};

/** Approximate Fee Earnings */

const calculateStrategyFees = (
  strategy: Strategy,
  snapshots: PoolSnapshot[],
  ohlcvData: any
) => {
  // we ll calculate daily fees earned first
  // distribute it proportionately to the bins active during that day
  // then we ll calculate the fee earnings for the strategy
  // then we ll return the fee earnings for the strategy

  const protocolFee = snapshots[0].protocol_fee; // in bsis points

  const dailyFees = calculateBinWiseFees(strategy, snapshots, ohlcvData);
};

const strategyWiseFees = async (
  strategy: Strategy,
  snapshots: PoolSnapshot[],
  ohlcvData: any
) => {
  const dailyVolumeData: any = await getDailyVolumeOfPoolTrade(
    strategy,
    snapshots,
    ohlcvData
  );

  const strategyWiseFees: Record<string, number> = {
    spot: 0,
    curve: 0,
    bidAsk: 0,
  };

  // Loop through each day's active bins
  dailyVolumeData.forEach((day: any) => {
    day.activeBins.forEach((activeBin: any) => {
      // Check each strategy type for matching bins
      Object.entries(strategy).forEach(([strategyType, allocations]) => {
        const matchingAllocation = allocations.find(
          (allocation: any) => allocation.binId === activeBin.binId
        );

        if (matchingAllocation) {
          // Calculate strategy's share of liquidity in this bin
          const strategyLiquidityShare =
            matchingAllocation.totalLiquidity / activeBin.averageLiquidityUSD;

          // Calculate strategy's share of fees from this bin
          const strategyFeesFromBin =
            activeBin.feesUSD * strategyLiquidityShare;

          // Add to strategy fees
          strategyWiseFees[strategyType] += strategyFeesFromBin;
        }
      });
    });
  });

  return strategyWiseFees;
};

const totalBinLiquidityUSD = (binId: number, snapshot: PoolSnapshot) => {
  const bin = snapshot.bin_data.find((b) => b.bin_id === binId);
  if (!bin) return 0;

  const liquidityX = parseFloat(bin.liquidity_x); // base token
  const liquidityY = parseFloat(bin.liquidity_y); // USDC

  const priceBaseTokenUSD = snapshot.market_price; // base token → USD

  const xInUSD = liquidityX * priceBaseTokenUSD;
  const yInUSD = liquidityY; // already in USD

  return xInUSD + yInUSD;
};

const calculateBinWiseFees = async (
  strategy: Strategy,
  snapshots: PoolSnapshot[],
  ohlcvData: any
) => {
  const protocolFee = snapshots[0].protocol_fee; // in bsis points
  const binWiseFees: Record<string, number> = {};

  const dailyVolumeData = await getDailyVolumeOfPoolTrade(
    strategy,
    snapshots,
    ohlcvData
  );

  console.log("Daily Volume Data:", dailyVolumeData);

  dailyVolumeData.forEach((day) => {
    const dayFees = (day.totalVolumeUSD * protocolFee) / 10000;
    day.activeBins.forEach((bin) => {
      binWiseFees[bin.binId] =
        (binWiseFees[bin.binId] || 0) + bin.proportion * dayFees;
    });
  });

  return binWiseFees;
};

export const getDailyVolumeOfPoolTrade = async (
  strategy: Strategy,
  snapshots: PoolSnapshot[],
  ohlcvData: any
) => {
  // we ll use geckoterminal to fetch daily trade volume of the pool (ohclv) - every day at utc 00:00:00
  // then we ll calculate the trade in $ using o and c prices * volume (since volume is in base token)
  // then we ll check which bins were active using snapshot data during the day
  // then we ll proportionately distribute the daily volume to the bins active during that day
  // Fetch OHLCV data from GeckoTerminal API
  // Usage example:
  // const ohlcvData = await fetchOHLCVData(snapshot.pool_address);

  type VolumePerDay = {
    date: string; // e.g., "2025-09-29"
    totalVolumeUSD: number; // pool's daily volume in $
    activeBins: {
      binId: number;
      volumeUSD: number; // volume for this bin on this day
      proportion: number; // fraction of total daily volume
      averageLiquidityUSD: number; // Average liquidity for this bin on this day
      feesUSD: number; // fees earned by this bin on this day
    }[];
  };

  const dayWiseSnapshots = groupSnapshotsByDay(snapshots);
  const protocolFee = snapshots[0].protocol_fee; // in basis points

  const volumePerDay: VolumePerDay[] = [];

  for (const [day, daySnapshots] of Object.entries(dayWiseSnapshots)) {
    const binCounts = countActiveBinsByDay(daySnapshots);
    const binProportions = calculateBinProportions(binCounts);

    // Get unique active bin IDs for this day
    const activeBinIds = new Set(binProportions.map((bin) => bin.binId));

    // Calculate average liquidity only for active bins
    const binLiquidityTotals: Record<number, number[]> = {};
    daySnapshots.forEach((snapshot) => {
      snapshot.bin_data.forEach((bin) => {
        if (activeBinIds.has(bin.bin_id)) {
          if (!binLiquidityTotals[bin.bin_id]) {
            binLiquidityTotals[bin.bin_id] = [];
          }
          //bin data has raw amounts, so we need to divide by decimals to get the actual amount
          const liquidityUSD =
            (parseFloat(bin.liquidity_x) /
              Math.pow(10, snapshot.reserve_x_decimal)) *
              bin.price +
            parseFloat(bin.liquidity_y) /
              Math.pow(10, snapshot.reserve_y_decimal);
          binLiquidityTotals[bin.bin_id].push(liquidityUSD);
        }
      });
    });

    const ohlcv = ohlcvData.find((o: any) => getUTCDateString(o[0]) === day);

    if (ohlcv && ohlcv.length >= 6) {
      // OHLCV array structure: [timestamp, open, high, low, close, volume]
      const [timestamp, open, high, low, close, volume] = ohlcv;
      const dailyVolumeUSD = ((open + close) / 2) * volume; // Convert base token volume to USD

      // Add average liquidity, calculate proportionate volume and fees for each active bin
      const activeBinsWithLiquidity = binProportions.map((bin) => {
        const binVolumeUSD = bin.proportion * dailyVolumeUSD;

        // Fee calculation: Base fee is 1%, but liquidity providers get 80% of it
        const baseFeeRate = 0.01; // 1% base fee
        const liquidityProviderShare = 1 - protocolFee / 10000; // 80% of base fee goes to LPs
        const binFeesUSD = binVolumeUSD * baseFeeRate * liquidityProviderShare; // LP's share of fees

        return {
          ...bin,
          volumeUSD: binVolumeUSD, // Calculate proportionate volume for this bin
          feesUSD: binFeesUSD, // Calculate fees earned by this bin (LP's share)
          averageLiquidityUSD: binLiquidityTotals[bin.binId]
            ? binLiquidityTotals[bin.binId].reduce((a, b) => a + b, 0) /
              binLiquidityTotals[bin.binId].length
            : 0,
        };
      });

      volumePerDay.push({
        date: day,
        totalVolumeUSD: dailyVolumeUSD,
        activeBins: activeBinsWithLiquidity,
      });
    }
  }

  return volumePerDay;
};

// 1️⃣ Convert timestamp to YYYY-MM-DD UTC
export const getUTCDateString = (timestamp: number) => {
  // Validate timestamp
  if (!timestamp || isNaN(timestamp)) {
    console.error("Invalid timestamp:", timestamp);
    return "1970-01-01"; // fallback date
  }

  // Convert to milliseconds if timestamp is in seconds (less than year 2000)
  const timestampMs = timestamp < 946684800000 ? timestamp * 1000 : timestamp;

  const date = new Date(timestampMs);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.error(
      "Invalid date created from timestamp:",
      timestamp,
      "->",
      timestampMs
    );
    return "1970-01-01"; // fallback date
  }

  return date.toISOString().split("T")[0]; // "YYYY-MM-DD"
};

// 2️⃣ Group snapshots by day
export const groupSnapshotsByDay = (snapshots: PoolSnapshot[]) => {
  const grouped: Record<string, PoolSnapshot[]> = {};

  snapshots.forEach((snap) => {
    const day = getUTCDateString(snap.timestamp);
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(snap);
  });

  return grouped;
};

// 3️⃣ Count active bins per day
export const countActiveBinsByDay = (daySnapshots: PoolSnapshot[]) => {
  const counts: Record<number, number> = {};
  daySnapshots.forEach((snap) => {
    counts[snap.active_bin_id] = (counts[snap.active_bin_id] || 0) + 1;
  });
  return counts;
};

// 4️⃣ Calculate proportion per bin
export const calculateBinProportions = (binCounts: Record<number, number>) => {
  const total = Object.values(binCounts).reduce((a, b) => a + b, 0);
  const proportions: { binId: number; proportion: number }[] = [];
  for (const binIdStr in binCounts) {
    const binId = Number(binIdStr);
    proportions.push({ binId, proportion: binCounts[binId] / total });
  }
  return proportions;
};

// 5️⃣ Map bins to strategies
export const mapVolumeToStrategies = (
  strategy: Strategy,
  binProportions: { binId: number; proportion: number }[],
  dailyVolumeUSD: number
) => {
  const result = {
    spot: 0,
    curve: 0,
    bidAsk: 0,
    perBin: {} as Record<number, number>,
  };

  binProportions.forEach(({ binId, proportion }) => {
    const volume = proportion * dailyVolumeUSD;
    result.perBin[binId] = volume;

    if (strategy.spot.some((s) => s.binId === binId)) result.spot += volume;
    else if (strategy.curve.some((s) => s.binId === binId))
      result.curve += volume;
    else if (strategy.bidAsk.some((s) => s.binId === binId))
      result.bidAsk += volume;
  });

  return result;
};

const getBinIds = (activeBinId: number, binRange: number, binStep: number) => {
  const binsPerSide = Math.floor((binRange * 100) / binStep); // Convert range % to basis points for fair calulcation of bin numbers
  const totalBins = binsPerSide * 2 + 1; // since range is symmetric, we need to multiply by 2 and add 1 for the active bin in the middle
  const binIds = [];
  for (let i = -binsPerSide; i <= binsPerSide; i++) {
    binIds.push(activeBinId + i);
  }

  return binIds;
};

function calculateGaussianWeights(
  numBins: number,
  concentration?: "low" | "medium" | "high"
): number[] {
  const weights: number[] = [];
  const center = (numBins - 1) / 2;

  // Gaussian distribution parameters - not using right now
  //   const sigmaMap = {
  //     low: numBins / 4, // More spread
  //     medium: numBins / 6, // Balanced
  //     high: numBins / 8, // More concentrated
  //   };

  const sigma = numBins / 6; // using medium concentration as default

  for (let i = 0; i < numBins; i++) {
    // Gaussian formula: e^(-0.5 * ((x - μ) / σ)²)
    const x = (i - center) / sigma;
    weights[i] = Math.exp(-0.5 * x * x);
  }

  // Normalize to sum to 1
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => w / sum);
}

function calculateBidAskWeights(
  numBins: number,
  concentration?: "low" | "medium" | "high"
): number[] {
  const weights: number[] = [];
  const center = (numBins - 1) / 2;

  // Concentration parameters (higher = more concentrated at edges)
  // const concentrationMap = {
  //   low: 0.5, // More spread toward center
  //   medium: 1.0, // Balanced U-shape
  //   high: 2.0, // Very concentrated at edges
  // };

  const sigma = 1.0; // using medium concentration as default

  for (let i = 0; i < numBins; i++) {
    // Distance from center
    const distance = Math.abs(i - center);

    // Create inverted bell curve: higher weight for bins further from center
    // But ensure center bin (active bin) gets some minimal allocation
    let weight;
    if (distance === 0) {
      // Active bin gets minimal allocation (0.1% of max edge allocation)
      const maxEdgeWeight = Math.exp((numBins - 1) / 2 / sigma);
      weight = maxEdgeWeight * 0.001; // 0.1% of maximum edge weight
    } else {
      // Higher weight for bins further from center
      weight = Math.exp(distance / sigma);
    }

    weights.push(weight);
  }

  // Normalize to sum to 1
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => w / sum);
}

const getTokenAllocation = (
  binIds: number[],
  activeBinId: number,
  LiquidityToAllocate: number,
  currentPrice: number,
  strategy: string
) => {
  const liquidityAllocation: LiquidityAllocation[] = [];
  const totalBins = binIds.length;

  if (strategy === "spot") {
    const liquidityPerBin = LiquidityToAllocate / totalBins;
    for (const binId of binIds) {
      if (binId === activeBinId) {
        // active bin has equal liquidity in both tokens
        const liquidityXInUSD = liquidityPerBin / 2;
        const liquidityYInUSD = liquidityPerBin / 2; // no need to convert to USD since it's already in USDC
        // convert to SAROS using current price of snapshot 0 during selected time period
        const liquidityXInSAROS = liquidityXInUSD / currentPrice;

        liquidityAllocation.push({
          binId,
          liquidityX: liquidityXInSAROS,
          liquidityY: liquidityYInUSD,
          totalLiquidity: liquidityPerBin,
          weight: 1 / totalBins,
        });
      } else if (binId < activeBinId) {
        // right side has only USDC
        const liquidityYInUSD = liquidityPerBin;
        liquidityAllocation.push({
          binId,
          liquidityX: 0,
          liquidityY: liquidityYInUSD,
          totalLiquidity: liquidityPerBin,
          weight: 1 / totalBins,
        });
      } else {
        // left side has only SAROS
        const liquidityXInUSD = liquidityPerBin;
        const liquidityXInSAROS = liquidityXInUSD / currentPrice;
        liquidityAllocation.push({
          binId,
          liquidityX: liquidityXInSAROS,
          liquidityY: 0,
          totalLiquidity: liquidityPerBin,
          weight: 1 / totalBins,
        });
      }
    }
  } else if (strategy === "curve") {
    const weights = calculateGaussianWeights(totalBins);
    for (const binId of binIds) {
      const index = binIds.indexOf(binId);
      if (binId === activeBinId) {
        // active bin has equal liquidity in both tokens
        const binLiquidity = LiquidityToAllocate * weights[index];
        const liquidityXInUSD = binLiquidity / 2;
        const liquidityYInUSD = binLiquidity / 2; // no need to convert to USD since it's already in USDC
        const liquidityXInSAROS = liquidityXInUSD / currentPrice;

        liquidityAllocation.push({
          binId,
          liquidityX: liquidityXInSAROS,
          liquidityY: liquidityYInUSD,
          totalLiquidity: binLiquidity,
          weight: weights[index],
        });
      } else if (binId < activeBinId) {
        // right side has only USDC
        const binLiquidity = LiquidityToAllocate * weights[index];
        const liquidityYInUSD = binLiquidity;
        liquidityAllocation.push({
          binId,
          liquidityX: 0,
          liquidityY: liquidityYInUSD,
          totalLiquidity: binLiquidity,
          weight: weights[index],
        });
      } else {
        // left side has only SAROS
        const binLiquidity = LiquidityToAllocate * weights[index];
        const liquidityXInUSD = binLiquidity;
        const liquidityXInSAROS = liquidityXInUSD / currentPrice;
        liquidityAllocation.push({
          binId,
          liquidityX: liquidityXInSAROS,
          liquidityY: 0,
          totalLiquidity: binLiquidity,
          weight: weights[index],
        });
      }
    }
    // TODO: Implement curve strategy
  } else if (strategy === "bid-ask") {
    const weights = calculateBidAskWeights(totalBins);
    for (const binId of binIds) {
      const index = binIds.indexOf(binId);
      if (binId === activeBinId) {
        // active bin has equal liquidity in both tokens
        const binLiquidity = LiquidityToAllocate * weights[index];
        const liquidityXInUSD = binLiquidity / 2;
        const liquidityYInUSD = binLiquidity / 2; // no need to convert to USD since it's already in USDC
        const liquidityXInSAROS = liquidityXInUSD / currentPrice;
        liquidityAllocation.push({
          binId,
          liquidityX: liquidityXInSAROS,
          liquidityY: liquidityYInUSD,
          totalLiquidity: binLiquidity,
          weight: weights[index],
        });
      } else if (binId < activeBinId) {
        // right side has only USDC
        const binLiquidity = LiquidityToAllocate * weights[index];
        const liquidityYInUSD = binLiquidity;
        liquidityAllocation.push({
          binId,
          liquidityX: 0,
          liquidityY: liquidityYInUSD,
          totalLiquidity: binLiquidity,
          weight: weights[index],
        });
      } else {
        // left side has only SAROS
        const binLiquidity = LiquidityToAllocate * weights[index];
        const liquidityXInUSD = binLiquidity;
        const liquidityXInSAROS = liquidityXInUSD / currentPrice;
        liquidityAllocation.push({
          binId,
          liquidityX: liquidityXInSAROS,
          liquidityY: 0,
          totalLiquidity: binLiquidity,
          weight: weights[index],
        });
      }
    }

    // TODO: Implement bid-ask strategy
  }

  return liquidityAllocation;
};
