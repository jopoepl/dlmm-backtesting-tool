"use client";
// import {
//   ConnectionProvider,
//   WalletProvider,
// } from "@solana/wallet-adapter-react";
// import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
// import { clusterApiUrl } from "@solana/web3.js";
import { useMemo, useState, useEffect } from "react";
// import { loadWalletAdapters } from "@/lib/wallet/dynamicImports";

export function WalletContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Wallet functionality temporarily disabled
  // const network = useMemo(() => clusterApiUrl("mainnet-beta"), []);
  // const [wallets, setWallets] = useState<any[]>([]);
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const loadWallets = async () => {
  //     try {
  //       const walletAdapters = await loadWalletAdapters();
  //       const walletInstances = [
  //         new walletAdapters.PhantomWalletAdapter(),
  //         new walletAdapters.SolflareWalletAdapter(),
  //       ];
  //       setWallets(walletInstances);
  //     } catch (error) {
  //       console.error("Failed to load wallet adapters:", error);
  //       // Fallback to empty array if loading fails
  //       setWallets([]);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   loadWallets();
  // }, []);

  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center h-64">
  //       <div className="text-lg">Loading wallet providers...</div>
  //     </div>
  //   );
  // }

  // return (
  //   <ConnectionProvider endpoint={network}>
  //     <WalletProvider wallets={wallets} autoConnect>
  //       <WalletModalProvider>{children}</WalletModalProvider>
  //     </WalletProvider>
  //   </ConnectionProvider>
  // );

  // Simplified version - just return children without wallet functionality
  return <>{children}</>;
}
