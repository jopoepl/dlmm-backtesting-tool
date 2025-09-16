/**
 * Utility functions for token amount calculations
 */

/**
 * Calculate the actual token amount from raw amount using decimals
 * @param rawAmount - The raw amount as a string
 * @param decimals - The number of decimal places
 * @returns The calculated token amount as a number
 */
export const calculateTokenAmount = (
  rawAmount: string,
  decimals: number
): number => {
  const amount = parseFloat(rawAmount);
  return amount / Math.pow(10, decimals);
};

/**
 * Convert token amount back to raw amount using decimals
 * @param tokenAmount - The token amount as a number
 * @param decimals - The number of decimal places
 * @returns The raw amount as a string
 */
export const convertToRawAmount = (
  tokenAmount: number,
  decimals: number
): string => {
  return Math.floor(tokenAmount * Math.pow(10, decimals)).toString();
};

/**
 * Format token amount for display
 * @param amount - The amount to format
 * @param decimals - The number of decimal places to show
 * @returns Formatted string
 */
export const formatTokenAmount = (
  amount: number,
  decimals: number = 6
): string => {
  return amount.toFixed(decimals);
};
