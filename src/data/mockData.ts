export type AuctionType = 'live_before_hot' | 'timed' | 'blind_count' | 'blind_timed' | 'free' | 'jackpot';
export type AuctionStatus = 'accumulating' | 'hot_mode' | 'grace_period' | 'closed' | 'resolved' | 'cancelled';

export interface Auction {
  id: string;
  title: string;
  type: AuctionType;
  status: AuctionStatus;
  prizePool: number;
  bidCount: number;
  bidTarget?: number;
  timeRemaining?: string;
  bidCost: number;
  uniqueBids: number;
  burnedBids: number;
  icon: string;
  rolloverWeek?: number;
  rolloverHistory?: number[];
  minBidValue?: number;
  maxBidValue?: number;
  hotModeEndsAt?: string;
  totalBidFees?: number;
  visibility?: 'open' | 'blind';
  resolutionMethod?: 'highest_unique_bid' | 'rng_exact' | 'rng_closest';
  rngPickCount?: number;
  drawnNumbers?: number[];
  winningDistance?: number;
}

export interface Bid {
  id: string;
  value: string;
  status: 'unique' | 'burned' | 'winner';
  position?: number;
  timestamp: string;
}

export interface DuelRoom {
  id: string;
  fee: number;
  maxBid: number;
  status: 'empty' | 'waiting' | 'in-progress';
  opponent?: string;
  opponentTime?: string;
  winAmount: number;
}

export interface RecentDuel {
  id: string;
  opponent: string;
  fee: number;
  result: 'won' | 'lost';
  amount: number;
  time: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  initials: string;
  wins: number;
  earnings: number;
  streak: number;
}

export const AUCTIONS: Auction[] = [
  {
    id: 'live-1',
    title: 'Arctic Rush #47',
    type: 'live_before_hot',
    status: 'accumulating',
    prizePool: 12450,
    bidCount: 67,
    bidTarget: 100,
    bidCost: 10,
    uniqueBids: 42,
    burnedBids: 25,
    icon: '🎯',
  },
  {
    id: 'live-2',
    title: 'Penguin Showdown #12',
    type: 'live_before_hot',
    status: 'hot_mode',
    prizePool: 28750,
    bidCount: 134,
    bidTarget: 100,
    timeRemaining: '2:47',
    bidCost: 10,
    uniqueBids: 78,
    burnedBids: 56,
    icon: '🔥',
  },
  {
    id: 'timed-1',
    title: 'Quick Freeze 15m',
    type: 'timed',
    status: 'accumulating',
    prizePool: 3200,
    bidCount: 45,
    timeRemaining: '11:23',
    bidCost: 5,
    uniqueBids: 31,
    burnedBids: 14,
    icon: '⏱️',
  },
  {
    id: 'blind-1',
    title: 'Shadow Auction #8',
    type: 'blind_count',
    status: 'accumulating',
    prizePool: 8900,
    bidCount: 89,
    bidCost: 10,
    uniqueBids: 55,
    burnedBids: 34,
    icon: '🙈',
  },
  {
    id: 'free-1',
    title: 'Welcome Freeroll',
    type: 'free',
    status: 'accumulating',
    prizePool: 500,
    bidCount: 23,
    timeRemaining: '45:00',
    bidCost: 0,
    uniqueBids: 20,
    burnedBids: 3,
    icon: '🎁',
  },
  {
    id: 'jackpot-1',
    title: 'MEGA JACKPOT',
    type: 'jackpot',
    status: 'accumulating',
    prizePool: 125000,
    bidCount: 234,
    bidTarget: 500,
    bidCost: 25,
    uniqueBids: 145,
    burnedBids: 89,
    icon: '🎰',
    rolloverWeek: 4,
    rolloverHistory: [5000, 15000, 45000, 125000],
  },
];

export const MY_BIDS: Bid[] = [
  { id: '1', value: '47.23', status: 'unique', position: 3, timestamp: '2m ago' },
  { id: '2', value: '82.10', status: 'burned', timestamp: '5m ago' },
  { id: '3', value: '15.67', status: 'unique', position: 7, timestamp: '8m ago' },
  { id: '4', value: '99.01', status: 'burned', timestamp: '12m ago' },
  { id: '5', value: '33.44', status: 'unique', position: 1, timestamp: '15m ago' },
  { id: '6', value: '61.88', status: 'burned', timestamp: '18m ago' },
  { id: '7', value: '07.77', status: 'unique', position: 12, timestamp: '22m ago' },
  { id: '8', value: '55.55', status: 'burned', timestamp: '25m ago' },
  { id: '9', value: '23.91', status: 'unique', position: 5, timestamp: '30m ago' },
  { id: '10', value: '44.00', status: 'burned', timestamp: '35m ago' },
];

export const DUEL_ROOMS: DuelRoom[] = [
  { id: '1', fee: 10, maxBid: 9.99, status: 'empty', winAmount: 13 },
  { id: '2', fee: 20, maxBid: 9.99, status: 'empty', winAmount: 26 },
  { id: '3', fee: 50, maxBid: 9.99, status: 'waiting', opponent: '@NordicBid', opponentTime: '45s ago', winAmount: 65 },
  { id: '4', fee: 100, maxBid: 99.99, status: 'empty', winAmount: 130 },
  { id: '5', fee: 200, maxBid: 99.99, status: 'empty', winAmount: 260 },
  { id: '6', fee: 500, maxBid: 99.99, status: 'waiting', opponent: '@AlphaWolf', opponentTime: '2m ago', winAmount: 650 },
  { id: '7', fee: 1000, maxBid: 99.99, status: 'empty', winAmount: 1300 },
  { id: '8', fee: 5000, maxBid: 99.99, status: 'empty', winAmount: 6500 },
];

export const RECENT_DUELS: RecentDuel[] = [
  { id: '1', opponent: '@NordicBid', fee: 100, result: 'won', amount: 130, time: '2m ago' },
  { id: '2', opponent: '@ShadowBet', fee: 50, result: 'lost', amount: -50, time: '15m ago' },
  { id: '3', opponent: '@MoonShot', fee: 200, result: 'won', amount: 260, time: '1h ago' },
  { id: '4', opponent: '@IceKing', fee: 100, result: 'won', amount: 130, time: '2h ago' },
  { id: '5', opponent: '@CryptoNinja', fee: 500, result: 'lost', amount: -500, time: '3h ago' },
];

export const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, username: '@ArcticFox', initials: 'AF', wins: 47, earnings: 34200, streak: 8 },
  { rank: 2, username: '@IceQueen', initials: 'IQ', wins: 39, earnings: 28400, streak: 5 },
  { rank: 3, username: '@GoldPenguin', initials: 'GP', wins: 35, earnings: 22100, streak: 3 },
  { rank: 4, username: '@NordicBid', initials: 'NB', wins: 31, earnings: 18900, streak: 6 },
  { rank: 5, username: '@AlphaWolf', initials: 'AW', wins: 28, earnings: 15600, streak: 2 },
  { rank: 6, username: '@CryptoKing', initials: 'CK', wins: 24, earnings: 12300, streak: 4 },
  { rank: 7, username: '@MoonShot', initials: 'MS', wins: 21, earnings: 9800, streak: 1 },
  { rank: 8, username: '@ShadowBet', initials: 'SB', wins: 18, earnings: 7400, streak: 0 },
  { rank: 9, username: '@IceKing', initials: 'IK', wins: 15, earnings: 5200, streak: 2 },
  { rank: 10, username: '@FrostBite', initials: 'FB', wins: 12, earnings: 3100, streak: 0 },
];

export const TICKER_ITEMS = [
  { text: '@ArcticFox won', amount: '2,450 PNGWIN', event: 'Arctic Rush #46' },
  { text: '@IceQueen scored highest unique bid in', amount: '', event: 'Quick Freeze' },
  { text: 'JACKPOT HUBA now at', amount: '125,000 PNGWIN', event: 'Week 4 Rollover!' },
  { text: '@GoldPenguin won PvP duel:', amount: '+650 PNGWIN', event: '' },
  { text: 'Token burn today:', amount: '4,230 PNGWIN', event: 'permanently destroyed 🔥' },
  { text: '892 players online now', amount: '', event: '' },
  { text: 'Social circle bonuses paid:', amount: '18,400 PNGWIN', event: 'this week' },
];

export const PLATFORM_STATS = {
  totalPrizesPaid: 2847000,
  totalBurned: 1245000,
  totalPlayers: 12847,
  activePlayers: 892,
  activeAuctions: 7,
  biggestWin: 125000,
};
