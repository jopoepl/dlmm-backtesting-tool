// Dynamic imports for heavy Solana libraries to reduce initial bundle size
// Wallet functionality temporarily disabled

export const loadWalletAdapters = async () => {
  // Wallet functionality temporarily disabled
  throw new Error("Wallet functionality is temporarily disabled");
  const {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    TorusWalletAdapter,
    LedgerWalletAdapter,
    SolletWalletAdapter,
    SolletExtensionWalletAdapter,
    MathWalletAdapter,
    TokenPocketWalletAdapter,
    Coin98WalletAdapter,
    SlopeWalletAdapter,
    BitpieWalletAdapter,
    BloctoWalletAdapter,
    BitKeepWalletAdapter,
    CloverWalletAdapter,
    SafePalWalletAdapter,
    CoinhubWalletAdapter,
    BitgetWalletAdapter,
    TokenaryWalletAdapter,
    GlowWalletAdapter,
    BackpackWalletAdapter,
    XDEFIWalletAdapter,
    ExodusWalletAdapter,
    TrustWalletAdapter,
    OKXWalletAdapter,
  } = await import("@solana/wallet-adapter-wallets");

  return {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    TorusWalletAdapter,
    LedgerWalletAdapter,
    SolletWalletAdapter,
    SolletExtensionWalletAdapter,
    MathWalletAdapter,
    TokenPocketWalletAdapter,
    Coin98WalletAdapter,
    SlopeWalletAdapter,
    BitpieWalletAdapter,
    BloctoWalletAdapter,
    BitKeepWalletAdapter,
    CloverWalletAdapter,
    SafePalWalletAdapter,
    CoinhubWalletAdapter,
    BitgetWalletAdapter,
    TokenaryWalletAdapter,
    GlowWalletAdapter,
    BackpackWalletAdapter,
    XDEFIWalletAdapter,
    ExodusWalletAdapter,
    TrustWalletAdapter,
    OKXWalletAdapter,
  };
};

export const loadDLMMSDK = async () => {
  const { DLMMService } = await import("@saros-finance/dlmm-sdk");
  return { DLMMService };
};

export const loadSolanaWeb3 = async () => {
  const {
    Connection,
    PublicKey,
    Keypair,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL,
  } = await import("@solana/web3.js");

  return {
    Connection,
    PublicKey,
    Keypair,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL,
  };
};
