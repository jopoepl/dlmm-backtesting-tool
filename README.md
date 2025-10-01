# DLMM Backtesting Tool

A comprehensive backtesting platform for Dynamic Liquidity Market Maker (DLMM) pools on Solana. This tool enables you to test different liquidity allocation strategies against historical data to optimize your DeFi trading performance.

## 🎯 Overview

This tool captures hourly snapshots of SAROS DLMM pool data and provides a complete backtesting environment to analyze different liquidity allocation strategies. Test your strategies against real market data to find the most profitable configurations.

## 🚀 Key Features

### 📊 Real-time Data Collection

- **Automated Snapshots**: Captures pool state every hour including:
  - Active bin ID and current price
  - Liquidity distribution across bins
  - Pool reserves and configuration
  - Market price data from external APIs

### 🧪 Strategy Backtesting Engine

- **Multiple Strategy Types**:
  - **Spot Strategy**: Equal liquidity allocation across all bins
  - **Curve Strategy**: Gaussian distribution with higher concentration near active bin
  - **Bid-Ask Strategy**: U-shaped distribution focusing on edge bins
- **Configurable Parameters**:
  - Liquidity amount to allocate
  - Bin range percentage (e.g., 2% around current price)
  - Concentration levels (low, medium, high)

### 📈 Comprehensive Analytics

- **Time in Range**: Percentage of time your strategy's bins were active
- **Liquidity Efficiency**: How effectively your allocated liquidity was utilized
- **Fee Earnings**: Calculated using real trading volume data from GeckoTerminal
- **Performance Comparison**: Side-by-side analysis of different strategies

### 🎨 Interactive Dashboard

- **Strategy Configuration**: Visual interface to set up backtesting parameters
- **Allocation Visualization**: Charts showing how liquidity is distributed across bins
- **Results Analysis**: Detailed performance metrics and comparisons
- **Historical Simulation**: Timeline view of how pool liquidity changed over time

## 🏗️ Architecture

### Data Flow

1. **Snapshot Collection**: Hourly automated data capture from DLMM pools
2. **Strategy Configuration**: User defines liquidity allocation parameters
3. **Backtesting Engine**: Simulates strategy performance against historical data
4. **Volume Analysis**: Integrates GeckoTerminal OHLCV data for fee calculations
5. **Results Visualization**: Comprehensive dashboard with charts and tables

### Core Components

#### Strategy Calculations (`backtestingCalculations.ts`)

- **Time in Range**: Measures how often your strategy's bins were active
- **Liquidity Efficiency**: Calculates the percentage of your liquidity that was actually utilized
- **Fee Earnings**:
  - Fetches daily trading volume from GeckoTerminal
  - Proportionally distributes volume to active bins
  - Calculates fees based on your strategy's liquidity share in each bin

#### Data Services

- **Snapshot Service**: Manages pool state data collection and storage
- **Price Service**: Integrates with external price feeds
- **Real Data Service**: Handles live data processing

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- Supabase account and project
- Solana RPC endpoint

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd dlmm-analytics

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Configuration

Create a `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Solana RPC
NEXT_PUBLIC_SOLANA_RPC_URL=your_rpc_url_here
```

### Running the Application

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

## 📊 How to Use

### 1. Configure Your Strategy

- Select the pool you want to backtest
- Choose your liquidity allocation amount
- Set the bin range percentage (how wide around current price)
- Pick concentration level for curve and bid-ask strategies

### 2. Run Backtesting

- Select your time period for analysis
- The tool will simulate your strategy against historical data
- View real-time progress as calculations complete

### 3. Analyze Results

- **Strategy Config Tab**: See how your liquidity is allocated
- **Results Tab**: View detailed performance metrics
- **Comparison Table**: Compare different strategies side-by-side
- **Simulator Tab**: Watch how pool liquidity changed over time

## 📈 Understanding the Metrics

### Time in Range

**Simple Explanation**: This measures what percentage of the time your strategy's bins were the "active" bins (where trades were happening). Higher is better - it means your liquidity was in the right place more often.

### Liquidity Efficiency

**Simple Explanation**: This shows how much of your allocated liquidity was actually being used for trades. If you allocated $1000 but only $200 was actively trading, your efficiency would be 20%.

### Fee Earnings

**Simple Explanation**: This calculates how much you would have earned in trading fees. The tool:

1. Gets real daily trading volume from GeckoTerminal
2. Figures out which bins were active each day
3. Calculates your share of the fees based on how much liquidity you had in those active bins

## 🔮 Future Roadmap

### Phase 1: Multi-Pool Support

- Add support for multiple DLMM pools
- Database storage for snapshots
- Cross-pool strategy analysis

### Phase 2: Enhanced Metrics

- More sophisticated performance indicators
- Risk-adjusted returns
- Drawdown analysis
- Correlation metrics

### Phase 3: Advanced Features

- Real-time swap fee calculation using swap data APIs
- Machine learning strategy optimization
- Portfolio-level backtesting
- Alert system for optimal strategy conditions

## 🤝 Contributing

This is an open-source project! We welcome contributions in:

- **Strategy Development**: New liquidity allocation algorithms
- **Metrics Enhancement**: Additional performance indicators
- **UI/UX Improvements**: Better visualization and user experience
- **Data Integration**: Support for more data sources
- **Documentation**: Help others understand and use the tool

### How to Contribute

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: Report bugs or request features via GitHub Issues
- **Discussions**: Join community discussions for strategy ideas
- **Documentation**: Check the code comments for detailed implementation details

---

**Built with ❤️ for the DeFi community**
