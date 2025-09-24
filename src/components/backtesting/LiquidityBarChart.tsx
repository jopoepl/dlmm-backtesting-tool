"use client";

import { LiquidityDistribution } from "@/types/dlmmData";
import { useState } from "react";
import { RealTimeStrategyPerformance } from "./RealTimeStrategyPerformance";

interface LiquidityBarChartProps {
  data: LiquidityDistribution[];
  snapshotId: number;
  timestamp: number;
  activeBinId: number;
  currentPrice: number;
  onBinClick?: (binId: number) => void;
  strategyRanges?: {
    spot: number[];
    curve: number[];
    bidAsk: number[];
  };
  allocatedLiquidity?: {
    spot: LiquidityAllocation[];
    curve: LiquidityAllocation[];
    bidAsk: LiquidityAllocation[];
  };
  strategyCalculator?: {
    spot: {
      active: boolean;
      percentage: number;
      totalActive: number;
      totalSnapshots: number;
    };
    curve: {
      active: boolean;
      percentage: number;
      totalActive: number;
      totalSnapshots: number;
    };
    bidAsk: {
      active: boolean;
      percentage: number;
      totalActive: number;
      totalSnapshots: number;
    };
  };
  setHoveredTooltip?: (tooltip: string | null) => void;
  hoveredTooltip?: string | null;
}

export function LiquidityBarChart({
  data,
  snapshotId,
  timestamp,
  activeBinId,
  currentPrice,
  onBinClick,
  strategyRanges,
  allocatedLiquidity,
  strategyCalculator,
  setHoveredTooltip,
  hoveredTooltip,
}: LiquidityBarChartProps) {
  const [hoveredBin, setHoveredBin] = useState<number | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // State for toggling strategy overlays
  const [showOverlays, setShowOverlays] = useState<{
    spot: boolean;
    curve: boolean;
    bidAsk: boolean;
  }>({
    spot: true,
    curve: true,
    bidAsk: true,
  });

  // Normalize data to always have exactly 21 bins (10 on each side + active bin)
  const normalizeTo21Bins = (
    data: LiquidityDistribution[],
    activeBinId: number
  ) => {
    const sortedData = [...data].sort((a, b) => a.bin_id - b.bin_id);
    const normalizedData: LiquidityDistribution[] = [];

    // Create a map for quick lookup of existing bins
    const binMap = new Map(sortedData.map((bin) => [bin.bin_id, bin]));

    // Generate exactly 21 bins: activeBinId - 10 to activeBinId + 10
    for (let i = -10; i <= 10; i++) {
      const binId = activeBinId + i;
      const existingBin = binMap.get(binId);

      if (existingBin) {
        // Use existing bin data
        normalizedData.push(existingBin);
      } else {
        // Create empty bin for missing bin IDs
        // Calculate price for this bin (you might need to implement this)
        const price = currentPrice * Math.pow(1.0001, i); // Approximate price calculation

        normalizedData.push({
          bin_id: binId,
          price: price,
          liquidity_x: 0,
          liquidity_y: 0,
          total_liquidity: 0,
          is_active: binId === activeBinId,
        });
      }
    }

    return normalizedData;
  };

  // Sort data by bin_id for consistent display
  const sortedData = normalizeTo21Bins(data, activeBinId);

  // Use linear scale based on actual liquidity values
  const liquidityValues = sortedData.map((d) => d.total_liquidity);
  const maxLiquidity = Math.max(...liquidityValues);
  const minLiquidity = Math.min(...liquidityValues);
  const liquidityRange = maxLiquidity - minLiquidity;

  // Scaling factor for Y-axis display
  const scalingFactor = 1.5;
  const displayMaxLiquidity = maxLiquidity * scalingFactor;

  // Format timestamp for display
  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };
    return date.toLocaleString("en-US", options);
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return price.toFixed(6);
  };

  // Format liquidity for display (values are actual token amounts)
  const formatLiquidity = (liquidity: number) => {
    if (liquidity >= 1000000) {
      return `${(liquidity / 1000000).toFixed(1)}M`;
    } else if (liquidity >= 1000) {
      return `${(liquidity / 1000).toFixed(0)}K`;
    } else {
      return liquidity.toFixed(0);
    }
  };

  // Calculate chart offset to center the active bin
  const getChartOffset = () => {
    const activeIndex = sortedData.findIndex((b) => b.bin_id === activeBinId);
    if (activeIndex === -1) return 0;

    // Calculate the center position of the active bin
    const activeBinCenter = (activeIndex + 0.5) / sortedData.length;

    // Calculate how much to shift to center the active bin
    // We want the active bin to be roughly in the center of the visible area
    const targetCenter = 0.5; // Center of the chart
    const offset = (targetCenter - activeBinCenter) * 100; // Convert to percentage

    // More aggressive centering for smoother movement
    const maxOffset = 60; // Increased to 60% for more dramatic centering
    return Math.max(-maxOffset, Math.min(maxOffset, offset));
  };

  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Liquidity Distribution - Snapshot at {formatTimestamp(timestamp)}
          </h3>
          <div className="text-sm text-gray-500">ID: {snapshotId}</div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Active Bin: {activeBinId}</span>
          <span>Current Price: ${formatPrice(currentPrice)}</span>
          <span>Max Liquidity: {formatLiquidity(maxLiquidity)}</span>
        </div>

        {/* Liquidity Summary */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#298c8c] rounded"></div>
                <span className="text-gray-700">
                  <span className="font-medium">SAROS:</span>{" "}
                  {formatLiquidity(
                    sortedData.reduce((sum, bin) => sum + bin.liquidity_x, 0)
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#f1a226] rounded"></div>
                <span className="text-gray-700">
                  <span className="font-medium">USDC:</span>{" "}
                  {formatLiquidity(
                    sortedData.reduce((sum, bin) => sum + bin.liquidity_y, 0)
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded"></div>
                <span className="text-gray-700">
                  <span className="font-medium">Total:</span>{" "}
                  {formatLiquidity(
                    sortedData.reduce(
                      (sum, bin) => sum + bin.total_liquidity,
                      0
                    )
                  )}
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {sortedData.filter((bin) => bin.total_liquidity > 0).length} bins
              with liquidity
            </div>
          </div>
        </div>

        {/* Strategy Range Legend */}
        {strategyRanges && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-gray-600 font-medium">
                Show Strategy Ranges:
              </span>
              {strategyRanges.spot.length > 0 && (
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOverlays.spot}
                    onChange={(e) =>
                      setShowOverlays((prev) => ({
                        ...prev,
                        spot: e.target.checked,
                      }))
                    }
                    className="w-3 h-3 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <div className="w-3 h-3 bg-red-200 border border-red-400 rounded"></div>
                  <span className="text-gray-700">Spot</span>
                </label>
              )}
              {strategyRanges.curve.length > 0 && (
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOverlays.curve}
                    onChange={(e) =>
                      setShowOverlays((prev) => ({
                        ...prev,
                        curve: e.target.checked,
                      }))
                    }
                    className="w-3 h-3 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                  />
                  <div className="w-3 h-3 bg-yellow-200 border border-yellow-400 rounded"></div>
                  <span className="text-gray-700">Curve</span>
                </label>
              )}
              {strategyRanges.bidAsk.length > 0 && (
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOverlays.bidAsk}
                    onChange={(e) =>
                      setShowOverlays((prev) => ({
                        ...prev,
                        bidAsk: e.target.checked,
                      }))
                    }
                    className="w-3 h-3 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <div className="w-3 h-3 bg-green-200 border border-green-400 rounded"></div>
                  <span className="text-gray-700">Bid-Ask</span>
                </label>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Real-time Strategy Performance */}
      <RealTimeStrategyPerformance
        strategyCalculator={strategyCalculator}
        setHoveredTooltip={setHoveredTooltip}
        hoveredTooltip={hoveredTooltip}
      />

      {/* Chart Container */}
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-64 w-12 flex flex-col justify-between text-xs text-gray-500">
          <span>{formatLiquidity(displayMaxLiquidity)}</span>
          <span>{formatLiquidity(displayMaxLiquidity * 0.75)}</span>
          <span>{formatLiquidity(displayMaxLiquidity * 0.5)}</span>
          <span>{formatLiquidity(displayMaxLiquidity * 0.25)}</span>
          <span>0</span>
        </div>

        {/* Chart area */}
        <div className="ml-12 h-64 border-l border-b border-gray-200 relative overflow-hidden">
          {/* Active bin background highlight */}
          <div
            className="absolute top-0 h-full bg-blue-50 opacity-30 transition-all duration-800 ease-out"
            style={{
              left: `${((sortedData.findIndex((b) => b.bin_id === activeBinId) +
                0.5) /
                sortedData.length) *
                100}%`,
              width: `${100 / sortedData.length}%`,
              transform: "translateX(-50%)",
            }}
          />

          {/* Strategy Range Overlays with Liquidity-Based Gradients */}
          {strategyRanges && allocatedLiquidity && (
            <>
              {/* Spot Strategy Range - Red with Equal Distribution */}
              {showOverlays.spot &&
                strategyRanges.spot.map((binId, index) => {
                  // Find the bin in the sorted data, or create a placeholder if it doesn't exist
                  let binIndex = sortedData.findIndex(
                    (b) => b.bin_id === binId
                  );

                  // If bin doesn't exist in sortedData, calculate its position based on bin ID difference
                  if (binIndex === -1) {
                    const activeBinId = sortedData.find((b) => b.is_active)
                      ?.bin_id;
                    if (activeBinId !== undefined) {
                      const binDiff = binId - activeBinId;
                      binIndex = Math.floor(sortedData.length / 2) + binDiff;
                    }
                  }

                  if (binIndex < 0 || binIndex >= sortedData.length)
                    return null;

                  // Find the allocation for this bin
                  const allocation = allocatedLiquidity.spot.find(
                    (a) => a.binId === binId
                  );
                  const maxAllocation = Math.max(
                    ...allocatedLiquidity.spot.map((a) => a.totalLiquidity)
                  );
                  const heightPercentage = allocation
                    ? Math.max(
                        5,
                        (allocation.totalLiquidity / maxAllocation) * 100
                      )
                    : 5;

                  return (
                    <div
                      key={`spot-${binId}`}
                      className="absolute bottom-0 border-l border-r border-red-400 transition-all duration-800 ease-out"
                      style={{
                        left: `${(binIndex / sortedData.length) * 100}%`,
                        width: `${100 / sortedData.length}%`,
                        height: `${heightPercentage}%`,
                        background: `linear-gradient(to top, 
                          rgba(239, 68, 68, 0.8), 
                          rgba(239, 68, 68, 0.4), 
                          rgba(239, 68, 68, 0.1)
                        )`,
                        borderRadius: "2px 2px 0 0",
                      }}
                    />
                  );
                })}

              {/* Curve Strategy Range - Yellow with Bell Curve Gradient */}
              {showOverlays.curve &&
                strategyRanges.curve.map((binId, index) => {
                  // Find the bin in the sorted data, or create a placeholder if it doesn't exist
                  let binIndex = sortedData.findIndex(
                    (b) => b.bin_id === binId
                  );

                  // If bin doesn't exist in sortedData, calculate its position based on bin ID difference
                  if (binIndex === -1) {
                    const activeBinId = sortedData.find((b) => b.is_active)
                      ?.bin_id;
                    if (activeBinId !== undefined) {
                      const binDiff = binId - activeBinId;
                      binIndex = Math.floor(sortedData.length / 2) + binDiff;
                    }
                  }

                  if (binIndex < 0 || binIndex >= sortedData.length)
                    return null;

                  // Find the allocation for this bin
                  const allocation = allocatedLiquidity.curve.find(
                    (a) => a.binId === binId
                  );
                  const maxAllocation = Math.max(
                    ...allocatedLiquidity.curve.map((a) => a.totalLiquidity)
                  );
                  const heightPercentage = allocation
                    ? Math.max(
                        5,
                        (allocation.totalLiquidity / maxAllocation) * 100
                      )
                    : 5;

                  return (
                    <div
                      key={`curve-${binId}`}
                      className="absolute bottom-0 border-l border-r border-yellow-400 transition-all duration-800 ease-out"
                      style={{
                        left: `${(binIndex / sortedData.length) * 100}%`,
                        width: `${100 / sortedData.length}%`,
                        height: `${heightPercentage}%`,
                        background: `linear-gradient(to top, 
                          rgba(234, 179, 8, 0.8), 
                          rgba(234, 179, 8, 0.4), 
                          rgba(234, 179, 8, 0.1)
                        )`,
                        borderRadius: "2px 2px 0 0",
                      }}
                    />
                  );
                })}

              {/* Bid-Ask Strategy Range - Green with Inverted Bell Curve (U-Shape) */}
              {showOverlays.bidAsk &&
                strategyRanges.bidAsk.map((binId, index) => {
                  // Find the bin in the sorted data, or create a placeholder if it doesn't exist
                  let binIndex = sortedData.findIndex(
                    (b) => b.bin_id === binId
                  );

                  // If bin doesn't exist in sortedData, calculate its position based on bin ID difference
                  if (binIndex === -1) {
                    const activeBinId = sortedData.find((b) => b.is_active)
                      ?.bin_id;
                    if (activeBinId !== undefined) {
                      const binDiff = binId - activeBinId;
                      binIndex = Math.floor(sortedData.length / 2) + binDiff;
                    }
                  }

                  if (binIndex < 0 || binIndex >= sortedData.length)
                    return null;

                  // Find the allocation for this bin
                  const allocation = allocatedLiquidity.bidAsk.find(
                    (a) => a.binId === binId
                  );
                  const maxAllocation = Math.max(
                    ...allocatedLiquidity.bidAsk.map((a) => a.totalLiquidity)
                  );
                  const heightPercentage = allocation
                    ? Math.max(
                        5,
                        (allocation.totalLiquidity / maxAllocation) * 100
                      )
                    : 5;

                  return (
                    <div
                      key={`bidAsk-${binId}`}
                      className="absolute bottom-0 border-l border-r border-green-400 transition-all duration-800 ease-out"
                      style={{
                        left: `${(binIndex / sortedData.length) * 100}%`,
                        width: `${100 / sortedData.length}%`,
                        height: `${heightPercentage}%`,
                        background: `linear-gradient(to top, 
                          rgba(34, 197, 94, 0.8), 
                          rgba(34, 197, 94, 0.4), 
                          rgba(34, 197, 94, 0.1)
                        )`,
                        borderRadius: "2px 2px 0 0",
                      }}
                    />
                  );
                })}
            </>
          )}

          {/* Grid lines */}
          <div className="absolute inset-0">
            {[0.25, 0.5, 0.75, 1].map((ratio, index) => (
              <div
                key={index}
                className="absolute w-full border-t border-gray-100"
                style={{ top: `${(1 - ratio) * 100}%` }}
              />
            ))}
          </div>

          {/* Bars */}
          <div
            className="flex h-full items-end justify-between px-1 gap-1 transition-transform duration-800 ease-out"
            style={{
              transform: `translateX(${getChartOffset()}px)`,
            }}
          >
            {sortedData.map((bin, index) => {
              // Calculate height as percentage of max liquidity with scaling factor
              const scalingFactor = 1.5; // Increase this to make bars smaller
              const scaledMaxLiquidity = maxLiquidity * scalingFactor;
              const heightPercentage =
                scaledMaxLiquidity > 0
                  ? Math.max(
                      (bin.total_liquidity / scaledMaxLiquidity) * 100,
                      bin.total_liquidity > 0 ? 8 : 0
                    )
                  : bin.total_liquidity > 0
                  ? 100
                  : 0;
              const containerHeight = 256; // h-64 = 256px
              const height = (heightPercentage / 100) * containerHeight;

              const isActive = bin.bin_id === activeBinId;
              const isHovered = hoveredBin === bin.bin_id;

              return (
                <div
                  key={bin.bin_id}
                  className="flex flex-col items-center group cursor-pointer"
                  style={{ width: `${100 / sortedData.length}%` }}
                  onMouseEnter={(e) => {
                    setHoveredBin(bin.bin_id);
                    setMousePosition({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => {
                    setHoveredBin(null);
                    setMousePosition(null);
                  }}
                  onMouseMove={(e) => {
                    setMousePosition({ x: e.clientX, y: e.clientY });
                  }}
                  onClick={() => onBinClick?.(bin.bin_id)}
                >
                  {/* Bar with stacked tokens */}
                  <div
                    className={`w-full rounded-t transition-all duration-500 ease-in-out border border-gray-400 overflow-hidden ${
                      isHovered ? "opacity-80" : ""
                    } ${
                      isActive
                        ? "shadow-lg shadow-blue-500/50 ring-2 ring-blue-400"
                        : ""
                    }`}
                    style={{
                      height: `${height}px`,
                      minHeight: height > 0 ? "20px" : "0px",
                      transition:
                        "height 0.5s ease-in-out, transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
                    }}
                  >
                    {bin.total_liquidity > 0 ? (
                      <div className="h-full flex flex-col">
                        {/* SAROS portion (top) */}
                        {bin.liquidity_x > 0 && (
                          <div
                            className={`w-full transition-all duration-500 ease-in-out ${
                              isActive
                                ? "bg-[#0b81a2] border-b-2 border-white"
                                : "bg-[#298c8c]"
                            }`}
                            style={{
                              height: `${(bin.liquidity_x /
                                bin.total_liquidity) *
                                100}%`,
                              minHeight: bin.liquidity_x > 0 ? "2px" : "0px",
                              transition:
                                "height 0.5s ease-in-out, background-color 0.3s ease-in-out",
                            }}
                            title={`SAROS: ${formatLiquidity(bin.liquidity_x)}`}
                          />
                        )}

                        {/* USDC portion (bottom) */}
                        {bin.liquidity_y > 0 && (
                          <div
                            className={`w-full transition-all duration-500 ease-in-out ${
                              isActive
                                ? "bg-[#e67e22] border-t-2 border-white"
                                : "bg-[#f1a226]"
                            }`}
                            style={{
                              height: `${(bin.liquidity_y /
                                bin.total_liquidity) *
                                100}%`,
                              minHeight: bin.liquidity_y > 0 ? "2px" : "0px",
                              transition:
                                "height 0.5s ease-in-out, background-color 0.3s ease-in-out",
                            }}
                            title={`USDC: ${formatLiquidity(bin.liquidity_y)}`}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="h-full bg-[#c8c8c8] transition-all duration-500 ease-in-out" />
                    )}
                  </div>

                  {/* Bin ID label */}
                  <div
                    className={`text-xs mt-1 transform -rotate-45 origin-left transition-all duration-300 ease-in-out ${
                      isActive ? "text-blue-600 font-semibold" : "text-gray-500"
                    }`}
                  >
                    {bin.bin_id.toString().slice(-3)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* X-axis label */}
        <div className="ml-12 mt-2 text-center text-sm text-gray-500">
          Bin ID (Last 3 digits)
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-3">
        <div className="text-center text-sm text-gray-600 mb-2">
          Each bar shows the token composition within that bin
        </div>
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#0b81a2] rounded"></div>
            <span className="font-medium text-[#0b81a2]">Active SAROS</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#e67e22] rounded"></div>
            <span className="font-medium text-[#e67e22]">Active USDC</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#298c8c] rounded"></div>
            <span className="font-medium text-[#298c8c]">
              SAROS (top portion)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#f1a226] rounded"></div>
            <span className="font-medium text-[#f1a226]">
              USDC (bottom portion)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#c8c8c8] rounded"></div>
            <span className="font-medium text-[#c8c8c8]">Empty</span>
          </div>
        </div>

        {/* Example stacked bar */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <span>Example:</span>
          <div className="flex h-4 w-16 border border-gray-300 rounded overflow-hidden">
            <div className="bg-[#298c8c] w-1/3" title="SAROS"></div>
            <div className="bg-[#f1a226] w-2/3" title="USDC"></div>
          </div>
          <span>60% USDC, 40% SAROS</span>
        </div>
      </div>

      {/* Enhanced Tooltip */}
      {hoveredBin && mousePosition && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg p-4 shadow-xl border border-gray-700 min-w-[200px] pointer-events-none"
          style={{
            left: `${mousePosition.x + 10}px`,
            top: `${mousePosition.y - 10}px`,
          }}
        >
          {(() => {
            const bin = sortedData.find((d) => d.bin_id === hoveredBin);
            if (!bin) return null;

            const xPercentage =
              bin.total_liquidity > 0
                ? (bin.liquidity_x / bin.total_liquidity) * 100
                : 0;
            const yPercentage =
              bin.total_liquidity > 0
                ? (bin.liquidity_y / bin.total_liquidity) * 100
                : 0;

            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-lg">Bin {bin.bin_id}</div>
                  {bin.is_active && (
                    <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                      ACTIVE
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-600 pt-2">
                  <div className="text-gray-300 mb-1">Price</div>
                  <div className="font-mono text-sm">
                    ${formatPrice(bin.price)}
                  </div>
                </div>

                <div className="border-t border-gray-600 pt-2">
                  <div className="text-gray-300 mb-2">Token Liquidity</div>

                  {/* X Token (SAROS) */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-[#298c8c] rounded"></div>
                      <span className="text-[#298c8c] font-medium">SAROS</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono">
                        {formatLiquidity(bin.liquidity_x)}
                      </div>
                      <div className="text-gray-400 text-xs">
                        ({xPercentage.toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  {/* Y Token (USDC) */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-[#f1a226] rounded"></div>
                      <span className="text-[#f1a226] font-medium">USDC</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono">
                        {formatLiquidity(bin.liquidity_y)}
                      </div>
                      <div className="text-gray-400 text-xs">
                        ({yPercentage.toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-600 pt-1 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Total Liquidity</span>
                      <div className="font-mono font-semibold">
                        {formatLiquidity(bin.total_liquidity)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liquidity Distribution Bar */}
                {bin.total_liquidity > 0 && (
                  <div className="border-t border-gray-600 pt-2">
                    <div className="text-gray-300 mb-1">Distribution</div>
                    <div className="flex h-2 rounded overflow-hidden">
                      <div
                        className="bg-[#298c8c]"
                        style={{ width: `${xPercentage}%` }}
                        title={`SAROS: ${xPercentage.toFixed(1)}%`}
                      />
                      <div
                        className="bg-[#f1a226]"
                        style={{ width: `${yPercentage}%` }}
                        title={`USDC: ${yPercentage.toFixed(1)}%`}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
