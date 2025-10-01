"use client";

import React, { useState, useEffect } from "react";
import { PoolSnapshot } from "@/types/snapshots";
import { LiquidityDistribution } from "@/types/dlmmData";
import { snapshotToLiquidityDistribution } from "@/lib/data/realDataService";
import { Play, Pause, Square } from "lucide-react";

interface LiquidityChartProps {
  filteredSnapshots: PoolSnapshot[];
  startingSnapshot: PoolSnapshot | null;
}

const LiquidityChart: React.FC<LiquidityChartProps> = ({
  filteredSnapshots,
  startingSnapshot,
}) => {
  const [liquidityData, setLiquidityData] = useState<LiquidityDistribution[]>(
    []
  );
  const [hoveredBin, setHoveredBin] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentSnapshotIndex, setCurrentSnapshotIndex] = useState(0);
  const [currentSnapshot, setCurrentSnapshot] = useState<PoolSnapshot | null>(
    null
  );
  const [selectedSnapshotIndex, setSelectedSnapshotIndex] = useState(0);

  // Update liquidity data when startingSnapshot changes
  useEffect(() => {
    if (startingSnapshot) {
      const distribution = snapshotToLiquidityDistribution(startingSnapshot);
      setLiquidityData(distribution);
      setCurrentSnapshot(startingSnapshot);
      setCurrentSnapshotIndex(0);
      setSelectedSnapshotIndex(0);
    } else {
      setLiquidityData([]);
      setCurrentSnapshot(null);
      setCurrentSnapshotIndex(0);
      setSelectedSnapshotIndex(0);
    }
  }, [startingSnapshot]);

  // Update selected snapshot index when filteredSnapshots change
  useEffect(() => {
    if (filteredSnapshots.length > 0) {
      setSelectedSnapshotIndex(0);
    }
  }, [filteredSnapshots]);

  // Animation effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isAnimating && filteredSnapshots.length > 1) {
      interval = setInterval(() => {
        setCurrentSnapshotIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % filteredSnapshots.length;
          const nextSnapshot = filteredSnapshots[nextIndex];
          setCurrentSnapshot(nextSnapshot);
          const distribution = snapshotToLiquidityDistribution(nextSnapshot);
          setLiquidityData(distribution);
          return nextIndex;
        });
      }, 200); // 200ms between snapshots for smooth animation
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAnimating, filteredSnapshots]);

  // Animation controls
  const startAnimation = () => {
    if (filteredSnapshots.length > 1) {
      setCurrentSnapshotIndex(selectedSnapshotIndex);
      const selectedSnapshot = filteredSnapshots[selectedSnapshotIndex];
      setCurrentSnapshot(selectedSnapshot);
      const distribution = snapshotToLiquidityDistribution(selectedSnapshot);
      setLiquidityData(distribution);
      setIsAnimating(true);
    }
  };

  const stopAnimation = () => {
    setIsAnimating(false);
  };

  const resetAnimation = () => {
    setIsAnimating(false);
    setCurrentSnapshotIndex(0);
    setSelectedSnapshotIndex(0);
    if (startingSnapshot) {
      setCurrentSnapshot(startingSnapshot);
      const distribution = snapshotToLiquidityDistribution(startingSnapshot);
      setLiquidityData(distribution);
    }
  };

  // Handle slider change
  const handleSliderChange = (value: number) => {
    setSelectedSnapshotIndex(value);
    if (!isAnimating) {
      const selectedSnapshot = filteredSnapshots[value];
      setCurrentSnapshot(selectedSnapshot);
      setCurrentSnapshotIndex(value);
      const distribution = snapshotToLiquidityDistribution(selectedSnapshot);
      setLiquidityData(distribution);
    }
  };

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
        const currentPrice = startingSnapshot?.current_price || 1;
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

  if (!currentSnapshot || liquidityData.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-2">No data available</p>
            <p className="text-sm text-gray-500">
              No snapshots found for the selected time period
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Sort data by bin_id for consistent display
  const sortedData = normalizeTo21Bins(
    liquidityData,
    currentSnapshot.active_bin_id
  );

  // Use linear scale based on actual liquidity values
  const liquidityValues = sortedData.map((d) => d.total_liquidity);
  const maxLiquidity = Math.max(...liquidityValues);
  const minLiquidity = Math.min(...liquidityValues);

  // Scaling factor for Y-axis display
  const scalingFactor = 1.5;
  const displayMaxLiquidity = maxLiquidity * scalingFactor;

  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Liquidity Distribution - Snapshot at{" "}
            {formatTimestamp(currentSnapshot.timestamp)}
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              ID: {currentSnapshot.id}
            </div>
            <div className="text-sm text-gray-500">
              {currentSnapshotIndex + 1} / {filteredSnapshots.length}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Active Bin: {currentSnapshot.active_bin_id}</span>
            <span>
              Current Price: ${formatPrice(currentSnapshot.current_price)}
            </span>
            <span>Max Liquidity: {formatLiquidity(maxLiquidity)}</span>
          </div>

          {/* Animation Controls */}
          <div className="flex items-center gap-4">
            {/* Snapshot Slider */}
            <div className="flex items-center gap-3 min-w-[200px]">
              <span className="text-sm text-gray-600 whitespace-nowrap">
                Start:
              </span>
              <input
                type="range"
                min="0"
                max={Math.max(0, filteredSnapshots.length - 1)}
                value={selectedSnapshotIndex}
                onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                disabled={isAnimating}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(selectedSnapshotIndex /
                    Math.max(1, filteredSnapshots.length - 1)) *
                    100}%, #e5e7eb ${(selectedSnapshotIndex /
                    Math.max(1, filteredSnapshots.length - 1)) *
                    100}%, #e5e7eb 100%)`,
                }}
              />
              <span className="text-sm text-gray-600 whitespace-nowrap">
                {selectedSnapshotIndex + 1}
              </span>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-2">
              {!isAnimating ? (
                <button
                  onClick={startAnimation}
                  disabled={filteredSnapshots.length <= 1}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Play className="w-4 h-4" />
                  Play
                </button>
              ) : (
                <button
                  onClick={stopAnimation}
                  className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              )}
              <button
                onClick={resetAnimation}
                className="flex items-center gap-2 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
              >
                <Square className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
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
      </div>

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
              left: `${((sortedData.findIndex(
                (b) => b.bin_id === currentSnapshot.active_bin_id
              ) +
                0.5) /
                sortedData.length) *
                100}%`,
              width: `${100 / sortedData.length}%`,
              transform: "translateX(-50%)",
            }}
          />

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
          <div className="flex h-full items-end justify-between px-1 gap-1">
            {sortedData.map((bin, index) => {
              // Calculate height as percentage of max liquidity with scaling factor
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

              const isActive = bin.bin_id === currentSnapshot.active_bin_id;
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
            <div className="w-3 h-3 bg-[#c8c8c8] rounded"></div>
            <span className="font-medium text-[#c8c8c8]">Empty</span>
          </div>
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
};

export default LiquidityChart;
