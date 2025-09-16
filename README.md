# DLMM Analytics & Backtesting Tool

A comprehensive analytics and backtesting platform for Dynamic Liquidity Market Maker (DLMM) pools on Solana. This tool provides real-time data collection, historical analysis, and backtesting capabilities for DLMM trading strategies.

## 🚀 Features

### ✅ Currently Implemented

- **Real-time Snapshot Collection**: Automated data collection from DLMM pools every hour
- **Pool Analytics Dashboard**: Live monitoring of pool metrics, reserves, and bin distributions
- **Database Integration**: Supabase-powered data storage with structured schema
- **Market Price Integration**: Real-time price feeds from CoinGecko API
- **Wallet Integration**: Connect and manage Solana wallets
- **Admin Tools**: Database testing and connection validation

### 🔄 Coming Soon

- **Advanced Backtesting Engine**: Historical strategy testing with customizable parameters
- **Strategy Performance Analysis**: Detailed metrics and risk assessment
- **Portfolio Optimization**: Multi-pool strategy backtesting
- **Alert System**: Real-time notifications for market conditions
- **Export Capabilities**: Data export for external analysis

## 🏗️ Architecture

### Data Collection

- **Automated Snapshots**: Hourly collection of pool state, reserves, and bin data
- **Market Context**: Integration with external price feeds for market correlation
- **Rate Limiting**: Intelligent retry logic with exponential backoff
- **Error Handling**: Robust error recovery and logging

### Database Schema

- **Pool Snapshots**: Historical pool state and configuration data
- **Bin Data**: Detailed liquidity distribution across price bins
- **Market Data**: External price feeds and market metrics

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- Supabase account and project
- Solana RPC endpoint

### Environment Setup

Create a `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Solana RPC (optional, uses default if not provided)
NEXT_PUBLIC_SOLANA_RPC_URL=your_rpc_url_here
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

## 📊 Current Capabilities

### Snapshot Collection

- **Pool Metadata**: Active bin, bin step, fees, and configuration
- **Reserve Data**: Token reserves with proper decimal handling
- **Bin Distribution**: Liquidity distribution across price ranges
- **Market Context**: Current market price and deviation analysis

### Data Storage

- **Structured Schema**: Optimized for analytics and backtesting
- **Real-time Updates**: Live data collection and storage
- **Data Validation**: Type-safe data handling and validation

## 🔮 Backtesting Roadmap

The backtesting engine will enable:

1. **Strategy Definition**: Custom trading strategies based on pool metrics
2. **Historical Simulation**: Test strategies against historical data
3. **Performance Metrics**: ROI, Sharpe ratio, max drawdown analysis
4. **Risk Assessment**: Volatility and correlation analysis
5. **Optimization**: Parameter tuning and strategy refinement

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Deploy to Vercel
vercel --prod
```

### Environment Variables

Ensure all required environment variables are set in your deployment platform.

## 📈 Usage

1. **Connect Wallet**: Use the wallet button to connect your Solana wallet
2. **View Analytics**: Monitor real-time pool metrics and historical data
3. **Test Database**: Use admin tools to verify data collection
4. **Collect Snapshots**: Manual snapshot collection for testing

## 🤝 Contributing

This project is actively developed. Contributions are welcome for:

- Backtesting engine development
- Additional analytics features
- UI/UX improvements
- Documentation enhancements

## 📄 License

This project is licensed under the MIT License.
