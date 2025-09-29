"use client";

import { useState } from "react";
import { LiquidityAllocation } from "@/lib/backtesting/liquidityAllocation";

interface StrategyLiquidityAllocationProps {
  allocatedLiquidity: {
    spot: LiquidityAllocation[];
    curve: LiquidityAllocation[];
    bidAsk: LiquidityAllocation[];
  };
}

export function StrategyLiquidityAllocation({
  allocatedLiquidity,
}: StrategyLiquidityAllocationProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  return (
    <div className="mt-4  rounded-lg ">
      <div className="space-y-4">
        {/* Spot Strategy Bar */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-red-200 border border-red-400 rounded"></div>
            <span className="font-medium text-gray-700 text-xs">
              Spot Strategy
            </span>
          </div>
          <div className="flex h-8 rounded overflow-hidden border">
            {allocatedLiquidity.spot.map((allocation, index) => {
              const totalSpot = allocatedLiquidity.spot.reduce(
                (sum, a) => sum + a.totalLiquidity,
                0
              );
              const width = (allocation.totalLiquidity / totalSpot) * 100;
              const sarosRatio =
                allocation.liquidityX / allocation.totalLiquidity;
              const usdcRatio =
                allocation.liquidityY / allocation.totalLiquidity;
              return (
                <div
                  key={allocation.binId}
                  className="relative group cursor-pointer transition-all duration-200 border"
                  style={{ width: `${width}%` }}
                  onMouseEnter={(e) => {
                    const tooltipId = `tooltip-spot-${allocation.binId}`;
                    console.log("Hovering segment:", tooltipId);
                    setHoveredSegment(tooltipId);
                    setTooltipPosition({
                      x: e.clientX + 10,
                      y: e.clientY - 10,
                    });
                  }}
                  onMouseMove={(e) => {
                    if (hoveredSegment === `tooltip-spot-${allocation.binId}`) {
                      setTooltipPosition({
                        x: e.clientX + 10,
                        y: e.clientY - 10,
                      });
                    }
                  }}
                  onMouseLeave={() => {
                    console.log("Leaving segment");
                    setHoveredSegment(null);
                    setTooltipPosition(null);
                  }}
                >
                  {/* SAROS (Base Token) - Left side */}
                  <div
                    className="absolute left-0 top-0 h-full group-hover:opacity-90 transition-opacity"
                    style={{
                      width: `${sarosRatio * 100}%`,
                      backgroundColor: "#4A8C8C",
                    }}
                    onMouseEnter={() => {
                      const tooltipId = `tooltip-${allocation.binId}`;
                      console.log("Hovering SAROS segment:", tooltipId);
                      setHoveredSegment(tooltipId);
                    }}
                    onMouseLeave={() => {
                      console.log("Leaving SAROS segment");
                      setHoveredSegment(null);
                    }}
                  />
                  {/* USDC (Quote Token) - Right side */}
                  <div
                    className="absolute right-0 top-0 h-full group-hover:opacity-90 transition-opacity"
                    style={{
                      width: `${usdcRatio * 100}%`,
                      backgroundColor: "#D9A34A",
                    }}
                    onMouseEnter={() => {
                      const tooltipId = `tooltip-${allocation.binId}`;
                      console.log("Hovering USDC segment:", tooltipId);
                      setHoveredSegment(tooltipId);
                    }}
                    onMouseLeave={() => {
                      console.log("Leaving USDC segment");
                      setHoveredSegment(null);
                    }}
                  />
                  {/* Percentage - Always visible */}
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">
                    <div className="text-[11px] font-bold">
                      {((allocation.totalLiquidity / totalSpot) * 100).toFixed(
                        1
                      )}
                      %
                    </div>
                  </div>
                  {/* Hover tooltip popup */}
                  <div
                    id={`tooltip-${allocation.binId}`}
                    className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded-lg p-4 shadow-xl border border-gray-700 min-w-[200px] pointer-events-none z-50 transition-opacity ${
                      hoveredSegment === `tooltip-${allocation.binId}`
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                    style={{
                      display:
                        hoveredSegment === `tooltip-${allocation.binId}`
                          ? "block"
                          : "none",
                    }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-lg">
                          Bin {allocation.binId}
                        </div>
                      </div>
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Curve Strategy Bar */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-yellow-200 border border-yellow-400 rounded"></div>
            <span className="font-medium text-gray-700 text-xs">
              Curve Strategy
            </span>
          </div>
          <div className="flex h-8 rounded overflow-hidden border">
            {allocatedLiquidity.curve.map((allocation, index) => {
              const totalCurve = allocatedLiquidity.curve.reduce(
                (sum, a) => sum + a.totalLiquidity,
                0
              );
              const width = (allocation.totalLiquidity / totalCurve) * 100;
              const sarosRatio =
                allocation.liquidityX / allocation.totalLiquidity;
              const usdcRatio =
                allocation.liquidityY / allocation.totalLiquidity;
              return (
                <div
                  key={allocation.binId}
                  className="relative group cursor-pointer transition-all duration-200 border"
                  style={{ width: `${width}%` }}
                  onMouseEnter={(e) => {
                    const tooltipId = `tooltip-curve-${allocation.binId}`;
                    console.log("Hovering segment:", tooltipId);
                    setHoveredSegment(tooltipId);
                    setTooltipPosition({
                      x: e.clientX + 10,
                      y: e.clientY - 10,
                    });
                  }}
                  onMouseMove={(e) => {
                    if (
                      hoveredSegment === `tooltip-curve-${allocation.binId}`
                    ) {
                      setTooltipPosition({
                        x: e.clientX + 10,
                        y: e.clientY - 10,
                      });
                    }
                  }}
                  onMouseLeave={() => {
                    console.log("Leaving segment");
                    setHoveredSegment(null);
                    setTooltipPosition(null);
                  }}
                >
                  {/* SAROS (Base Token) - Left side */}
                  <div
                    className="absolute left-0 top-0 h-full group-hover:opacity-90 transition-opacity"
                    style={{
                      width: `${sarosRatio * 100}%`,
                      backgroundColor: "#4A8C8C",
                    }}
                    onMouseEnter={() => {
                      const tooltipId = `tooltip-${allocation.binId}`;
                      console.log("Hovering SAROS segment:", tooltipId);
                      setHoveredSegment(tooltipId);
                    }}
                    onMouseLeave={() => {
                      console.log("Leaving SAROS segment");
                      setHoveredSegment(null);
                    }}
                  />
                  {/* USDC (Quote Token) - Right side */}
                  <div
                    className="absolute right-0 top-0 h-full group-hover:opacity-90 transition-opacity"
                    style={{
                      width: `${usdcRatio * 100}%`,
                      backgroundColor: "#D9A34A",
                    }}
                    onMouseEnter={() => {
                      const tooltipId = `tooltip-${allocation.binId}`;
                      console.log("Hovering USDC segment:", tooltipId);
                      setHoveredSegment(tooltipId);
                    }}
                    onMouseLeave={() => {
                      console.log("Leaving USDC segment");
                      setHoveredSegment(null);
                    }}
                  />
                  {/* Percentage - Always visible */}
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">
                    <div className="text-[11px] font-bold">
                      {((allocation.totalLiquidity / totalCurve) * 100).toFixed(
                        1
                      )}
                      %
                    </div>
                  </div>
                  {/* Hover tooltip popup */}
                  <div
                    id={`tooltip-${allocation.binId}`}
                    className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded-lg p-4 shadow-xl border border-gray-700 min-w-[200px] pointer-events-none z-50 transition-opacity ${
                      hoveredSegment === `tooltip-${allocation.binId}`
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                    style={{
                      display:
                        hoveredSegment === `tooltip-${allocation.binId}`
                          ? "block"
                          : "none",
                    }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-lg">
                          Bin {allocation.binId}
                        </div>
                      </div>
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bid-Ask Strategy Bar */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-200 border border-green-400 rounded"></div>
            <span className="font-medium text-gray-700 text-xs">
              Bid-Ask Strategy
            </span>
          </div>
          <div className="flex h-8 rounded overflow-hidden border">
            {allocatedLiquidity.bidAsk.map((allocation, index) => {
              const totalBidAsk = allocatedLiquidity.bidAsk.reduce(
                (sum, a) => sum + a.totalLiquidity,
                0
              );
              const width = (allocation.totalLiquidity / totalBidAsk) * 100;
              const sarosRatio =
                allocation.liquidityX / allocation.totalLiquidity;
              const usdcRatio =
                allocation.liquidityY / allocation.totalLiquidity;
              return (
                <div
                  key={allocation.binId}
                  className="relative group cursor-pointer transition-all duration-200 border"
                  style={{ width: `${width}%` }}
                  onMouseEnter={(e) => {
                    const tooltipId = `tooltip-bidAsk-${allocation.binId}`;
                    console.log("Hovering segment:", tooltipId);
                    setHoveredSegment(tooltipId);
                    setTooltipPosition({
                      x: e.clientX + 10,
                      y: e.clientY - 10,
                    });
                  }}
                  onMouseMove={(e) => {
                    if (
                      hoveredSegment === `tooltip-bidAsk-${allocation.binId}`
                    ) {
                      setTooltipPosition({
                        x: e.clientX + 10,
                        y: e.clientY - 10,
                      });
                    }
                  }}
                  onMouseLeave={() => {
                    console.log("Leaving segment");
                    setHoveredSegment(null);
                    setTooltipPosition(null);
                  }}
                >
                  {/* SAROS (Base Token) - Left side */}
                  <div
                    className="absolute left-0 top-0 h-full group-hover:opacity-90 transition-opacity"
                    style={{
                      width: `${sarosRatio * 100}%`,
                      backgroundColor: "#4A8C8C",
                    }}
                    onMouseEnter={() => {
                      const tooltipId = `tooltip-${allocation.binId}`;
                      console.log("Hovering SAROS segment:", tooltipId);
                      setHoveredSegment(tooltipId);
                    }}
                    onMouseLeave={() => {
                      console.log("Leaving SAROS segment");
                      setHoveredSegment(null);
                    }}
                  />
                  {/* USDC (Quote Token) - Right side */}
                  <div
                    className="absolute right-0 top-0 h-full group-hover:opacity-90 transition-opacity"
                    style={{
                      width: `${usdcRatio * 100}%`,
                      backgroundColor: "#D9A34A",
                    }}
                    onMouseEnter={() => {
                      const tooltipId = `tooltip-${allocation.binId}`;
                      console.log("Hovering USDC segment:", tooltipId);
                      setHoveredSegment(tooltipId);
                    }}
                    onMouseLeave={() => {
                      console.log("Leaving USDC segment");
                      setHoveredSegment(null);
                    }}
                  />
                  {/* Percentage - Always visible */}
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">
                    <div className="text-[11px] font-bold">
                      {(
                        (allocation.totalLiquidity / totalBidAsk) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                  </div>
                  {/* Hover tooltip popup */}
                  <div
                    id={`tooltip-${allocation.binId}`}
                    className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded-lg p-4 shadow-xl border border-gray-700 min-w-[200px] pointer-events-none z-50 transition-opacity ${
                      hoveredSegment === `tooltip-${allocation.binId}`
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                    style={{
                      display:
                        hoveredSegment === `tooltip-${allocation.binId}`
                          ? "block"
                          : "none",
                    }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-lg">
                          Bin {allocation.binId}
                        </div>
                      </div>
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-6 text-xs">
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
        Hover over segments to see detailed allocation
      </div>

      {/* Global Tooltip */}
      {hoveredSegment &&
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
            allocation = allocatedLiquidity?.spot.find(
              (a) => a.binId === parseInt(binId)
            );
            totalStrategyLiquidity =
              allocatedLiquidity?.spot.reduce(
                (sum, a) => sum + a.totalLiquidity,
                0
              ) || 0;
          } else if (strategy === "Curve") {
            allocation = allocatedLiquidity?.curve.find(
              (a) => a.binId === parseInt(binId)
            );
            totalStrategyLiquidity =
              allocatedLiquidity?.curve.reduce(
                (sum, a) => sum + a.totalLiquidity,
                0
              ) || 0;
          } else if (strategy === "Bid-Ask") {
            allocation = allocatedLiquidity?.bidAsk.find(
              (a) => a.binId === parseInt(binId)
            );
            totalStrategyLiquidity =
              allocatedLiquidity?.bidAsk.reduce(
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
                left: tooltipPosition
                  ? Math.min(tooltipPosition.x, window.innerWidth - 270)
                  : 0,
                top: tooltipPosition ? Math.max(tooltipPosition.y, 10) : 0,
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
