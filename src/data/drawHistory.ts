export interface DrawPrize {
  prizeNumber: number;
  prizePercent: number;
  targetValue: string;
  winner: string | null;
  winAmount: number;
  distance?: string;
}

export interface WeeklyDraw {
  week: number;
  date: string;
  prizePool: number;
  participants: number;
  totalBids: number;
  uniqueBids: number;
  burnedValues: number;
  totalValues: number;
  draws: DrawPrize[];
  totalDistributed: number;
  totalRolled: number;
  tokensBurned: number;
  socialBonuses: number;
  jackpotFeed: number;
  platformRevenue: number;
  burnHeatmap: number[]; // 10 zones (0-9, 10-19, ..., 90-99) burn percentages
  status: 'completed' | 'live' | 'upcoming';
}

export interface CompletedAuction {
  id: string;
  title: string;
  type: 'live' | 'timed' | 'blind' | 'free' | 'jackpot';
  date: string;
  winner: string;
  winningBid: string;
  prizeWon: number;
  totalBids: number;
  players: number;
  uniqueBids: number;
  burnedBids: number;
}

export const DRAW_HISTORY: WeeklyDraw[] = [
  {
    week: 4,
    date: 'Saturday Feb 22, 2026',
    prizePool: 125000,
    participants: 0,
    totalBids: 234,
    uniqueBids: 145,
    burnedValues: 89,
    totalValues: 9999,
    draws: [],
    totalDistributed: 0,
    totalRolled: 0,
    tokensBurned: 0,
    socialBonuses: 0,
    jackpotFeed: 0,
    platformRevenue: 0,
    burnHeatmap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    status: 'upcoming',
  },
  {
    week: 3,
    date: 'Saturday Feb 15, 2026',
    prizePool: 85000,
    participants: 342,
    totalBids: 2847,
    uniqueBids: 1203,
    burnedValues: 847,
    totalValues: 9999,
    draws: [
      { prizeNumber: 1, prizePercent: 50, targetValue: '47.23', winner: '@DiamondHands', winAmount: 42500, distance: 'Exact match!' },
      { prizeNumber: 2, prizePercent: 25, targetValue: '82.91', winner: null, winAmount: 0 },
      { prizeNumber: 3, prizePercent: 12, targetValue: '15.44', winner: '@MoonShot', winAmount: 10200, distance: 'Distance: 0.03' },
      { prizeNumber: 4, prizePercent: 8, targetValue: '63.17', winner: '@CryptoKing', winAmount: 6800, distance: 'Distance: 0.03' },
      { prizeNumber: 5, prizePercent: 5, targetValue: '29.55', winner: null, winAmount: 0 },
    ],
    totalDistributed: 59500,
    totalRolled: 25500,
    tokensBurned: 12750,
    socialBonuses: 4250,
    jackpotFeed: 8500,
    platformRevenue: 12750,
    burnHeatmap: [12, 24, 18, 14, 31, 22, 16, 11, 8, 6],
    status: 'completed',
  },
  {
    week: 2,
    date: 'Saturday Feb 8, 2026',
    prizePool: 62000,
    participants: 278,
    totalBids: 2103,
    uniqueBids: 980,
    burnedValues: 612,
    totalValues: 9999,
    draws: [
      { prizeNumber: 1, prizePercent: 50, targetValue: '33.88', winner: '@AlphaWolf', winAmount: 31000, distance: 'Distance: 0.05' },
      { prizeNumber: 2, prizePercent: 25, targetValue: '71.02', winner: null, winAmount: 0 },
      { prizeNumber: 3, prizePercent: 12, targetValue: '55.67', winner: null, winAmount: 0 },
      { prizeNumber: 4, prizePercent: 8, targetValue: '08.44', winner: '@NordicBid', winAmount: 4960, distance: 'Distance: 0.01' },
      { prizeNumber: 5, prizePercent: 5, targetValue: '91.23', winner: '@WhaleAlert', winAmount: 3100, distance: 'Exact match!' },
    ],
    totalDistributed: 39060,
    totalRolled: 22940,
    tokensBurned: 9300,
    socialBonuses: 3100,
    jackpotFeed: 6200,
    platformRevenue: 9300,
    burnHeatmap: [8, 15, 20, 25, 18, 22, 12, 10, 14, 9],
    status: 'completed',
  },
  {
    week: 1,
    date: 'Saturday Feb 1, 2026',
    prizePool: 25000,
    participants: 156,
    totalBids: 987,
    uniqueBids: 445,
    burnedValues: 312,
    totalValues: 9999,
    draws: [
      { prizeNumber: 1, prizePercent: 50, targetValue: '50.00', winner: null, winAmount: 0 },
      { prizeNumber: 2, prizePercent: 25, targetValue: '22.22', winner: null, winAmount: 0 },
      { prizeNumber: 3, prizePercent: 12, targetValue: '77.77', winner: null, winAmount: 0 },
      { prizeNumber: 4, prizePercent: 8, targetValue: '14.89', winner: '@SatoshiFan', winAmount: 2000, distance: 'Distance: 0.02' },
      { prizeNumber: 5, prizePercent: 5, targetValue: '66.33', winner: '@DeFiDegen', winAmount: 1250, distance: 'Distance: 0.08' },
    ],
    totalDistributed: 3250,
    totalRolled: 21750,
    tokensBurned: 3750,
    socialBonuses: 1250,
    jackpotFeed: 2500,
    platformRevenue: 3750,
    burnHeatmap: [5, 10, 15, 8, 12, 28, 20, 30, 6, 4],
    status: 'completed',
  },
];

export const COMPLETED_AUCTIONS: CompletedAuction[] = [
  { id: 'hist-1', title: 'Arctic Rush #46', type: 'live', date: 'Feb 18, 2026', winner: '@ArcticFox', winningBid: '87.31', prizeWon: 12800, totalBids: 112, players: 45, uniqueBids: 67, burnedBids: 45 },
  { id: 'hist-2', title: 'Quick Freeze 15m #22', type: 'timed', date: 'Feb 17, 2026', winner: '@IceQueen', winningBid: '93.44', prizeWon: 4200, totalBids: 78, players: 32, uniqueBids: 52, burnedBids: 26 },
  { id: 'hist-3', title: 'Shadow Auction #7', type: 'blind', date: 'Feb 16, 2026', winner: '@GoldPenguin', winningBid: '71.09', prizeWon: 9100, totalBids: 95, players: 38, uniqueBids: 58, burnedBids: 37 },
  { id: 'hist-4', title: 'Welcome Freeroll #5', type: 'free', date: 'Feb 15, 2026', winner: '@NordicBid', winningBid: '45.67', prizeWon: 500, totalBids: 34, players: 28, uniqueBids: 30, burnedBids: 4 },
  { id: 'hist-5', title: 'Arctic Rush #45', type: 'live', date: 'Feb 14, 2026', winner: '@AlphaWolf', winningBid: '99.12', prizeWon: 18400, totalBids: 189, players: 67, uniqueBids: 102, burnedBids: 87 },
  { id: 'hist-6', title: 'MEGA JACKPOT HUBA #3', type: 'jackpot', date: 'Feb 12, 2026', winner: '@CryptoKing', winningBid: '88.88', prizeWon: 95000, totalBids: 456, players: 123, uniqueBids: 234, burnedBids: 222 },
  { id: 'hist-7', title: 'Quick Freeze 15m #21', type: 'timed', date: 'Feb 11, 2026', winner: '@MoonShot', winningBid: '62.33', prizeWon: 3800, totalBids: 65, players: 27, uniqueBids: 44, burnedBids: 21 },
  { id: 'hist-8', title: 'Shadow Auction #6', type: 'blind', date: 'Feb 10, 2026', winner: '@ShadowBet', winningBid: '55.01', prizeWon: 7600, totalBids: 82, players: 35, uniqueBids: 51, burnedBids: 31 },
];

export const DEMO_DRAW_RESULTS: DrawPrize[] = [
  { prizeNumber: 1, prizePercent: 50, targetValue: '47.23', winner: '@DiamondHands', winAmount: 31250, distance: 'Exact match!' },
  { prizeNumber: 2, prizePercent: 25, targetValue: '82.91', winner: null, winAmount: 0 },
  { prizeNumber: 3, prizePercent: 12, targetValue: '15.44', winner: '@MoonShot', winAmount: 7500, distance: 'Distance: 0.02' },
  { prizeNumber: 4, prizePercent: 8, targetValue: '63.17', winner: '@CryptoKing', winAmount: 5000, distance: 'Distance: 0.05' },
  { prizeNumber: 5, prizePercent: 5, targetValue: '29.55', winner: null, winAmount: 0 },
];
