import { PublicKey } from "@solana/web3.js";
import { LiquidityBookServices, MODE } from "@saros-finance/dlmm-sdk";
import BN from "bn.js";
import {
  PoolMetadata,
  PoolReserves,
  PoolPairAccount,
  BinArrayInfo,
  PoolInfo,
  BinLiquidityData,
} from "@/types/dlmm";
import { calculateTokenAmount } from "@/lib/utils/tokenUtils";

// Constants for price calculation (from DLMM SDK)
const BASIS_POINT_MAX = 10000;
const ONE = 1;
const SCALE_OFFSET = 64;

// Implementation of getPriceFromId function (from DLMM SDK)
const getBase = (binStep: number) => {
  const quotient = binStep << SCALE_OFFSET;
  if (quotient < 0) return null;

  const basisPointMaxBigInt = BASIS_POINT_MAX;
  if (basisPointMaxBigInt === 0) return null;

  const fraction = quotient / basisPointMaxBigInt;
  const oneBigInt = ONE;
  const result = oneBigInt + fraction;

  return result;
};

const getPriceFromId = (
  bin_step: number,
  bin_id: number,
  baseTokenDecimal: number,
  quoteTokenDecimal: number
) => {
  const base = getBase(bin_step) as number;
  const exponent = bin_id - 8_388_608;
  const decimalPow = Math.pow(10, baseTokenDecimal - quoteTokenDecimal);

  return Math.pow(base, exponent) * decimalPow;
};

// Workshop pool - USDC/USDT
// export const WORKSHOP_POOL_ADDRESS =
//   "9P3N4QxjMumpTNNdvaNNskXu2t7VHMMXtePQB72kkSAk";

// SOL/USDC pair address (you'll need to get this from Saros docs)
export const SAROS_USDC_PAIR_ADDRESS =
  "ADPKeitAZsAeRJfhG2GoDrZENB3xt9eZmggkj7iAXY78";

export class DLMMService {
  private dlmm: LiquidityBookServices;

  constructor() {
    this.dlmm = new LiquidityBookServices({
      mode: MODE.MAINNET,
      options: {
        rpcUrl:
          process.env.NEXT_PUBLIC_RPC_URL ||
          "https://api.mainnet-beta.solana.com",
      },
    });
  }

  /**
   * Fetch pool metadata
   */
  async fetchPoolMetadata(poolAddress: string): Promise<PoolMetadata | null> {
    try {
      const metaData = await this.dlmm.fetchPoolMetadata(poolAddress);
      return metaData as PoolMetadata;
    } catch (error) {
      console.error("Error fetching pool metadata:", error);
      return null;
    }
  }

  /**
   * Calculate pool reserves with actual token amounts
   */
  async getPoolReserves(poolAddress: string): Promise<PoolReserves | null> {
    try {
      const metaData = await this.fetchPoolMetadata(poolAddress);
      if (!metaData) return null;

      const baseAmount = calculateTokenAmount(
        metaData.baseReserve,
        metaData.extra.tokenBaseDecimal
      );
      const quoteAmount = calculateTokenAmount(
        metaData.quoteReserve,
        metaData.extra.tokenQuoteDecimal
      );

      return {
        baseAmount,
        quoteAmount,
        baseReserve: metaData.baseReserve,
        quoteReserve: metaData.quoteReserve,
        baseDecimals: metaData.extra.tokenBaseDecimal,
        quoteDecimals: metaData.extra.tokenQuoteDecimal,
      };
    } catch (error) {
      console.error("Error calculating pool reserves:", error);
      return null;
    }
  }

  /**
   * Get current market price by quoting a swap
   */
  async getCurrentMarketPrice(poolAddress: string): Promise<number | null> {
    try {
      const metaData = await this.fetchPoolMetadata(poolAddress);
      if (!metaData) return null;

      const quotePrice = await this.dlmm.quote({
        amount: 1000000, // 1 token with 6 decimals
        metadata: metaData,
        optional: {
          isExactInput: true,
          swapForY: true,
          slippage: 0.05,
        },
      });

      return calculateTokenAmount(
        quotePrice.amountOut.toString(),
        metaData.extra.tokenQuoteDecimal
      );
    } catch (error) {
      console.error("Error getting current market price:", error);
      return null;
    }
  }

  /**
   * Get exact active bin price using getPriceFromId
   */
  async getActiveBinPrice(poolAddress: string): Promise<number | null> {
    try {
      const [pairAccount, metaData] = await Promise.all([
        this.getPoolPairAccount(poolAddress),
        this.fetchPoolMetadata(poolAddress),
      ]);

      if (!pairAccount || !metaData) {
        console.warn("Missing pair account or metadata for active bin price");
        return null;
      }

      const activeBinPrice = getPriceFromId(
        pairAccount.binStep,
        pairAccount.activeId,
        metaData.extra.tokenBaseDecimal,
        metaData.extra.tokenQuoteDecimal
      );

      console.log(
        `Active bin price: ${activeBinPrice} (binId: ${pairAccount.activeId}, binStep: ${pairAccount.binStep})`
      );
      return activeBinPrice;
    } catch (error) {
      console.error("Error getting active bin price:", error);
      return null;
    }
  }

  /**
   * Get pool pair account data
   */
  async getPoolPairAccount(
    poolAddress: string
  ): Promise<PoolPairAccount | null> {
    try {
      const poolPubKey = new PublicKey(poolAddress);
      const pairAccount = await this.dlmm.getPairAccount(poolPubKey);

      console.log("Raw pair account data:", pairAccount);

      // Map the SDK Pair interface to our PoolPairAccount interface
      return {
        activeId: pairAccount.activeId || 0,
        binStep: pairAccount.binStep || 0,
        baseFeePct: pairAccount.staticFeeParameters?.baseFactor || 0,
        quoteFeePct: pairAccount.staticFeeParameters?.baseFactor || 0, // Same as base for now
        protocolFeePct: pairAccount.staticFeeParameters?.protocolShare || 0,
        liquidity: "0", // Not available in Pair interface
        rewardVaults: [], // Not available in Pair interface
        oracle: new PublicKey("11111111111111111111111111111111"), // Not available in Pair interface
        oracleId: 0, // Not available in Pair interface
      };
    } catch (error) {
      console.error("Error getting pool pair account:", error);
      return null;
    }
  }

  /**
   * Get bin array information
   */
  async getBinArrayInfo(
    poolAddress: string,
    binArrayIndex?: number
  ): Promise<BinArrayInfo | null> {
    try {
      const poolPubKey = new PublicKey(poolAddress);
      const pairAccount = await this.getPoolPairAccount(poolAddress);

      if (!pairAccount) return null;

      // If no binArrayIndex provided, calculate from active bin
      const targetBinArrayIndex =
        binArrayIndex ?? Math.floor(pairAccount.activeId / 256);

      const arrayInfo = await this.dlmm.getBinArrayInfo({
        binArrayIndex: targetBinArrayIndex,
        pair: poolPubKey,
        payer: poolPubKey,
      });

      return {
        binArrayIndex: targetBinArrayIndex,
        bins: arrayInfo.bins || [],
        lowerBinId: targetBinArrayIndex * 256,
        upperBinId: (targetBinArrayIndex + 1) * 256 - 1,
      };
    } catch (error) {
      console.error("Error getting bin array info:", error);
      return null;
    }
  }

  /**
   * Get surrounding bins around the active bin
   */
  async getSurroundingBins(
    poolAddress: string,
    range: number = 20
  ): Promise<BinLiquidityData[]> {
    try {
      const metaData = await this.fetchPoolMetadata(poolAddress);
      if (!metaData) return [];
      const tokenBaseDecimal = metaData?.extra.tokenBaseDecimal;
      if (!tokenBaseDecimal) return [];
      const tokenQuoteDecimal = metaData?.extra.tokenQuoteDecimal;
      if (!tokenQuoteDecimal) return [];

      const pairAccount = await this.getPoolPairAccount(poolAddress);
      console.log("Pair account in surrounding bins:", pairAccount);
      if (!pairAccount) {
        console.warn("No pair account found");
        return [];
      }

      const activeBin = pairAccount.activeId;
      const binStep = pairAccount.binStep;
      const poolPubKey = new PublicKey(poolAddress);

      // Get active bin price for reference
      const activeBinPrice = await this.getActiveBinPrice(poolAddress);
      console.log(
        `Active bin: ${activeBin}, Bin step: ${binStep}, Active bin price: ${activeBinPrice}`
      );

      // Calculate bin range around active bin
      const startBin = activeBin - range;
      const endBin = activeBin + range;

      const bins: BinLiquidityData[] = [];

      // Get bin arrays for the range
      const startArrayIndex = Math.floor(startBin / 256);
      const endArrayIndex = Math.floor(endBin / 256);

      console.log(`Bin range: ${startBin} to ${endBin}`);
      console.log(`Array range: ${startArrayIndex} to ${endArrayIndex}`);

      // Fetch bin arrays in parallel
      const binArrayPromises = [];
      for (
        let arrayIndex = startArrayIndex;
        arrayIndex <= endArrayIndex;
        arrayIndex++
      ) {
        binArrayPromises.push(
          this.dlmm
            .getBinArrayInfo({
              binArrayIndex: arrayIndex,
              pair: poolPubKey,
              payer: poolPubKey,
            })
            .then((arrayInfo) => {
              console.log(`Array ${arrayIndex} result:`, {
                binsLength: arrayInfo?.bins?.length || 0,
                resultIndex: arrayInfo?.resultIndex,
                bins: arrayInfo?.bins?.slice(0, 3), // Show first 3 bins for debugging
              });
              return { arrayIndex, arrayInfo };
            })
            .catch((error) => {
              console.warn(`Failed to fetch bin array ${arrayIndex}:`, error);
              return { arrayIndex, arrayInfo: null };
            })
        );
      }

      const binArrayResults = await Promise.all(binArrayPromises);

      // Process all bin arrays
      binArrayResults.forEach(({ arrayIndex, arrayInfo }) => {
        if (arrayInfo && arrayInfo.bins) {
          const lowerBinId = arrayIndex * 256;
          console.log(
            `Processing array ${arrayIndex}, lowerBinId: ${lowerBinId}, bins count: ${arrayInfo.bins.length}`
          );

          arrayInfo.bins.forEach((bin: unknown, index: number) => {
            const binId = lowerBinId + index;

            // Only include bins within our range
            if (binId >= startBin && binId <= endBin) {
              // Calculate exact price for this bin using getPriceFromId
              const price = getPriceFromId(
                binStep,
                binId,
                tokenBaseDecimal,
                tokenQuoteDecimal
              );

              // Extract liquidity data from bin - using correct field names
              console.log(`Bin ${binId} data:`, bin);

              // Use the correct field names from the SDK response
              // Keep as BN for proper arithmetic operations
              const binData = bin as {
                reserveX?: BN;
                reserveY?: BN;
                totalSupply?: BN;
              };
              const baseAmountBN = binData.reserveX || new BN(0);
              const quoteAmountBN = binData.reserveY || new BN(0);
              const liquidityBN = binData.totalSupply || new BN(0);

              // Only add bins that have some liquidity
              if (
                !baseAmountBN.isZero() ||
                !quoteAmountBN.isZero() ||
                !liquidityBN.isZero()
              ) {
                // Convert raw amounts to decimal-adjusted amounts for display using BN arithmetic
                const baseAmountDecimal = baseAmountBN
                  .div(new BN(tokenBaseDecimal))
                  .toNumber();
                const quoteAmountDecimal = quoteAmountBN
                  .div(new BN(tokenQuoteDecimal))
                  .toNumber();

                bins.push({
                  binId,
                  price,
                  baseAmount: baseAmountBN.toString(),
                  quoteAmount: quoteAmountBN.toString(),
                  liquidity: liquidityBN.toString(),
                });
                console.log(
                  `Added bin ${binId}: base=${baseAmountBN.toString()} (${baseAmountDecimal.toFixed(
                    2
                  )}), quote=${quoteAmountBN.toString()} (${quoteAmountDecimal.toFixed(
                    2
                  )}), liquidity=${liquidityBN.toString()}`
                );
              }
            }
          });
        } else {
          console.warn(`No data for array ${arrayIndex}`);
        }
      });

      console.log(`Total bins found: ${bins.length}`);
      return bins.sort((a, b) => a.binId - b.binId);
    } catch (error) {
      console.error("Error getting surrounding bins:", error);
      return [];
    }
  }

  /**
   * Get surrounding bins using a simpler approach (just the active bin array)
   */
  async getSurroundingBinsSimple(
    poolAddress: string,
    range: number = 10
  ): Promise<BinLiquidityData[]> {
    try {
      const [pairAccount, metaData] = await Promise.all([
        this.getPoolPairAccount(poolAddress),
        this.fetchPoolMetadata(poolAddress),
      ]);

      if (!pairAccount || !metaData) {
        console.warn("No pair account or metadata found");
        return [];
      }

      const activeBin = pairAccount.activeId;
      const binStep = pairAccount.binStep;
      const poolPubKey = new PublicKey(poolAddress);

      // Get active bin price for reference
      const activeBinPrice = await this.getActiveBinPrice(poolAddress);
      console.log(
        `Simple method - Active bin: ${activeBin}, Bin step: ${binStep}, Active bin price: ${activeBinPrice}`
      );

      // Get the bin array containing the active bin
      const activeArrayIndex = Math.floor(activeBin / 256);
      console.log(`Active array index: ${activeArrayIndex}`);

      const arrayInfo = await this.dlmm.getBinArrayInfo({
        binArrayIndex: activeArrayIndex,
        pair: poolPubKey,
        payer: poolPubKey,
      });

      console.log(`Array info result:`, {
        binsLength: arrayInfo?.bins?.length || 0,
        resultIndex: arrayInfo?.resultIndex,
        bins: arrayInfo?.bins?.slice(0, 3), // Show first 3 bins for debugging
      });

      if (!arrayInfo || !arrayInfo.bins) {
        console.warn("No bin data found for active array");
        return [];
      }

      const bins: BinLiquidityData[] = [];
      const lowerBinId = activeArrayIndex * 256;

      // Calculate bin range around active bin
      const startBin = activeBin - range;
      const endBin = activeBin + range;

      console.log(
        `Bin range: ${startBin} to ${endBin}, processing ${arrayInfo.bins.length} bins`
      );

      arrayInfo.bins.forEach((bin: unknown, index: number) => {
        const binId = lowerBinId + index;

        // Only include bins within our range
        if (binId >= startBin && binId <= endBin) {
          // Calculate exact price for this bin using getPriceFromId
          const price = getPriceFromId(
            binStep,
            binId,
            metaData.extra.tokenBaseDecimal,
            metaData.extra.tokenQuoteDecimal
          );

          // Extract liquidity data from bin - using correct field names
          // Keep as BN for proper arithmetic operations
          const binData = bin as {
            reserveX?: BN;
            reserveY?: BN;
            totalSupply?: BN;
          };
          const baseAmountBN = binData.reserveX || new BN(0);
          const quoteAmountBN = binData.reserveY || new BN(0);
          const liquidityBN = binData.totalSupply || new BN(0);

          // Only add bins that have some liquidity
          if (
            !baseAmountBN.isZero() ||
            !quoteAmountBN.isZero() ||
            !liquidityBN.isZero()
          ) {
            bins.push({
              binId,
              price,
              baseAmount: baseAmountBN.toString(),
              quoteAmount: quoteAmountBN.toString(),
              liquidity: liquidityBN.toString(),
            });
            console.log(
              `Added bin ${binId}: base=${baseAmountBN.toString()}, quote=${quoteAmountBN.toString()}, liquidity=${liquidityBN.toString()}`
            );
          }
        }
      });

      console.log(`Simple method - Total bins found: ${bins.length}`);
      return bins.sort((a, b) => a.binId - b.binId);
    } catch (error) {
      console.error("Error getting surrounding bins (simple):", error);
      return [];
    }
  }

  /**
   * Get complete pool information
   */
  async getCompletePoolInfo(poolAddress: string): Promise<PoolInfo | null> {
    try {
      const [
        metaData,
        currentMarketPrice,
        activeBinPrice,
        reserves,
        pairAccount,
        binArrayInfo,
      ] = await Promise.all([
        this.fetchPoolMetadata(poolAddress),
        this.getCurrentMarketPrice(poolAddress),
        this.getActiveBinPrice(poolAddress),
        this.getPoolReserves(poolAddress),
        this.getPoolPairAccount(poolAddress),
        this.getBinArrayInfo(poolAddress),
      ]);

      if (!metaData || !reserves || !pairAccount || !binArrayInfo) {
        return null;
      }

      return {
        metaData,
        currentMarketPrice: currentMarketPrice || 0,
        activeBinPrice: activeBinPrice || 0,
        reserves,
        pairAccount,
        binArrayInfo,
        activeBin: pairAccount.activeId,
        binStep: pairAccount.binStep,
      };
    } catch (error) {
      console.error("Error getting complete pool info:", error);
      return null;
    }
  }

  /**
   * Get user positions (commented out for now)
   */
  //   async getUserPositions(userPublicKey: PublicKey): Promise<DLMMPosition[]> {
  //     try {
  //       // This will fetch actual positions from the blockchain
  //       const positions = await this.dlmm.getPositionsByUser(userPublicKey);

  //       // Transform SDK response to your interface
  //       return positions.map((position) => ({
  //         publicKey: position.publicKey.toString(),
  //         lbPair: position.lbPair.toString(),
  //         owner: position.owner.toString(),
  //         liquidityShares: position.liquidityShares.toString(),
  //         rewardInfos: position.rewardInfos || [],
  //         feeInfos: position.feeInfos || [],
  //         positionData: {
  //           totalXAmount: position.positionData?.totalXAmount?.toString() || "0",
  //           totalYAmount: position.positionData?.totalYAmount?.toString() || "0",
  //         },
  //       }));
  //     } catch (error) {
  //       console.error("Error fetching positions:", error);
  //       return [];
  //     }
  //   }

  /**
   * Legacy method for backward compatibility
   */
  async getPoolInfo(pairAddress: string = SAROS_USDC_PAIR_ADDRESS) {
    return this.fetchPoolMetadata(pairAddress);
  }
}
