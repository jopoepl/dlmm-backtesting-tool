"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { DLMMPosition } from "@/types/dlmm";
import { DLMMService } from "@/lib/dlmm/client";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

export function PositionsList() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [positions, setPositions] = useState<DLMMPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = async () => {
    if (!publicKey || !connected) return;

    setLoading(true);
    setError(null);

    try {
      const dlmmService = new DLMMService();
      // Note: getUserPositions method is commented out in DLMMService
      // const userPositions = await dlmmService.getUserPositions(publicKey);
      const userPositions: any[] = []; // Placeholder until method is implemented
      setPositions(userPositions);
    } catch (err) {
      setError("Failed to fetch positions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, [publicKey, connected]);

  if (!connected) {
    return (
      <div className="text-center p-8">
        <Wallet className="mx-auto mb-4 w-12 h-12 text-gray-400" />
        <p className="text-gray-600">Connect your wallet to view positions</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center p-8">Loading positions...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  if (positions.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No DLMM positions found</p>
        <p className="text-sm text-gray-400 mt-2">
          Create your first position on Saros to see analytics here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your DLMM Positions</h2>

      {positions.map((position) => (
        <div
          key={position.publicKey}
          className="border rounded-lg p-6 bg-white shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">SAROS/USDC Position</h3>
              <p className="text-sm text-gray-500">
                ID: {position.publicKey.slice(0, 8)}...
                {position.publicKey.slice(-8)}
              </p>
            </div>

            <div className="text-right">
              <div className="flex items-center text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm">Active</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">SAROS Amount</p>
              <p className="font-semibold">
                {parseFloat(position.positionData.totalXAmount) / 1e9}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">USDC Amount</p>
              <p className="font-semibold">
                {parseFloat(position.positionData.totalYAmount) / 1e6}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500">
              Liquidity Shares: {position.liquidityShares}
            </p>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Fees Earned (SAROS)</p>
                <p className="text-green-600 font-medium">
                  {position.feeInfos[0]
                    ? (parseFloat(position.feeInfos[0].feeX) / 1e9).toFixed(3)
                    : "0.000"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Fees Earned (USDC)</p>
                <p className="text-green-600 font-medium">
                  {position.feeInfos[0]
                    ? (parseFloat(position.feeInfos[0].feeY) / 1e6).toFixed(2)
                    : "0.00"}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
