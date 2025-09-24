export interface BinData {
  price: number;
  bin_id: number;
  liquidity_x: string;
  liquidity_y: string;
  total_supply: string;
}

export interface DLMMSnapshot {
  id: number;
  timestamp: number;
  created_at: string;
  pool_address: string;
  pool_name: string;
  active_bin_id: number;
  reserve_x: number;
  reserve_y: number;
  bin_step: number;
  base_factor: number;
  protocol_fee: number;
  current_price: number;
  market_price: number;
  price_deviation: number;
  market_volume_24h: number;
  market_change_24h: number;
  bin_data: BinData[];
  reserve_x_decimal: number;
  reserve_y_decimal: number;
}

export interface SwapEvent {
  id: string;
  timestamp: number;
  pool_address: string;
  swap_type: "swapXForY" | "swapYForX";
  amount_in: number;
  amount_out: number;
  price_impact: number;
  fee: number;
  bin_id: number;
  user_address: string;
}

export interface LiquidityDistribution {
  bin_id: number;
  price: number;
  liquidity_x: number;
  liquidity_y: number;
  total_liquidity: number;
  is_active: boolean;
}
