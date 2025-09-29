"use client";

import { useState, useEffect, useRef } from "react";
import { DLMMStrategy, BacktestResult } from "@/types/dlmm";
import { PoolSnapshot } from "@/types/snapshots";
import {
  Play,
  BarChart3,
  TrendingUp,
  Clock,
  Pause,
  SkipBack,
  SkipForward,
  ChartLine,
} from "lucide-react";
import { LiquidityBarChart } from "./LiquidityBarChart";
import { StrategyTimelineChart } from "./StrategyTimelineChart";
import { StrategyLiquidityAllocation } from "./StrategyLiquidityAllocation";
import {
  getSnapshotsInRange,
  getAllSnapshots,
  snapshotToLiquidityDistribution,
  checkDataAvailability,
} from "@/lib/data/realDataService";
import {
  allocateSpotLiquidity,
  allocateCurveLiquidity,
  allocateBidAskLiquidity,
  AllocationParams,
} from "@/lib/backtesting/liquidityAllocation";
import { LiquidityAllocation } from "@/types/strategy";
import { RealTimeStrategyPerformance } from "./RealTimeStrategyPerformance";

interface TimePeriod {
  start: Date;
  end: Date;
  preset: "7d" | "30d" | "90d" | "custom";
  label: string;
}

interface BacktestingState {
  timePeriod: TimePeriod;
  liquidity: number;
  backtestResults: BacktestResult[];
  loading: boolean;
  error: string | null;
  hasResults: boolean;
  currentSnapshotIndex: number;
  snapshots: PoolSnapshot[];
  dataLoading: boolean;
  dataError: string | null;
  hasData: boolean;
  isAnimating: boolean;
  animationSpeed: number; // milliseconds between snapshots
  previousActiveBinId: number | null; // Track previous active bin for smooth transitions
  isTransitioning: boolean; // Flag for when we're in a slow transition
  shouldLoop: boolean; // whether to loop animation after one cycle
}

const DEFAULT_TIME_PERIODS: Omit<TimePeriod, "start" | "end">[] = [
  { preset: "7d", label: "Last 7 Days" },
  { preset: "30d", label: "Last 30 Days" },
  { preset: "90d", label: "Last 90 Days" },
  { preset: "custom", label: "Custom Range" },
];

// Always analyze all 3 strategies
const ALL_STRATEGIES: DLMMStrategy[] = [
  {
    id: "spot",
    name: "Spot",
    description: "All liquidity at current price",
    riskLevel: "High",
    parameters: {
      binRange: [0, 0],
      rebalanceThreshold: 0.1,
      maxSlippage: 0.05,
    },
  },
  {
    id: "curve",
    name: "Curve",
    description: "Liquidity spread around current price",
    riskLevel: "Medium",
    parameters: {
      binRange: [-5, 5],
      rebalanceThreshold: 0.2,
      maxSlippage: 0.03,
    },
  },
  {
    id: "bid-ask",
    name: "Bid-Ask",
    description: "Separate buy/sell market making",
    riskLevel: "Low",
    parameters: {
      binRange: [-10, 10],
      rebalanceThreshold: 0.3,
      maxSlippage: 0.02,
    },
  },
];

export function BacktestingDashboard() {
  const [state, setState] = useState<BacktestingState>({
    timePeriod: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
      preset: "30d",
      label: "Last 30 Days",
    },
    liquidity: 1000, // Default liquidity amount in USDC
    backtestResults: [],
    loading: false,
    error: null,
    hasResults: false,
    currentSnapshotIndex: 0,
    snapshots: [],
    dataLoading: false,
    dataError: null,
    hasData: false,
    isAnimating: false,
    animationSpeed: 300, // 0.1 seconds between snapshots (faster default)
    previousActiveBinId: null,
    isTransitioning: false,
    shouldLoop: false, // Don't loop by default
  });

  // State for gradual transitions
  const [transitionState, setTransitionState] = useState<{
    isTransitioning: boolean;
    fromSnapshot: PoolSnapshot | null;
    toSnapshot: PoolSnapshot | null;
    progress: number; // 0 to 1
    binShift: number; // How many bins the chart shifts (positive = right, negative = left)
    currentInterpolatedSnapshot: PoolSnapshot | null;
  }>({
    isTransitioning: false,
    fromSnapshot: null,
    toSnapshot: null,
    progress: 0,
    binShift: 0,
    currentInterpolatedSnapshot: null,
  });

  // Strategy activity state
  const [strategyActivity, setStrategyActivity] = useState<{
    spot: { start: number; end: number; active: boolean }[];
    curve: { start: number; end: number; active: boolean }[];
    bidAsk: { start: number; end: number; active: boolean }[];
  }>({
    spot: [],
    curve: [],
    bidAsk: [],
  });

  // Tooltip state for utilization metrics
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  const [spotBins, setSpotBins] = useState<number[]>([]);
  const [curveBins, setCurveBins] = useState<number[]>([]);
  const [bidAskBins, setBidAskBins] = useState<number[]>([]);

  // Allocated liquidity for each strategy
  // Typecast it here
  const [allocatedLiquidity, setAllocatedLiquidity] = useState<{
    spot: LiquidityAllocation[];
    curve: LiquidityAllocation[];
    bidAsk: LiquidityAllocation[];
  }>({
    spot: [],
    curve: [],
    bidAsk: [],
  });

  // This shows how much of liquidity is active in each strategy

  const [strategyIsActive, setStrategyIsActive] = useState<{
    spot: number;
    curve: number;
    bidAsk: number;
  }>({
    spot: 0,
    curve: 0,
    bidAsk: 0,
  });

  // Real-time strategy calculator state
  const [strategyCalculator, setStrategyCalculator] = useState<{
    spot: {
      active: boolean;
      percentage: number;
      totalActive: number;
      totalSnapshots: number;
      //We have Utilization metrics below
      avgUtilizationWhenActive: number;
      overallEfficiency: number;
      peakUtilization: number;
      utilizationStability: number;
    };
    curve: {
      active: boolean;
      percentage: number;
      totalActive: number;
      totalSnapshots: number;
      // Utilization metrics
      avgUtilizationWhenActive: number;
      overallEfficiency: number;
      peakUtilization: number;
      utilizationStability: number;
    };
    bidAsk: {
      active: boolean;
      percentage: number;
      totalActive: number;
      totalSnapshots: number;
      // Utilization metrics
      avgUtilizationWhenActive: number;
      overallEfficiency: number;
      peakUtilization: number;
      utilizationStability: number;
    };
  }>({
    spot: {
      active: false,
      percentage: 0,
      totalActive: 0,
      totalSnapshots: 0,
      avgUtilizationWhenActive: 0,
      overallEfficiency: 0,
      peakUtilization: 0,
      utilizationStability: 0,
    },
    curve: {
      active: false,
      percentage: 0,
      totalActive: 0,
      totalSnapshots: 0,
      avgUtilizationWhenActive: 0,
      overallEfficiency: 0,
      peakUtilization: 0,
      utilizationStability: 0,
    },
    bidAsk: {
      active: false,
      percentage: 0,
      totalActive: 0,
      totalSnapshots: 0,
      avgUtilizationWhenActive: 0,
      overallEfficiency: 0,
      peakUtilization: 0,
      utilizationStability: 0,
    },
  });

  // Strategy configuration state
  const [strategyConfig, setStrategyConfig] = useState<{
    binRangePercent: number; // 1, 2, 5, or 10
    binRange: number; // actual number of bins on each side (binRangePercent = binRange)
  }>({
    binRangePercent: 1,
    binRange: 1, // 1% = 1 bin on each side = 3 bins total
  });

  // Animation refs and effects
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transitionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fixed bid-ask bins calculated from first snapshot
  const [fixedBidAskBins, setFixedBidAskBins] = useState<number[]>([]);

  // Helper function to get spot strategy bin range (active bin ± range)
  // Spot strategy: Equal distribution across selected bin range
  const getSpotBins = (activeBinId: number, binRange: number) => {
    const bins = [];
    for (let i = -binRange; i <= binRange; i++) {
      bins.push(activeBinId + i);
    }
    return bins;
  };

  // Helper function to get curve strategy bin range (concentrated around active bin)
  // Curve strategy: Concentrated around active bin, tapering toward edges
  const getCurveBins = (activeBinId: number, binRange: number) => {
    const bins = [];
    // Active bin gets most weight, then tapering
    bins.push(activeBinId); // Center bin
    for (let i = 1; i <= binRange; i++) {
      bins.push(activeBinId - i); // Left bins
      bins.push(activeBinId + i); // Right bins
    }
    return bins;
  };

  // Helper function to get bid-ask strategy bin range (U-shape)
  // Bid-Ask strategy: Liquidity at both ends of the range + minimal in active bin
  const getBidAskBins = (activeBinId: number, binRange: number) => {
    const bins = [];

    // For bid-ask strategy, we want bins at both ends of the range
    // This creates a U-shape with liquidity at the edges

    // Add bins at the left end of the range
    for (let i = 0; i < binRange; i++) {
      bins.push(activeBinId - binRange + i);
    }

    // Add the active bin in the middle with minimal allocation
    bins.push(activeBinId);

    // Add bins at the right end of the range
    for (let i = 0; i < binRange; i++) {
      bins.push(activeBinId + binRange - i);
    }

    return bins;
  };

  // Function to calculate allocated liquidity for all strategies (called once at snapshot 0)
  const calculateAllocatedLiquidity = (
    activeBinId: number,
    currentPrice: number,
    totalLiquidity: number
  ) => {
    console.log("🔒 Calculating FIXED allocation at snapshot 0:", {
      activeBinId,
      currentPrice,
      totalLiquidity,
      binRange: strategyConfig.binRange,
    });

    const allocationParams: AllocationParams = {
      totalLiquidity,
      activeBinId,
      binRange: strategyConfig.binRange,
      currentPrice,
      concentration: "medium",
    };

    const spotAllocation = allocateSpotLiquidity(allocationParams);
    const curveAllocation = allocateCurveLiquidity(allocationParams);
    const bidAskAllocation = allocateBidAskLiquidity(allocationParams);

    setAllocatedLiquidity({
      spot: spotAllocation,
      curve: curveAllocation,
      bidAsk: bidAskAllocation,
    });

    console.log("🔒 FIXED allocation set (will not change during animation):", {
      spot: spotAllocation,
      curve: curveAllocation,
      bidAsk: bidAskAllocation,
    });
  };

  // Set strategy bins based on snapshot[0] when snapshots or strategy config changes
  useEffect(() => {
    if (state.snapshots.length > 0) {
      const firstSnapshot = state.snapshots[0];
      const firstActiveBinId = firstSnapshot.active_bin_id;

      // Set fixed bins for each strategy based on first snapshot
      const spotBinsFixed = getSpotBins(
        firstActiveBinId,
        strategyConfig.binRange
      );
      const curveBinsFixed = getCurveBins(
        firstActiveBinId,
        strategyConfig.binRange
      );
      const bidAskBinsFixed = getBidAskBins(
        firstActiveBinId,
        strategyConfig.binRange
      );

      setSpotBins(spotBinsFixed);
      setCurveBins(curveBinsFixed);
      setBidAskBins(bidAskBinsFixed);

      // Calculate allocated liquidity
      calculateAllocatedLiquidity(
        firstActiveBinId,
        firstSnapshot.current_price,
        state.liquidity
      );

      console.log(
        "🔒 FIXED Strategy bins set from snapshot[0] (these should NEVER change):",
        {
          spot: spotBinsFixed,
          curve: curveBinsFixed,
          bidAsk: bidAskBinsFixed,
          firstActiveBinId,
          binRange: strategyConfig.binRange,
        }
      );
    }
  }, [state.snapshots, strategyConfig.binRange, state.liquidity]);

  // Function to determine which strategy is active for a given snapshot
  // Simply checks if active bin is within each strategy's bin range
  const determineStrategyIsActive = (
    snapshot: PoolSnapshot,
    liquidityAmount: number
  ) => {
    if (!snapshot.bin_data || snapshot.bin_data.length === 0) {
      return { spot: false, curve: false, bidAsk: false };
    }

    const activeBinId = snapshot.active_bin_id;

    // Use fixed strategy bins calculated from snapshot[0]
    // These don't change during backtesting - they represent the original strategy positions

    console.log("Active bin ID:", activeBinId);
    console.log("Spot bins:", spotBins);
    console.log("Curve bins:", curveBins);
    console.log("Fixed bid-ask bins:", bidAskBins);

    // Check if current active bin is within the fixed strategy ranges
    const spot = spotBins.includes(activeBinId);
    const curve = curveBins.includes(activeBinId);
    const bidAsk = bidAskBins.includes(activeBinId);

    // Debug logging to see bid-ask strategy activity
    console.log(
      `Snapshot check: Active bin ${activeBinId}, Bid-ask bins:`,
      bidAskBins,
      `Bid-ask active: ${bidAsk}`
    );

    if (bidAsk) {
      console.log(
        `🎯 Bid-Ask Active! Active bin ${activeBinId} is in bid-ask bins:`,
        bidAskBins
      );
    }

    return { spot, curve, bidAsk };
  };

  // Function to calculate utilization for a strategy at a specific snapshot
  const calculateStrategyUtilization = (
    snapshot: PoolSnapshot,
    strategy: "spot" | "curve" | "bidAsk",
    activeBinId: number
  ): number => {
    if (!allocatedLiquidity || !snapshot.bin_data) return 0;

    const strategyAllocation = allocatedLiquidity[strategy];
    const activeBinAllocation = strategyAllocation.find(
      (alloc) => alloc.binId === activeBinId
    );

    if (!activeBinAllocation) return 0;

    // Calculate total strategy liquidity
    const totalStrategyLiquidity = strategyAllocation.reduce(
      (sum, alloc) => sum + alloc.totalLiquidity,
      0
    );

    if (totalStrategyLiquidity === 0) return 0;

    // Utilization = (liquidity in active bin) / (total strategy liquidity)
    return (activeBinAllocation.totalLiquidity / totalStrategyLiquidity) * 100;
  };

  // Function to calculate comprehensive utilization metrics for all strategies
  const calculateUtilizationMetrics = () => {
    if (state.snapshots.length === 0) return;

    const metrics = {
      spot: {
        activeSnapshots: 0,
        totalUtilization: 0,
        utilizationValues: [] as number[],
        peakUtilization: 0,
      },
      curve: {
        activeSnapshots: 0,
        totalUtilization: 0,
        utilizationValues: [] as number[],
        peakUtilization: 0,
      },
      bidAsk: {
        activeSnapshots: 0,
        totalUtilization: 0,
        utilizationValues: [] as number[],
        peakUtilization: 0,
      },
    };

    // Calculate metrics for each snapshot
    state.snapshots.forEach((snapshot) => {
      const strategies = determineStrategyIsActive(snapshot, state.liquidity);
      const activeBinId = snapshot.active_bin_id;

      (["spot", "curve", "bidAsk"] as const).forEach((strategy) => {
        const isActive = strategies[strategy];
        if (isActive) {
          const utilization = calculateStrategyUtilization(
            snapshot,
            strategy,
            activeBinId
          );
          metrics[strategy].activeSnapshots++;
          metrics[strategy].totalUtilization += utilization;
          metrics[strategy].utilizationValues.push(utilization);
          metrics[strategy].peakUtilization = Math.max(
            metrics[strategy].peakUtilization,
            utilization
          );
        }
      });
    });

    // Update strategy calculator with calculated metrics
    setStrategyCalculator((prev) => {
      const newCalculator = { ...prev };

      (["spot", "curve", "bidAsk"] as const).forEach((strategy) => {
        const metric = metrics[strategy];
        /**
       *  {
        activeSnapshots: number;
        totalUtilization: number;
        utilizationValues: number[];
        peakUtilization: number;
    }; - this is what metrics object looks like for spot strategy 
       */
        const totalSnapshots = state.snapshots.length;

        // Calculate averages
        const avgUtilizationWhenActive =
          metric.activeSnapshots > 0
            ? metric.totalUtilization / metric.activeSnapshots
            : 0;

        const overallEfficiency =
          totalSnapshots > 0 ? metric.totalUtilization / totalSnapshots : 0;

        // Calculate stability (standard deviation)
        const utilizationStability =
          metric.utilizationValues.length > 1
            ? Math.sqrt(
                metric.utilizationValues.reduce(
                  (sum, val) =>
                    sum + Math.pow(val - avgUtilizationWhenActive, 2),
                  0
                ) / metric.utilizationValues.length
              )
            : 0;

        newCalculator[strategy] = {
          ...prev[strategy],
          avgUtilizationWhenActive,
          overallEfficiency,
          peakUtilization: metric.peakUtilization,
          utilizationStability,
        };
      });

      return newCalculator;
    });
  };

  // Progressive utilization metrics calculation (up to current snapshot)
  // This resets metrics to 0 and builds them up progressively during animation
  const calculateProgressiveUtilizationMetrics = () => {
    if (state.snapshots.length === 0 || state.currentSnapshotIndex < 0) return;

    const metrics = {
      spot: {
        activeSnapshots: 0,
        totalUtilization: 0,
        utilizationValues: [] as number[],
        peakUtilization: 0,
      },
      curve: {
        activeSnapshots: 0,
        totalUtilization: 0,
        utilizationValues: [] as number[],
        peakUtilization: 0,
      },
      bidAsk: {
        activeSnapshots: 0,
        totalUtilization: 0,
        utilizationValues: [] as number[],
        peakUtilization: 0,
      },
    };

    // Calculate metrics only up to current snapshot index
    const snapshotsToProcess = state.snapshots.slice(
      0,
      state.currentSnapshotIndex + 1
    );

    snapshotsToProcess.forEach((snapshot) => {
      const strategies = determineStrategyIsActive(snapshot, state.liquidity);
      const activeBinId = snapshot.active_bin_id;

      (["spot", "curve", "bidAsk"] as const).forEach((strategy) => {
        const isActive = strategies[strategy];
        if (isActive) {
          const utilization = calculateStrategyUtilization(
            snapshot,
            strategy,
            activeBinId
          );
          metrics[strategy].activeSnapshots++;
          metrics[strategy].totalUtilization += utilization;
          metrics[strategy].utilizationValues.push(utilization);
          metrics[strategy].peakUtilization = Math.max(
            metrics[strategy].peakUtilization,
            utilization
          );
        }
      });
    });

    // Update strategy calculator with progressive calculated metrics
    setStrategyCalculator((prev) => {
      const newCalculator = { ...prev };

      (["spot", "curve", "bidAsk"] as const).forEach((strategy) => {
        const metric = metrics[strategy];
        const processedSnapshots = state.currentSnapshotIndex + 1;

        // Calculate averages based on processed snapshots
        const avgUtilizationWhenActive =
          metric.activeSnapshots > 0
            ? metric.totalUtilization / metric.activeSnapshots
            : 0;

        const overallEfficiency =
          processedSnapshots > 0
            ? metric.totalUtilization / processedSnapshots
            : 0;

        // Calculate stability (standard deviation)
        const utilizationStability =
          metric.utilizationValues.length > 1
            ? Math.sqrt(
                metric.utilizationValues.reduce(
                  (sum, val) =>
                    sum + Math.pow(val - avgUtilizationWhenActive, 2),
                  0
                ) / metric.utilizationValues.length
              )
            : 0;

        newCalculator[strategy] = {
          ...prev[strategy],
          avgUtilizationWhenActive,
          overallEfficiency,
          peakUtilization: metric.peakUtilization,
          utilizationStability,
        };
      });

      return newCalculator;
    });
  };

  // Calculate total strategy percentages across all snapshots
  const calculateStrategyPercentages = () => {
    const totalSnapshots = state.snapshots.length;
    let totalActiveCounts = { spot: 0, curve: 0, bidAsk: 0 };

    state.snapshots.forEach((snapshot) => {
      const snapshotStrategies = determineStrategyIsActive(
        snapshot,
        state.liquidity
      );
      if (snapshotStrategies) {
        totalActiveCounts.spot += snapshotStrategies.spot ? 1 : 0;
        totalActiveCounts.curve += snapshotStrategies.curve ? 1 : 0;
        totalActiveCounts.bidAsk += snapshotStrategies.bidAsk ? 1 : 0;
      }
    });

    setStrategyCalculator((prev) => {
      const newCalculator = { ...prev };

      ["spot", "curve", "bidAsk"].forEach((strategyKey) => {
        const key = strategyKey as keyof typeof totalActiveCounts;
        const totalActive = totalActiveCounts[key];
        const percentage =
          totalSnapshots > 0 ? (totalActive / totalSnapshots) * 100 : 0;

        newCalculator[key] = {
          ...prev[key],
          percentage,
          totalActive,
          totalSnapshots,
        };
      });

      return newCalculator;
    });
  };

  // Reset strategy calculator when starting new analysis
  const resetStrategyCalculator = () => {
    setStrategyCalculator({
      spot: {
        active: false,
        percentage: 0,
        totalActive: 0,
        totalSnapshots: 0,
        avgUtilizationWhenActive: 0,
        overallEfficiency: 0,
        peakUtilization: 0,
        utilizationStability: 0,
      },
      curve: {
        active: false,
        percentage: 0,
        totalActive: 0,
        totalSnapshots: 0,
        avgUtilizationWhenActive: 0,
        overallEfficiency: 0,
        peakUtilization: 0,
        utilizationStability: 0,
      },
      bidAsk: {
        active: false,
        percentage: 0,
        totalActive: 0,
        totalSnapshots: 0,
        avgUtilizationWhenActive: 0,
        overallEfficiency: 0,
        peakUtilization: 0,
        utilizationStability: 0,
      },
    });
  };

  // Helper function to calculate liquidity variance (for Spot detection)
  const calculateLiquidityVariance = (
    bins: Array<{ binId: number; liquidity: number; price: number }>
  ) => {
    if (bins.length <= 1) return 0;

    const mean =
      bins.reduce((sum, bin) => sum + bin.liquidity, 0) / bins.length;
    const variance =
      bins.reduce((sum, bin) => sum + Math.pow(bin.liquidity - mean, 2), 0) /
      bins.length;
    const standardDeviation = Math.sqrt(variance);

    return standardDeviation / mean; // Coefficient of variation
  };

  // Helper function to calculate curve concentration (for Curve detection)
  const calculateCurveConcentration = (
    bins: Array<{ binId: number; liquidity: number; price: number }>,
    activeBinId: number,
    minBinId: number,
    maxBinId: number
  ) => {
    const centerBinId = (minBinId + maxBinId) / 2;
    const range = maxBinId - minBinId;
    const centerRange = range * 0.4; // 40% of range around center

    const centerBins = bins.filter(
      (bin) => Math.abs(bin.binId - centerBinId) <= centerRange / 2
    );

    const centerLiquidity = centerBins.reduce(
      (sum, bin) => sum + bin.liquidity,
      0
    );
    const totalLiquidity = bins.reduce((sum, bin) => sum + bin.liquidity, 0);

    return centerLiquidity / totalLiquidity;
  };

  // Helper function to calculate bid-ask concentration (for Bid-Ask detection)
  const calculateBidAskConcentration = (
    bins: Array<{ binId: number; liquidity: number; price: number }>,
    minBinId: number,
    maxBinId: number
  ) => {
    const range = maxBinId - minBinId;
    const endRange = range * 0.2; // 20% of range at each end

    const leftEndBins = bins.filter((bin) => bin.binId <= minBinId + endRange);
    const rightEndBins = bins.filter((bin) => bin.binId >= maxBinId - endRange);

    const endLiquidity =
      leftEndBins.reduce((sum, bin) => sum + bin.liquidity, 0) +
      rightEndBins.reduce((sum, bin) => sum + bin.liquidity, 0);
    const totalLiquidity = bins.reduce((sum, bin) => sum + bin.liquidity, 0);

    return endLiquidity / totalLiquidity;
  };

  // Function to calculate strategy activity across all snapshots
  const calculateStrategyActivity = (
    snapshots: PoolSnapshot[],
    liquidityAmount: number
  ) => {
    const activity = {
      spot: [] as {
        start: number;
        end: number;
        active: boolean;
        activeLiquidity?: number;
      }[],
      curve: [] as {
        start: number;
        end: number;
        active: boolean;
        activeLiquidity?: number;
      }[],
      bidAsk: [] as {
        start: number;
        end: number;
        active: boolean;
        activeLiquidity?: number;
      }[],
    };

    snapshots.forEach((snapshot, index) => {
      const strategies = determineStrategyIsActive(snapshot, liquidityAmount);
      const timestamp = new Date(snapshot.timestamp).getTime();

      if (strategies) {
        activity.spot.push({
          start: timestamp,
          end: timestamp,
          active: strategies.spot,
        });
        activity.curve.push({
          start: timestamp,
          end: timestamp,
          active: strategies.curve,
        });
        activity.bidAsk.push({
          start: timestamp,
          end: timestamp,
          active: strategies.bidAsk,
        });
      }
    });

    return activity;
  };

  // Function to interpolate between two snapshots with gradual bin shifting
  const interpolateSnapshots = (
    from: PoolSnapshot,
    to: PoolSnapshot,
    progress: number,
    binShift: number
  ): PoolSnapshot => {
    const interpolated = { ...from };

    // Interpolate current price
    interpolated.current_price =
      from.current_price + (to.current_price - from.current_price) * progress;

    // Interpolate active bin ID gradually
    const fromBinId = from.active_bin_id;
    const toBinId = to.active_bin_id;
    const binIdDiff = toBinId - fromBinId;

    // Calculate intermediate bin ID based on progress
    if (progress < 0.5) {
      // First half: keep original active bin
      interpolated.active_bin_id = fromBinId;
    } else {
      // Second half: gradually shift to new active bin
      const shiftProgress = (progress - 0.5) * 2; // 0 to 1 in second half
      interpolated.active_bin_id =
        fromBinId + Math.round(binIdDiff * shiftProgress);
    }

    // Interpolate bin data with gradual shifting
    if (from.bin_data && to.bin_data) {
      // Create a map of bin data for easy lookup
      const toBinMap = new Map(to.bin_data.map((bin) => [bin.bin_id, bin]));

      interpolated.bin_data = from.bin_data.map((fromBin) => {
        // Calculate the shifted bin ID for this bin
        const shiftedBinId = fromBin.bin_id + Math.round(binShift * progress);
        const toBin = toBinMap.get(shiftedBinId);

        if (!toBin) {
          // If no corresponding bin in target, gradually fade out
          const fadeOut = Math.max(0, 1 - progress * 2);
          return {
            ...fromBin,
            bin_id: shiftedBinId,
            liquidity_x: (parseFloat(fromBin.liquidity_x) * fadeOut).toString(),
            liquidity_y: (parseFloat(fromBin.liquidity_y) * fadeOut).toString(),
          };
        }

        // Interpolate liquidity values
        return {
          ...fromBin,
          bin_id: shiftedBinId,
          liquidity_x: (
            parseFloat(fromBin.liquidity_x) +
            (parseFloat(toBin.liquidity_x) - parseFloat(fromBin.liquidity_x)) *
              progress
          ).toString(),
          liquidity_y: (
            parseFloat(fromBin.liquidity_y) +
            (parseFloat(toBin.liquidity_y) - parseFloat(fromBin.liquidity_y)) *
              progress
          ).toString(),
        };
      });
    }

    // Interpolate reserves
    interpolated.reserve_x = (
      parseFloat(from.reserve_x) +
      (parseFloat(to.reserve_x) - parseFloat(from.reserve_x)) * progress
    ).toString();
    interpolated.reserve_y = (
      parseFloat(from.reserve_y) +
      (parseFloat(to.reserve_y) - parseFloat(from.reserve_y)) * progress
    ).toString();

    return interpolated;
  };

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
      if (transitionIntervalRef.current) {
        clearInterval(transitionIntervalRef.current);
      }
    };
  }, []);

  // Calculate strategy activity when snapshots, liquidity, or strategy config changes
  useEffect(() => {
    if (state.snapshots.length > 0) {
      const activity = calculateStrategyActivity(
        state.snapshots,
        state.liquidity
      );
      setStrategyActivity(activity);

      // Also calculate utilization metrics
      calculateUtilizationMetrics();
    }
  }, [state.snapshots, state.liquidity, strategyConfig, allocatedLiquidity]);

  // Reset metrics to 0 when animation starts
  useEffect(() => {
    if (state.isAnimating && state.currentSnapshotIndex === 0) {
      // Reset utilization metrics to 0 when animation starts
      setStrategyCalculator((prev) => {
        const newCalculator = { ...prev };
        (["spot", "curve", "bidAsk"] as const).forEach((strategy) => {
          newCalculator[strategy] = {
            ...prev[strategy],
            avgUtilizationWhenActive: 0,
            overallEfficiency: 0,
            peakUtilization: 0,
            utilizationStability: 0,
          };
        });
        return newCalculator;
      });
    }
  }, [state.isAnimating]);

  // Calculate progressive utilization metrics when current snapshot index changes
  // Only use progressive metrics when we're actively animating
  useEffect(() => {
    if (state.snapshots.length > 0 && state.currentSnapshotIndex >= 0) {
      if (state.isAnimating) {
        // When animating, use progressive metrics that build up from 0
        calculateProgressiveUtilizationMetrics();
      } else {
        // When not animating, use full metrics calculated from all snapshots
        calculateUtilizationMetrics();
      }
    }
  }, [
    state.currentSnapshotIndex,
    state.isAnimating,
    state.snapshots,
    state.liquidity,
    strategyConfig,
    allocatedLiquidity,
  ]);

  // Note: Removed dynamic recalculation of allocated liquidity
  // Liquidity allocation should remain constant once set at snapshot 0
  // Only the active bin and strategy activity change during animation

  // Update bin range when percentage changes
  useEffect(() => {
    setStrategyConfig((prev) => ({
      ...prev,
      binRange: prev.binRangePercent, // 1% = 1 bin on each side
    }));
  }, [strategyConfig.binRangePercent]);

  // Animation control functions
  const startAnimation = () => {
    if (state.snapshots.length <= 1) return;

    // Calculate fixed bid-ask bins from first snapshot
    const firstSnapshot = state.snapshots[0];
    if (firstSnapshot) {
      const firstActiveBinId = firstSnapshot.active_bin_id;
      // For bid-ask strategy, we want to detect when price moves to the edges
      // So we calculate the side bins of the first active bin
      const bidAskBins = [
        firstActiveBinId - strategyConfig.binRange, // Left side
        firstActiveBinId + strategyConfig.binRange, // Right side
      ];
      setFixedBidAskBins(bidAskBins);
      console.log(
        "Fixed bid-ask bins calculated from first snapshot:",
        bidAskBins
      );
    }

    // Reset strategy calculator when starting animation
    resetStrategyCalculator();

    setState((prev) => ({
      ...prev,
      isAnimating: true,
      previousActiveBinId:
        prev.snapshots[prev.currentSnapshotIndex]?.active_bin_id || null,
    }));

    let currentIndex = state.currentSnapshotIndex;
    let isInSlowMode = false;
    let hasCompletedOneCycle = false;

    const animate = () => {
      const nextIndex = currentIndex + 1;

      // Check if we've completed one full cycle
      if (nextIndex >= state.snapshots.length) {
        if (state.shouldLoop) {
          // Reset to beginning and continue
          currentIndex = 0;
          setState((prev) => ({
            ...prev,
            currentSnapshotIndex: 0,
            previousActiveBinId: prev.snapshots[0]?.active_bin_id || null,
          }));
          return;
        } else {
          // Stop animation after one cycle
          hasCompletedOneCycle = true;
          stopAnimation();
          return;
        }
      }

      const targetIndex = nextIndex;
      const currentSnapshot = state.snapshots[currentIndex];
      const nextSnapshot = state.snapshots[targetIndex];

      // Check if active bin will change in the next snapshot
      const activeBinWillChange =
        currentSnapshot &&
        nextSnapshot &&
        currentSnapshot.active_bin_id !== nextSnapshot.active_bin_id;

      // Debug logging
      if (activeBinWillChange) {
        console.log("🔄 Active bin will change:", {
          from: currentSnapshot.active_bin_id,
          to: nextSnapshot.active_bin_id,
          currentIndex,
          targetIndex,
        });
      }

      if (activeBinWillChange) {
        // Start gradual transition with chart shifting
        const binShift =
          nextSnapshot.active_bin_id - currentSnapshot.active_bin_id;
        console.log("🐌 Starting gradual transition with chart shift:", {
          binShift:
            binShift > 0 ? `+${binShift} (right)` : `${binShift} (left)`,
        });

        setState((prev) => ({
          ...prev,
          isTransitioning: true,
        }));

        setTransitionState({
          isTransitioning: true,
          fromSnapshot: currentSnapshot,
          toSnapshot: nextSnapshot,
          progress: 0,
          binShift: binShift,
          currentInterpolatedSnapshot: currentSnapshot,
        });

        // Clear current interval
        if (animationIntervalRef.current) {
          clearInterval(animationIntervalRef.current);
        }

        // Start gradual transition
        let progress = 0;
        const transitionSteps = 50; // 50 steps for ultra-smooth transition
        const stepDuration = (state.animationSpeed * 12) / transitionSteps; // 12x slower for very smooth transition

        transitionIntervalRef.current = setInterval(() => {
          progress += 1 / transitionSteps;

          if (progress >= 1) {
            // Transition complete
            progress = 1;
            currentIndex = targetIndex;

            setState((prev) => ({
              ...prev,
              currentSnapshotIndex: targetIndex,
              previousActiveBinId: currentSnapshot.active_bin_id,
              isTransitioning: false,
            }));

            setTransitionState({
              isTransitioning: false,
              fromSnapshot: null,
              toSnapshot: null,
              progress: 0,
              binShift: 0,
              currentInterpolatedSnapshot: null,
            });

            // Clear transition interval and resume normal animation
            if (transitionIntervalRef.current) {
              clearInterval(transitionIntervalRef.current);
            }
            animationIntervalRef.current = setInterval(
              animate,
              state.animationSpeed
            );
          } else {
            // Update interpolated snapshot
            const interpolated = interpolateSnapshots(
              currentSnapshot,
              nextSnapshot,
              progress,
              binShift
            );
            setTransitionState((prev) => ({
              ...prev,
              progress,
              currentInterpolatedSnapshot: interpolated,
            }));
          }
        }, stepDuration);
      } else {
        // Normal speed - move to next snapshot
        currentIndex = targetIndex;
        setState((prev) => ({
          ...prev,
          currentSnapshotIndex: targetIndex,
          previousActiveBinId: currentSnapshot?.active_bin_id || null,
          isTransitioning: false,
        }));

        // Update strategy calculator for current snapshot
        const currentSnapshot = state.snapshots[targetIndex];
        if (currentSnapshot) {
          const strategies = determineStrategyIsActive(
            currentSnapshot,
            state.liquidity
          );

          // Update strategy calculator state directly
          if (strategies) {
            setStrategyCalculator((prev) => {
              const newCalculator = { ...prev };

              ["spot", "curve", "bidAsk"].forEach((strategyKey) => {
                const key = strategyKey as keyof typeof strategies;
                const isActive = strategies[key];

                // Increment counter if strategy is active
                const newTotalActive =
                  prev[key].totalActive + (isActive ? 1 : 0);
                const totalSnapshots = state.snapshots.length;
                const newPercentage =
                  totalSnapshots > 0
                    ? (newTotalActive / totalSnapshots) * 100
                    : 0;

                newCalculator[key] = {
                  ...prev[key],
                  active: isActive,
                  totalActive: newTotalActive,
                  percentage: newPercentage,
                  totalSnapshots: totalSnapshots,
                };
              });

              return newCalculator;
            });
          }
        }
      }
    };

    // Set up initial interval
    animationIntervalRef.current = setInterval(animate, state.animationSpeed);
  };

  const stopAnimation = () => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    setState((prev) => ({ ...prev, isAnimating: false }));
  };

  const goToFirstSnapshot = () => {
    stopAnimation();
    setState((prev) => ({ ...prev, currentSnapshotIndex: 0 }));
  };

  const goToLastSnapshot = () => {
    stopAnimation();
    setState((prev) => ({
      ...prev,
      currentSnapshotIndex: Math.max(0, prev.snapshots.length - 1),
    }));
  };

  const goToPreviousSnapshot = () => {
    stopAnimation();
    setState((prev) => ({
      ...prev,
      currentSnapshotIndex: Math.max(0, prev.currentSnapshotIndex - 1),
    }));
  };

  const goToNextSnapshot = () => {
    stopAnimation();
    setState((prev) => ({
      ...prev,
      currentSnapshotIndex: Math.min(
        prev.snapshots.length - 1,
        prev.currentSnapshotIndex + 1
      ),
    }));
  };

  const handleAnimationSpeedChange = (speed: number) => {
    setState((prev) => ({ ...prev, animationSpeed: speed }));

    // If currently animating, restart with new speed
    if (state.isAnimating) {
      stopAnimation();
      setTimeout(() => startAnimation(), 100);
    }
  };

  // Fetch data when component mounts or time period changes
  useEffect(() => {
    const fetchData = async () => {
      setState((prev) => ({ ...prev, dataLoading: true, dataError: null }));

      try {
        // Check data availability first
        const availability = await checkDataAvailability(
          state.timePeriod.start,
          state.timePeriod.end
        );

        if (!availability.hasData) {
          setState((prev) => ({
            ...prev,
            dataLoading: false,
            dataError: `No data available for the selected time period. Found ${availability.count} snapshots.`,
            hasData: false,
            snapshots: [],
          }));
          return;
        }

        // Fetch snapshots for the time period
        const snapshots = await getSnapshotsInRange(
          state.timePeriod.start,
          state.timePeriod.end
        );

        setState((prev) => ({
          ...prev,
          dataLoading: false,
          hasData: true,
          snapshots,
          currentSnapshotIndex: 0, // Reset to first snapshot
        }));

        // Automatically run backtest when data is loaded
        await runBacktestWithData(snapshots);
      } catch (error) {
        console.error("Error fetching data:", error);
        setState((prev) => ({
          ...prev,
          dataLoading: false,
          dataError:
            error instanceof Error ? error.message : "Failed to fetch data",
          hasData: false,
          snapshots: [],
        }));
      }
    };

    fetchData();
  }, [state.timePeriod.start, state.timePeriod.end]);

  const handleTimePeriodChange = (preset: TimePeriod["preset"]) => {
    const end = new Date();
    let start = new Date();
    let label = "";

    switch (preset) {
      case "7d":
        start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        label = "Last 7 Days";
        break;
      case "30d":
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        label = "Last 30 Days";
        break;
      case "90d":
        start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        label = "Last 90 Days";
        break;
      case "custom":
        // TODO: Implement custom date picker
        label = "Custom Range";
        break;
    }

    setState((prev) => ({
      ...prev,
      timePeriod: { start, end, preset, label },
      hasResults: false, // Clear results when period changes
    }));
  };

  const handleLiquidityChange = async (value: number) => {
    setState((prev) => ({
      ...prev,
      liquidity: value,
      hasResults: false, // Clear results when liquidity changes
    }));

    // Automatically run backtest with new liquidity if data is available
    if (state.hasData && state.snapshots.length > 0) {
      await runBacktestWithData(state.snapshots);
    }
  };

  const handleSnapshotChange = (index: number) => {
    setState((prev) => ({
      ...prev,
      currentSnapshotIndex: index,
    }));
  };

  // Internal function to run backtest with provided snapshots
  const runBacktestWithData = async (snapshots: PoolSnapshot[]) => {
    if (snapshots.length === 0) {
      setState((prev) => ({
        ...prev,
        error: "No data available for backtesting.",
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Use real data context for more realistic results
      const firstSnapshot = snapshots[0];
      const lastSnapshot = snapshots[snapshots.length - 1];
      const priceChange = lastSnapshot
        ? ((lastSnapshot.current_price - firstSnapshot.current_price) /
            firstSnapshot.current_price) *
          100
        : 0;

      const mockResults: BacktestResult[] = [
        {
          strategy: "Spot",
          startDate: new Date(firstSnapshot.timestamp),
          endDate: new Date(lastSnapshot.timestamp),
          initialValue: state.liquidity,
          finalValue: state.liquidity * (1 + priceChange * 0.8), // Simulate some strategy performance
          totalReturn: priceChange * 0.8,
          returns: priceChange * 0.8,
          fees: state.liquidity * 0.0024,
          impermanentLoss: -Math.abs(priceChange) * 0.2,
          maxDrawdown: -Math.abs(priceChange) * 0.5,
          sharpeRatio: 1.85,
          trades: [],
          dailyReturns: snapshots
            .slice(0, 7)
            .map((_, i) => (Math.random() - 0.5) * 2),
        },
        {
          strategy: "Curve",
          startDate: new Date(firstSnapshot.timestamp),
          endDate: new Date(lastSnapshot.timestamp),
          initialValue: state.liquidity,
          finalValue: state.liquidity * (1 + priceChange * 0.6),
          totalReturn: priceChange * 0.6,
          returns: priceChange * 0.6,
          fees: state.liquidity * 0.0031,
          impermanentLoss: -Math.abs(priceChange) * 0.1,
          maxDrawdown: -Math.abs(priceChange) * 0.3,
          sharpeRatio: 2.21,
          trades: [],
          dailyReturns: snapshots
            .slice(0, 7)
            .map((_, i) => (Math.random() - 0.3) * 1.5),
        },
        {
          strategy: "Bid-Ask",
          startDate: new Date(firstSnapshot.timestamp),
          endDate: new Date(lastSnapshot.timestamp),
          initialValue: state.liquidity,
          finalValue: state.liquidity * (1 + priceChange * 0.4),
          totalReturn: priceChange * 0.4,
          returns: priceChange * 0.4,
          fees: state.liquidity * 0.0048,
          impermanentLoss: -Math.abs(priceChange) * 0.05,
          maxDrawdown: -Math.abs(priceChange) * 0.15,
          sharpeRatio: 2.87,
          trades: [],
          dailyReturns: snapshots
            .slice(0, 7)
            .map((_, i) => (Math.random() - 0.2) * 1),
        },
      ];

      setState((prev) => ({
        ...prev,
        backtestResults: mockResults,
        loading: false,
        hasResults: true,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to run backtest. Please try again.",
      }));
    }
  };

  const runBacktest = async () => {
    if (!state.hasData || state.snapshots.length === 0) {
      setState((prev) => ({
        ...prev,
        error:
          "No data available for backtesting. Please select a different time period.",
      }));
      return;
    }

    await runBacktestWithData(state.snapshots);
  };

  const clearResults = () => {
    setState((prev) => ({
      ...prev,
      backtestResults: [],
      hasResults: false,
      error: null,
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          DLMM Strategy Backtesting
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Compare all three DLMM strategies against historical SAROS/USDC data.
          See which approach works best for different market conditions.
        </p>
      </div>

      {/* Data Status Display */}
      {state.dataLoading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm">
            Loading snapshot data for the selected time period...
          </p>
        </div>
      )}
      {state.hasData && state.snapshots.length > 0 && !state.loading && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm">
            ✅ Loaded {state.snapshots.length} snapshots and completed backtest
            analysis
          </p>
        </div>
      )}

      {/* Strategy Overview Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {ALL_STRATEGIES.map((strategy) => (
          <div
            key={strategy.name}
            className="bg-white rounded-lg border p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {strategy.name} Strategy
              </h3>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  strategy.riskLevel === "High"
                    ? "bg-red-100 text-red-700"
                    : strategy.riskLevel === "Medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {strategy.riskLevel} Risk
              </span>
            </div>
            <p className="text-gray-600 text-sm">{strategy.description}</p>
          </div>
        ))}
      </div>

      {/* Liquidity Selection */}
      <div className="bg-white rounded-lg border p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-900">
              Select Liquidity Amount
            </h3>
          </div>
          <span className="text-sm font-semibold text-blue-600">
            ${state.liquidity.toLocaleString()} USDC
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={state.liquidity}
              onChange={(e) => handleLiquidityChange(Number(e.target.value))}
              min="100"
              max="100000"
              step="100"
              className="w-24 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-xs text-gray-600">USDC</span>
            <div className="flex gap-1 ml-auto">
              {[1000, 5000, 10000, 25000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleLiquidityChange(amount)}
                  className={`px-2 py-1 text-xs rounded ${
                    state.liquidity === amount
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  ${amount.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <input
            type="range"
            min="100"
            max="50000"
            step="100"
            value={state.liquidity}
            onChange={(e) => handleLiquidityChange(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer 
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 
                          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 
                          [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 
                          [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-sm
                          [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full 
                          [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:cursor-pointer 
                          [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-sm"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((state.liquidity -
                100) /
                (50000 - 100)) *
                100}%, #e5e7eb ${((state.liquidity - 100) / (50000 - 100)) *
                100}%, #e5e7eb 100%)`,
            }}
          />
        </div>
      </div>

      {/* Time Period Selection */}
      <div className="bg-white rounded-lg border p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-900">
              Select Analysis Period
            </h3>
          </div>
          <span className="text-xs text-gray-500">
            {state.timePeriod.start.toLocaleDateString()} -{" "}
            {state.timePeriod.end.toLocaleDateString()}
          </span>
        </div>

        <div className="flex gap-2">
          {DEFAULT_TIME_PERIODS.map((period) => (
            <button
              key={period.preset}
              onClick={() => handleTimePeriodChange(period.preset)}
              disabled={period.preset === "custom"} // Disable custom for now
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                state.timePeriod.preset === period.preset
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } ${
                period.preset === "custom"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {period.label}
              {period.preset === "custom" && (
                <div className="text-[10px] text-gray-400">Soon</div>
              )}
            </button>
          ))}
        </div>
      </div>
      {/* Strategy Configuration */}
      {state.hasData && state.snapshots.length > 0 && (
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ChartLine className="w-4 h-4 text-gray-600" />
              <h3 className="text-lg font-bold text-gray-900">
                Select Strategy Configuration
              </h3>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-xs font-medium text-gray-700">
                Bin Range:
              </label>
              <div className="flex gap-2">
                {[1, 2, 5, 10].map((percent) => (
                  <button
                    key={percent}
                    onClick={() =>
                      setStrategyConfig((prev) => ({
                        ...prev,
                        binRangePercent: percent,
                      }))
                    }
                    className={`px-3 py-1 text-xs rounded ${
                      strategyConfig.binRangePercent === percent
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {percent}% ({percent * 2 + 1} bins)
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Strategy Liquidity Allocation */}
          {allocatedLiquidity && (
            <StrategyLiquidityAllocation
              allocatedLiquidity={allocatedLiquidity}
            />
          )}
        </div>
      )}

      {/* Clear Results Button */}
      {state.hasResults && (
        <div className="text-center mb-8">
          <button
            onClick={clearResults}
            className="text-gray-600 hover:text-gray-800 text-sm underline"
          >
            Clear Results
          </button>
        </div>
      )}

      {state.loading && state.hasData && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Running backtest analysis automatically...
          </p>
        </div>
      )}

      {state.dataError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{state.dataError}</p>
        </div>
      )}

      {state.isTransitioning && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-blue-700 text-sm flex items-center gap-2">
            <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
            Active bin changing - gradual transition in progress
            {transitionState.binShift !== 0 && (
              <span className="ml-2 text-xs bg-blue-200 px-2 py-1 rounded">
                Chart shifting {transitionState.binShift > 0 ? "right" : "left"}{" "}
                by {Math.abs(transitionState.binShift)} bin
                {Math.abs(transitionState.binShift) !== 1 ? "s" : ""}
              </span>
            )}
            <span className="ml-2 text-xs bg-blue-200 px-2 py-1 rounded">
              {Math.round(transitionState.progress * 100)}% complete
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {state.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{state.error}</p>
        </div>
      )}

      {/* Results Section */}
      {state.hasResults && (
        <div className="space-y-6">
          {/* Liquidity Distribution Chart */}
          <div className="space-y-4">
            <div className="space-y-4">
              {/* Header with title and controls */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">
                  Backtesting Results
                </h3>

                {/* Navigation and Play controls */}
                <div className="flex items-center gap-2">
                  {/* Navigation buttons */}
                  <button
                    onClick={goToFirstSnapshot}
                    disabled={state.dataLoading || !state.hasData}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Go to first snapshot"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    onClick={goToPreviousSnapshot}
                    disabled={
                      state.dataLoading ||
                      !state.hasData ||
                      state.currentSnapshotIndex === 0
                    }
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Previous snapshot"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  {/* Play/Pause button */}
                  <button
                    onClick={state.isAnimating ? stopAnimation : startAnimation}
                    disabled={
                      state.dataLoading ||
                      !state.hasData ||
                      state.snapshots.length <= 1
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {state.isAnimating ? (
                      <>
                        <Pause className="w-4 h-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Play
                      </>
                    )}
                  </button>

                  <button
                    onClick={goToNextSnapshot}
                    disabled={
                      state.dataLoading ||
                      !state.hasData ||
                      state.currentSnapshotIndex >= state.snapshots.length - 1
                    }
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next snapshot"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>

                  <button
                    onClick={goToLastSnapshot}
                    disabled={state.dataLoading || !state.hasData}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Go to last snapshot"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar and snapshot selector */}
              <div className="space-y-3">
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>
                      {state.currentSnapshotIndex + 1} /{" "}
                      {state.snapshots.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${((state.currentSnapshotIndex + 1) /
                          state.snapshots.length) *
                          100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Snapshot selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Snapshot:</span>
                  <select
                    value={state.currentSnapshotIndex}
                    onChange={(e) =>
                      handleSnapshotChange(Number(e.target.value))
                    }
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={state.dataLoading || !state.hasData}
                  >
                    {state.snapshots.map((snapshot, index) => (
                      <option key={snapshot.id || index} value={index}>
                        {snapshot.id || `Snapshot ${index + 1}`} -{" "}
                        {new Date(snapshot.timestamp).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Animation Controls */}
            </div>

            {(() => {
              if (state.dataLoading) {
                return (
                  <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-gray-600">Loading snapshot data...</p>
                    </div>
                  </div>
                );
              }

              if (state.dataError) {
                return (
                  <div className="h-64 bg-red-50 rounded flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-red-600 mb-2">Error loading data</p>
                      <p className="text-sm text-red-500">{state.dataError}</p>
                    </div>
                  </div>
                );
              }

              if (!state.hasData || state.snapshots.length === 0) {
                return (
                  <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-gray-600 mb-2">No data available</p>
                      <p className="text-sm text-gray-500">
                        No snapshots found for the selected time period
                      </p>
                    </div>
                  </div>
                );
              }

              const currentSnapshot =
                transitionState.isTransitioning &&
                transitionState.currentInterpolatedSnapshot
                  ? transitionState.currentInterpolatedSnapshot
                  : state.snapshots[state.currentSnapshotIndex];
              if (!currentSnapshot) return null;

              const liquidityData = snapshotToLiquidityDistribution(
                currentSnapshot
              );

              return (
                <div className="space-y-4">
                  {/* Real-time Strategy Performance */}
                  <RealTimeStrategyPerformance
                    strategyCalculator={strategyCalculator}
                    setHoveredTooltip={setHoveredTooltip}
                    hoveredTooltip={hoveredTooltip}
                    currentSnapshotIndex={state.currentSnapshotIndex}
                    totalSnapshots={state.snapshots.length}
                    isAnimating={state.isAnimating}
                  />

                  {/* Liquidity Bar Chart */}
                  <LiquidityBarChart
                    data={liquidityData}
                    snapshotId={currentSnapshot.id || 0}
                    timestamp={currentSnapshot.timestamp}
                    activeBinId={currentSnapshot.active_bin_id}
                    currentPrice={currentSnapshot.current_price}
                    strategyRanges={{
                      spot: spotBins,
                      curve: curveBins,
                      bidAsk: bidAskBins,
                    }}
                    allocatedLiquidity={allocatedLiquidity}
                    strategyCalculator={strategyCalculator}
                    setHoveredTooltip={setHoveredTooltip}
                    hoveredTooltip={hoveredTooltip}
                    onBinClick={(binId) => {
                      console.log("Bin clicked:", binId);
                      // TODO: Add detailed bin analysis
                    }}
                  />
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
