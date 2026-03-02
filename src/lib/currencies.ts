// Shared currency configuration for multi-currency support

export const CURRENCIES = ['PNGWIN', 'ETH', 'BTC', 'SOL', 'TON', 'XRP', 'YAUC'] as const;
export type Currency = typeof CURRENCIES[number];

export interface CurrencyConfig {
  symbol: string;
  icon: string;
  color: string;       // tailwind text class
  bgColor: string;     // tailwind bg class
  borderColor: string; // tailwind border class
  hex: string;         // raw hex for charts etc.
  decimals: number;    // display precision
}

export const CURRENCY_CONFIG: Record<Currency, CurrencyConfig> = {
  PNGWIN: {
    symbol: 'PNGWIN',
    icon: '🐧',
    color: 'text-ice',
    bgColor: 'bg-ice/10',
    borderColor: 'border-ice/30',
    hex: '#00D4FF',
    decimals: 0,
  },
  ETH: {
    symbol: 'ETH',
    icon: '♦',
    color: 'text-pngwin-purple',
    bgColor: 'bg-pngwin-purple/10',
    borderColor: 'border-pngwin-purple/30',
    hex: '#627EEA',
    decimals: 3,
  },
  BTC: {
    symbol: 'BTC',
    icon: '₿',
    color: 'text-pngwin-orange',
    bgColor: 'bg-pngwin-orange/10',
    borderColor: 'border-pngwin-orange/30',
    hex: '#F7931A',
    decimals: 3,
  },
  SOL: {
    symbol: 'SOL',
    icon: '◎',
    color: 'text-pngwin-green',
    bgColor: 'bg-pngwin-green/10',
    borderColor: 'border-pngwin-green/30',
    hex: '#14F195',
    decimals: 3,
  },
  TON: {
    symbol: 'TON',
    icon: '💎',
    color: 'text-ice',
    bgColor: 'bg-ice/10',
    borderColor: 'border-ice/30',
    hex: '#0098EA',
    decimals: 0,
  },
  XRP: {
    symbol: 'XRP',
    icon: '✕',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    borderColor: 'border-border',
    hex: '#23292F',
    decimals: 0,
  },
  YAUC: {
    symbol: 'YAUC',
    icon: '🎟',
    color: 'text-pngwin-purple',
    bgColor: 'bg-pngwin-purple/10',
    borderColor: 'border-pngwin-purple/30',
    hex: '#9C27B0',
    decimals: 0,
  },
};

export const getCurrencyConfig = (currency: string): CurrencyConfig =>
  CURRENCY_CONFIG[currency as Currency] ?? CURRENCY_CONFIG.PNGWIN;

export const formatCurrencyAmount = (amount: number, currency: string): string => {
  const config = getCurrencyConfig(currency);
  if (config.decimals > 0) {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    });
  }
  return amount.toLocaleString(undefined, { maximumFractionDigits: 0 });
};
