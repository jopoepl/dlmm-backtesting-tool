import { PoolSnapshot } from "@/types/snapshots";

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
