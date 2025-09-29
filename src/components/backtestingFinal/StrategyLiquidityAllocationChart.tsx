"use client";

import { useState } from "react";
import { LiquidityAllocation, Strategy } from "@/types/strategy";
import { PoolSnapshot } from "@/types/snapshots";

interface StrategyLiquidityAllocationProps {
  strategy: Strategy;
  snapshot: PoolSnapshot;
}

export function StrategyLiquidityAllocationChart({
  strategy,
  snapshot,
}: StrategyLiquidityAllocationProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Use the passed strategy state directly
  const dataToRender = strategy;

  return (
    <div className="mt-4 rounded-lg">
      {/* Three miniature vertical bar charts side by side */}
      <div className="grid grid-cols-3 gap-6">
        {/* Spot Strategy Chart */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-red-200 border border-red-400 rounded"></div>
            <span className="font-medium text-gray-700 text-sm">
              Spot Strategy
            </span>
          </div>
          <div className="h-32 border rounded p-2 bg-gray-50 overflow-x-auto">
            <div className="flex items-end justify-center gap-1 h-full min-w-max">
              {dataToRender.spot.length > 0 ? (
                dataToRender.spot.map((allocation) => {
                  const maxLiquidity = Math.max(
                    ...dataToRender.spot.map((a) => a.totalLiquidity)
                  );
                  const height =
                    (allocation.totalLiquidity / maxLiquidity) * 100;
                  const sarosRatio =
                    allocation.liquidityX / allocation.totalLiquidity;
                  const usdcRatio =
                    allocation.liquidityY / allocation.totalLiquidity;

                  const isActiveBin =
                    allocation.binId === snapshot.active_bin_id;

                  return (
                    <div
                      key={allocation.binId}
                      className={`relative group cursor-pointer transition-all duration-200 border rounded-sm min-w-[20px] flex flex-col ${
                        isActiveBin
                          ? "border-green-400 border-2"
                          : "border-gray-200"
                      }`}
                      style={{ height: `${height}%` }}
                      onMouseEnter={(e) => {
                        const tooltipId = `tooltip-spot-${allocation.binId}`;
                        setHoveredSegment(tooltipId);
                        setTooltipPosition({
                          x: e.clientX + 10,
                          y: e.clientY - 10,
                        });
                      }}
                      onMouseLeave={() => {
                        setHoveredSegment(null);
                        setTooltipPosition(null);
                      }}
                    >
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-1000 text-[9px] font-bold text-black  -rotate-90">
                        {allocation.binId.toString().slice(-4)}
                      </div>{" "}
                      {/* SAROS (Base Token) - Bottom part */}
                      <div
                        className="w-full group-hover:opacity-90 transition-opacity rounded-t-sm relative"
                        style={{
                          height: `${sarosRatio * 100}%`,
                          backgroundColor: "#4A8C8C",
                        }}
                      >
                        {/* Bin ID - Rotated vertically inside the bar at bottom */}
                      </div>
                      {/* USDC (Quote Token) - Top part */}
                      <div
                        className="w-full group-hover:opacity-90 transition-opacity rounded-b-sm"
                        style={{
                          height: `${usdcRatio * 100}%`,
                          backgroundColor: "#D9A34A",
                        }}
                      />
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  No data
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Curve Strategy Chart */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-yellow-200 border border-yellow-400 rounded"></div>
            <span className="font-medium text-gray-700 text-sm">
              Curve Strategy
            </span>
          </div>
          <div className="h-32 border rounded p-2 bg-gray-50 overflow-x-auto">
            <div className="flex items-end justify-center gap-1 h-full min-w-max">
              {dataToRender.curve.length > 0 ? (
                dataToRender.curve.map((allocation) => {
                  const maxLiquidity = Math.max(
                    ...dataToRender.curve.map((a) => a.totalLiquidity)
                  );
                  const height =
                    (allocation.totalLiquidity / maxLiquidity) * 100;
                  const sarosRatio =
                    allocation.liquidityX / allocation.totalLiquidity;
                  const usdcRatio =
                    allocation.liquidityY / allocation.totalLiquidity;

                  const isActiveBin =
                    allocation.binId === snapshot.active_bin_id;

                  return (
                    <div
                      key={allocation.binId}
                      className={`relative group cursor-pointer transition-all duration-200 border rounded-sm min-w-[20px] flex flex-col ${
                        isActiveBin
                          ? "border-green-400 border-2"
                          : "border-gray-200"
                      }`}
                      style={{ height: `${height}%` }}
                      onMouseEnter={(e) => {
                        const tooltipId = `tooltip-curve-${allocation.binId}`;
                        setHoveredSegment(tooltipId);
                        setTooltipPosition({
                          x: e.clientX + 10,
                          y: e.clientY - 10,
                        });
                      }}
                      onMouseLeave={() => {
                        setHoveredSegment(null);
                        setTooltipPosition(null);
                      }}
                    >
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-1000 text-[9px] font-bold text-black  -rotate-90">
                        {allocation.binId.toString().slice(-4)}
                      </div>{" "}
                      {/* SAROS (Base Token) - Bottom part */}
                      <div
                        className="w-full group-hover:opacity-90 transition-opacity rounded-t-sm relative"
                        style={{
                          height: `${sarosRatio * 100}%`,
                          backgroundColor: "#4A8C8C",
                        }}
                      ></div>
                      {/* USDC (Quote Token) - Top part */}
                      <div
                        className="w-full group-hover:opacity-90 transition-opacity rounded-b-sm"
                        style={{
                          height: `${usdcRatio * 100}%`,
                          backgroundColor: "#D9A34A",
                        }}
                      />
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  No data
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bid-Ask Strategy Chart */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-green-200 border border-green-400 rounded"></div>
            <span className="font-medium text-gray-700 text-sm">
              Bid-Ask Strategy
            </span>
          </div>
          <div className="h-32 border rounded p-2 bg-gray-50 overflow-x-auto">
            <div className="flex items-end justify-center gap-1 h-full min-w-max">
              {dataToRender.bidAsk.length > 0 ? (
                dataToRender.bidAsk.map((allocation) => {
                  const maxLiquidity = Math.max(
                    ...dataToRender.bidAsk.map((a) => a.totalLiquidity)
                  );
                  const height =
                    (allocation.totalLiquidity / maxLiquidity) * 100;
                  const sarosRatio =
                    allocation.liquidityX / allocation.totalLiquidity;
                  const usdcRatio =
                    allocation.liquidityY / allocation.totalLiquidity;

                  const isActiveBin =
                    allocation.binId === snapshot.active_bin_id;

                  return (
                    <div
                      key={allocation.binId}
                      className={`relative group cursor-pointer transition-all duration-200 border rounded-sm min-w-[20px] flex flex-col ${
                        isActiveBin
                          ? "border-green-400 border-2"
                          : "border-gray-200"
                      }`}
                      style={{ height: `${height}%` }}
                      onMouseEnter={(e) => {
                        const tooltipId = `tooltip-bidAsk-${allocation.binId}`;
                        setHoveredSegment(tooltipId);
                        setTooltipPosition({
                          x: e.clientX + 10,
                          y: e.clientY - 10,
                        });
                      }}
                      onMouseLeave={() => {
                        setHoveredSegment(null);
                        setTooltipPosition(null);
                      }}
                    >
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-1000 text-[9px] font-bold text-black  -rotate-90">
                        {allocation.binId.toString().slice(-4)}
                      </div>{" "}
                      {/* SAROS (Base Token) - Bottom part */}
                      <div
                        className="w-full group-hover:opacity-90 transition-opacity rounded-t-sm relative"
                        style={{
                          height: `${sarosRatio * 100}%`,
                          backgroundColor: "#4A8C8C",
                        }}
                      ></div>
                      {/* USDC (Quote Token) - Top part */}
                      <div
                        className="w-full group-hover:opacity-90 transition-opacity rounded-b-sm"
                        style={{
                          height: `${usdcRatio * 100}%`,
                          backgroundColor: "#D9A34A",
                        }}
                      />
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  No data
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: "#4A8C8C" }}
          ></div>
          <span className="text-gray-600">SAROS (Base Token)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: "#D9A34A" }}
          ></div>
          <span className="text-gray-600">USDC (Quote Token)</span>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-600 text-center">
        Hover over bars to see detailed allocation. Each bar represents a bin.
      </div>

      {/* Global Tooltip */}
      {hoveredSegment &&
        tooltipPosition &&
        (() => {
          const binId = hoveredSegment.replace(
            /tooltip-(spot|curve|bidAsk)-/,
            ""
          );
          const strategy = hoveredSegment.includes("spot")
            ? "Spot"
            : hoveredSegment.includes("curve")
            ? "Curve"
            : hoveredSegment.includes("bidAsk")
            ? "Bid-Ask"
            : "Unknown";

          // Find the allocation data for this bin
          let allocation = null;
          let totalStrategyLiquidity = 0;
          let percentage = 0;

          if (strategy === "Spot") {
            allocation = dataToRender?.spot.find(
              (a) => a.binId === parseInt(binId)
            );
            totalStrategyLiquidity =
              dataToRender?.spot.reduce(
                (sum, a) => sum + a.totalLiquidity,
                0
              ) || 0;
          } else if (strategy === "Curve") {
            allocation = dataToRender?.curve.find(
              (a) => a.binId === parseInt(binId)
            );
            totalStrategyLiquidity =
              dataToRender?.curve.reduce(
                (sum, a) => sum + a.totalLiquidity,
                0
              ) || 0;
          } else if (strategy === "Bid-Ask") {
            allocation = dataToRender?.bidAsk.find(
              (a) => a.binId === parseInt(binId)
            );
            totalStrategyLiquidity =
              dataToRender?.bidAsk.reduce(
                (sum, a) => sum + a.totalLiquidity,
                0
              ) || 0;
          }

          // Calculate percentage of total strategy liquidity
          if (allocation && totalStrategyLiquidity > 0) {
            percentage =
              (allocation.totalLiquidity / totalStrategyLiquidity) * 100;
          }

          return (
            <div
              className="fixed bg-gray-900 text-white text-xs rounded-lg p-4 shadow-xl border border-gray-700 min-w-[250px] z-[9999]"
              style={{
                left: Math.min(tooltipPosition.x, window.innerWidth - 270),
                top: Math.max(tooltipPosition.y, 10),
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-lg">Bin {binId}</div>
                  <div className="text-sm text-gray-400">
                    {strategy} Strategy
                  </div>
                </div>
                {allocation && (
                  <div className="text-sm text-blue-300 font-medium">
                    {percentage.toFixed(1)}% of total {strategy} liquidity
                  </div>
                )}
                {allocation && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">SAROS:</span>
                      <span className="text-white font-medium">
                        {allocation.liquidityX.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">USDC:</span>
                      <span className="text-white font-medium">
                        {allocation.liquidityY.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center font-bold border-t border-gray-600 pt-2 mt-2">
                      <span className="text-gray-300">Total:</span>
                      <span className="text-white">
                        {allocation.totalLiquidity.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
    </div>
  );
}

export default StrategyLiquidityAllocationChart;
