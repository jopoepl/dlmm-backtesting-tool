/**
 * Liquidity Allocation Functions for DLMM Strategies
 *
 * This module provides functions to allocate liquidity across bins according to
 * different DLMM strategies: Spot, Curve, and Bid-Ask.
 */

export interface LiquidityAllocation {
  binId: number;
  liquidityX: number; // SAROS amount
  liquidityY: number; // USDC amount
  totalLiquidity: number;
  weight: number; // Allocation weight (0-1)
}

export interface AllocationParams {
  totalLiquidity: number; // Total liquidity to allocate
  activeBinId: number;
  binRange: number; // Number of bins on each side
  currentPrice: number; // Current price for token ratio calculation
  concentration?: "low" | "medium" | "high"; // For curve and bid-ask strategies
}

/**
 * Spot Strategy: Equal distribution across selected bins
 * Each bin gets equal allocation regardless of position
 */
export function allocateSpotLiquidity(
  params: AllocationParams
): LiquidityAllocation[] {
  const { totalLiquidity, activeBinId, binRange } = params;

  // Calculate bin IDs for spot strategy (active bin ± range)
  const binIds: number[] = [];
  for (let i = -binRange; i <= binRange; i++) {
    binIds.push(activeBinId + i);
  }

  const numBins = binIds.length;
  const equalWeight = 1 / numBins;
  const liquidityPerBin = totalLiquidity / numBins;

  return binIds.map((binId) => {
    // For spot strategy, we need to determine token allocation based on bin position
    const { liquidityX, liquidityY } = calculateTokenAllocation(
      binId,
      activeBinId,
      liquidityPerBin,
      params.currentPrice
    );

    return {
      binId,
      liquidityX,
      liquidityY,
      totalLiquidity: liquidityPerBin,
      weight: equalWeight,
    };
  });
}

/**
 * Curve Strategy: Gaussian distribution centered around active bin
 * Uses bell curve distribution with configurable concentration
 */
export function allocateCurveLiquidity(
  params: AllocationParams
): LiquidityAllocation[] {
  const {
    totalLiquidity,
    activeBinId,
    binRange,
    concentration = "medium",
  } = params;

  // Calculate bin IDs for curve strategy
  const binIds: number[] = [];
  for (let i = -binRange; i <= binRange; i++) {
    binIds.push(activeBinId + i);
  }

  // Calculate Gaussian weights
  const weights = calculateGaussianWeights(binIds.length, concentration);

  return binIds.map((binId, index) => {
    const binLiquidity = totalLiquidity * weights[index];
    const { liquidityX, liquidityY } = calculateTokenAllocation(
      binId,
      activeBinId,
      binLiquidity,
      params.currentPrice
    );

    return {
      binId,
      liquidityX,
      liquidityY,
      totalLiquidity: binLiquidity,
      weight: weights[index],
    };
  });
}

/**
 * Bid-Ask Strategy: Inverse Gaussian (U-shaped) distribution
 * Concentrates liquidity at the edges with minimal allocation in active bin
 */
export function allocateBidAskLiquidity(
  params: AllocationParams
): LiquidityAllocation[] {
  const {
    totalLiquidity,
    activeBinId,
    binRange,
    concentration = "medium",
  } = params;

  // Calculate bin IDs for bid-ask strategy (U-shape + active bin)
  const binIds: number[] = [];

  // Add bins at the left end of the range
  for (let i = 0; i < binRange; i++) {
    binIds.push(activeBinId - binRange + i);
  }

  // Add the active bin in the middle with minimal allocation
  binIds.push(activeBinId);

  // Add bins at the right end of the range
  for (let i = 0; i < binRange; i++) {
    binIds.push(activeBinId + binRange - i);
  }

  // Calculate U-shaped weights (inverted bell curve)
  const weights = calculateBidAskWeights(binIds.length, concentration);

  const allocations = binIds.map((binId, index) => {
    const binLiquidity = totalLiquidity * weights[index];
    const { liquidityX, liquidityY } = calculateTokenAllocation(
      binId,
      activeBinId,
      binLiquidity,
      params.currentPrice
    );

    return {
      binId,
      liquidityX,
      liquidityY,
      totalLiquidity: binLiquidity,
      weight: weights[index],
    };
  });

  // Note: Debug logging removed since allocation is now calculated once at snapshot 0

  return allocations;
}

/**
 * Calculate Gaussian distribution weights for curve strategy
 */
function calculateGaussianWeights(
  numBins: number,
  concentration: "low" | "medium" | "high"
): number[] {
  const weights: number[] = [];
  const center = (numBins - 1) / 2;

  // Gaussian distribution parameters
  const sigmaMap = {
    low: numBins / 4, // More spread
    medium: numBins / 6, // Balanced
    high: numBins / 8, // More concentrated
  };

  const sigma = sigmaMap[concentration] || numBins / 6;

  for (let i = 0; i < numBins; i++) {
    // Gaussian formula: e^(-0.5 * ((x - μ) / σ)²)
    const x = (i - center) / sigma;
    weights[i] = Math.exp(-0.5 * x * x);
  }

  // Normalize to sum to 1
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => w / sum);
}

/**
 * Calculate U-shaped distribution weights for bid-ask strategy
 * Creates an inverted bell curve with minimal allocation in the center (active bin)
 */
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
      // Active bin gets minimal allocation (5% of max edge allocation)
      const maxEdgeWeight = Math.exp((numBins - 1) / 2 / sigma);
      weight = maxEdgeWeight * 0.05; // 5% of maximum edge weight
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

/**
 * Calculate token allocation for a specific bin based on DLMM rules
 *
 * In DLMM:
 * - Only the active bin has both tokens
 * - Bins to the right of active bin have only quote token (USDC)
 * - Bins to the left of active bin have only base token (SAROS)
 */
function calculateTokenAllocation(
  binId: number,
  activeBinId: number,
  totalLiquidity: number,
  currentPrice: number
): { liquidityX: number; liquidityY: number } {
  if (binId === activeBinId) {
    // Active bin: Calculate proper ratio based on current price
    // For a balanced position, we want equal value in both tokens
    // If price = SAROS/USDC, then 1 SAROS = price USDC
    // So for totalLiquidity, we want: SAROS_value + USDC_value = totalLiquidity
    // Where SAROS_value = USDC_value = totalLiquidity / 2
    // Therefore: SAROS_amount * price = totalLiquidity / 2
    // So: SAROS_amount = totalLiquidity / (2 * price)
    // And: USDC_amount = totalLiquidity / 2

    const sarosAmount = totalLiquidity / (2 * currentPrice);
    const usdcAmount = totalLiquidity / 2;

    // Note: Debug logging removed since allocation is now calculated once at snapshot 0

    return {
      liquidityX: sarosAmount, // SAROS amount
      liquidityY: usdcAmount, // USDC amount
    };
  } else if (binId > activeBinId) {
    // Right side: Only quote token (USDC)
    return {
      liquidityX: 0,
      liquidityY: totalLiquidity,
    };
  } else {
    // Left side: Only base token (SAROS)
    return {
      liquidityX: totalLiquidity / currentPrice, // Convert to SAROS
      liquidityY: 0,
    };
  }
}

/**
 * Get allocation function based on strategy name
 */
export function getAllocationFunction(strategy: "Spot" | "Curve" | "Bid-Ask") {
  switch (strategy) {
    case "Spot":
      return allocateSpotLiquidity;
    case "Curve":
      return allocateCurveLiquidity;
    case "Bid-Ask":
      return allocateBidAskLiquidity;
    default:
      throw new Error(`Unknown strategy: ${strategy}`);
  }
}

/**
 * Calculate total allocated liquidity for a strategy
 */
export function calculateTotalAllocatedLiquidity(
  allocations: LiquidityAllocation[]
): number {
  return allocations.reduce(
    (sum, allocation) => sum + allocation.totalLiquidity,
    0
  );
}

/**
 * Calculate total SAROS allocated
 */
export function calculateTotalSAROS(
  allocations: LiquidityAllocation[]
): number {
  return allocations.reduce(
    (sum, allocation) => sum + allocation.liquidityX,
    0
  );
}

/**
 * Calculate total USDC allocated
 */
export function calculateTotalUSDC(allocations: LiquidityAllocation[]): number {
  return allocations.reduce(
    (sum, allocation) => sum + allocation.liquidityY,
    0
  );
}

/**
 * Test function to demonstrate bid-ask allocation
 * This shows the inverted bell curve distribution
 */
export function testBidAskAllocation() {
  const params: AllocationParams = {
    totalLiquidity: 1000,
    activeBinId: 1000,
    binRange: 3,
    currentPrice: 0.404348, // Using the actual SAROS price you mentioned
    concentration: "medium",
  };

  const allocation = allocateBidAskLiquidity(params);

  console.log("Bid-Ask Test Allocation (Inverted Bell Curve):");
  console.log(`Price: ${params.currentPrice} SAROS/USDC`);
  console.log(`Total Liquidity: ${params.totalLiquidity} USDC`);
  console.log("---");

  allocation.forEach((alloc, index) => {
    const isActive = alloc.binId === params.activeBinId;
    const sarosValue = alloc.liquidityX * params.currentPrice;
    const totalValue = sarosValue + alloc.liquidityY;

    console.log(
      `Bin ${alloc.binId}${isActive ? " (ACTIVE)" : ""}: ` +
        `${(alloc.weight * 100).toFixed(2)}% ` +
        `(${alloc.totalLiquidity.toFixed(2)} total, ` +
        `${alloc.liquidityX.toFixed(2)} SAROS (${sarosValue.toFixed(
          2
        )} USDC), ` +
        `${alloc.liquidityY.toFixed(2)} USDC, ` +
        `Total Value: ${totalValue.toFixed(2)} USDC)`
    );
  });

  return allocation;
}

/**
 * Test function to verify the calculation with your example
 */
export function testPriceCalculation() {
  const price = 0.404348; // SAROS/USDC
  const totalLiquidity = 1000; // USDC

  // For active bin with balanced allocation
  const sarosAmount = totalLiquidity / (2 * price);
  const usdcAmount = totalLiquidity / 2;
  const sarosValue = sarosAmount * price;
  const totalValue = sarosValue + usdcAmount;

  console.log("Price Calculation Test:");
  console.log(`Price: ${price} SAROS/USDC`);
  console.log(`Total Liquidity: ${totalLiquidity} USDC`);
  console.log(`SAROS Amount: ${sarosAmount.toFixed(2)} SAROS`);
  console.log(`SAROS Value: ${sarosValue.toFixed(2)} USDC`);
  console.log(`USDC Amount: ${usdcAmount.toFixed(2)} USDC`);
  console.log(`Total Value: ${totalValue.toFixed(2)} USDC`);
  console.log(`Expected SAROS for 500 USDC: ${(500 / price).toFixed(2)} SAROS`);

  return { sarosAmount, usdcAmount, sarosValue, totalValue };
}
