# Three-State Backtesting Architecture

## Overview

A simplified, maintainable architecture for DLMM backtesting using three master states that replace complex nested calculations with clean data flow and pre-computed metrics.

## Architecture

```
Strategy State → Activity State → Analysis State
     ↓              ↓              ↓
  Allocations   Per-Snapshot    Aggregated
   (Static)      Tracking       Metrics
```

## 1. Strategy State (Master Configuration)

**Purpose**: Single source of truth for liquidity allocation across all strategies.

```typescript
interface Strategy {
  spot: LiquidityAllocation[];
  curve: LiquidityAllocation[];
  bidAsk: LiquidityAllocation[];
}

interface LiquidityAllocation {
  binId: number;
  liquidityX: number; // SAROS amount
  liquidityY: number; // USDC amount
  totalLiquidity: number;
  weight: number; // Allocation weight (0-1)
}
```

**Key Benefits**:

- Bin range is implicit (calculated from bin IDs)
- All strategies defined in one place
- Easy to modify via UI controls
- No redundant parameters

## 2. Activity State (Per-Snapshot Tracking)

**Purpose**: Track how each strategy performs in real-time across snapshots.

```typescript
interface StrategyActivity {
  spot: SnapshotActivity[];
  curve: SnapshotActivity[];
  bidAsk: SnapshotActivity[];
}

interface SnapshotActivity {
  snapshotId: string;
  timestamp: number;
  activeBins: number[]; // Which bins are currently active
  liquidityUtilization: BinUtilization[];
  totalLiquidityUsed: number;
  totalLiquidityAllocated: number;
  utilizationPercentage: number;
  feesEarned: number;
  volume: number;
}

interface BinUtilization {
  binId: number;
  allocatedLiquidity: number;
  utilizedLiquidity: number;
  utilizationRate: number; // 0-1
  isActive: boolean;
}
```

**Key Benefits**:

- Real-time performance tracking
- Per-bin utilization details
- Easy to query specific time periods
- Supports incremental updates

## 3. Analysis State (Aggregated Metrics)

**Purpose**: Pre-calculated metrics for fast UI rendering and strategy comparison.

```typescript
interface BacktestingAnalysis {
  spot: StrategyMetrics;
  curve: StrategyMetrics;
  bidAsk: StrategyMetrics;
  comparison: CrossStrategyMetrics;
}

interface StrategyMetrics {
  // Core Performance
  totalReturn: number;
  totalFeesEarned: number;
  totalVolume: number;

  // Liquidity Efficiency
  avgLiquidityUtilization: number;
  avgBinUtilization: number;
  mostActiveBins: { binId: number; utilization: number }[];

  // Risk Metrics
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;

  // Activity Metrics
  activeTimePercentage: number; // % of snapshots with active bins
  winRate: number; // % of profitable snapshots
  avgTradesPerSnapshot: number;

  // Time Series Data
  dailyReturns: number[];
  cumulativeReturns: number[];
  liquidityUtilizationOverTime: number[];
}

interface CrossStrategyMetrics {
  bestPerformingStrategy: string;
  riskAdjustedRanking: string[];
  correlationMatrix: number[][];
  relativePerformance: {
    spot: number;
    curve: number;
    bidAsk: number;
  };
}
```

## Implementation Flow

### 1. Strategy Creation

```typescript
// User changes bin range in UI
const [binRange, setBinRange] = useState(3);

// useEffect- --  recalculates the allocation
useEffect(() => {
  const newStrategy = {
    spot: allocateSpotLiquidity({ binRange, activeBinId, totalLiquidity }),
    curve: allocateCurveLiquidity({ binRange, activeBinId, totalLiquidity }),
    bidAsk: allocateBidAskLiquidity({ binRange, activeBinId, totalLiquidity }),
  };
  setStrategy(newStrategy);
}, [binRange, activeBinId, totalLiquidity]);
```

### 2. Activity Tracking

```typescript
// For each snapshot, update activity state
const updateActivity = (snapshot: Snapshot) => {
  const spotActivity = calculateSpotActivity(strategy.spot, snapshot);
  const curveActivity = calculateCurveActivity(strategy.curve, snapshot);
  const bidAskActivity = calculateBidAskActivity(strategy.bidAsk, snapshot);

  setActivity((prev) => ({
    spot: [...prev.spot, spotActivity],
    curve: [...prev.curve, curveActivity],
    bidAsk: [...prev.bidAsk, bidAskActivity],
  }));
};
```

### 3. Analysis Calculation

```typescript
// Calculate metrics from activity data
const calculateAnalysis = (activity: StrategyActivity) => {
  return {
    spot: calculateStrategyMetrics(activity.spot),
    curve: calculateStrategyMetrics(activity.curve),
    bidAsk: calculateStrategyMetrics(activity.bidAsk),
    comparison: calculateCrossStrategyMetrics(activity),
  };
};
```

## Key Metrics Calculations

### From Activity State:

- **Liquidity Utilization**: `utilizedLiquidity / allocatedLiquidity`
- **Active Time**: `snapshotsWithActiveBins / totalSnapshots`
- **Fees Earned**: Sum of `feesEarned` across all snapshots
- **Volume**: Sum of `volume` across all snapshots

### From Analysis State:

- **Total Return**: `(finalValue - initialValue) / initialValue`
- **Sharpe Ratio**: `avgReturn / stdDevReturn`
- **Max Drawdown**: Maximum peak-to-trough decline
- **Win Rate**: `profitableSnapshots / totalSnapshots`

## Benefits Over Current System

1. **Performance**: Pre-calculated metrics = instant UI updates
2. **Maintainability**: Clear separation of concerns
3. **Flexibility**: Easy to add new metrics or strategies
4. **Memory Efficient**: Only store what's needed
5. **Type Safety**: Strong typing throughout
6. **Testing**: Each state can be tested independently

## Data Flow Example

```
User changes binRange (3 → 5)
    ↓
Strategy State updates (new allocations)
    ↓
Activity State recalculates (new bin coverage)
    ↓
Analysis State updates (new performance metrics)
    ↓
UI re-renders with new data
```

## File Structure

```
src/
├── types/
│   ├── strategy.ts          # Strategy interfaces
│   ├── activity.ts          # Activity interfaces
│   └── analysis.ts          # Analysis interfaces
├── hooks/
│   ├── useStrategy.ts       # Strategy state management
│   ├── useActivity.ts       # Activity tracking
│   └── useAnalysis.ts       # Analysis calculations
└── lib/
    ├── strategy/
    │   ├── allocation.ts    # Liquidity allocation logic
    │   └── calculator.ts    # Strategy calculations
    ├── activity/
    │   └── tracker.ts       # Activity tracking logic
    └── analysis/
        └── metrics.ts       # Metrics calculations
```

This architecture replaces complex nested calculations with clean, maintainable state management and pre-computed metrics for optimal performance.
