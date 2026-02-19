import { CircleBonusEntry } from '@/components/SocialCircleBonusTable';

// Social circle bonus data for draw history winners
export const DRAW_SOCIAL_BONUSES: Record<string, CircleBonusEntry[]> = {
  // Week 3 winners
  '@DiamondHands': [
    { level: 1, upline: '@MoonShot', qualified: true, tier: 'Tier 4', amount: 850, destination: 'paid' },
    { level: 2, upline: '@StarGazer', qualified: true, tier: 'Tier 3', amount: 850, destination: 'paid' },
    { level: 3, upline: '@CryptoKing', qualified: false, amount: 850, destination: 'jackpot' },
    { level: 4, upline: '@WhaleAlert', qualified: true, tier: 'Tier 2', amount: 850, destination: 'paid' },
    { level: 5, upline: null, qualified: false, amount: 850, destination: 'jackpot' },
  ],
  '@MoonShot': [
    { level: 1, upline: '@StarGazer', qualified: true, tier: 'Tier 3', amount: 204, destination: 'paid' },
    { level: 2, upline: '@CryptoKing', qualified: false, amount: 204, destination: 'jackpot' },
    { level: 3, upline: '@WhaleAlert', qualified: true, tier: 'Tier 2', amount: 204, destination: 'paid' },
    { level: 4, upline: '@DeFiDegen', qualified: false, amount: 204, destination: 'jackpot' },
    { level: 5, upline: null, qualified: false, amount: 204, destination: 'jackpot' },
  ],
  '@CryptoKing': [
    { level: 1, upline: '@WhaleAlert', qualified: true, tier: 'Tier 2', amount: 136, destination: 'paid' },
    { level: 2, upline: '@DeFiDegen', qualified: false, amount: 136, destination: 'jackpot' },
    { level: 3, upline: '@SatoshiFan', qualified: true, tier: 'Tier 1', amount: 136, destination: 'paid' },
    { level: 4, upline: null, qualified: false, amount: 136, destination: 'jackpot' },
    { level: 5, upline: null, qualified: false, amount: 136, destination: 'jackpot' },
  ],
  // Week 2 winners
  '@AlphaWolf': [
    { level: 1, upline: '@IceQueen', qualified: true, tier: 'Tier 4', amount: 620, destination: 'paid' },
    { level: 2, upline: '@GoldPenguin', qualified: true, tier: 'Tier 3', amount: 620, destination: 'paid' },
    { level: 3, upline: '@NordicBid', qualified: true, tier: 'Tier 2', amount: 620, destination: 'paid' },
    { level: 4, upline: null, qualified: false, amount: 620, destination: 'jackpot' },
    { level: 5, upline: null, qualified: false, amount: 620, destination: 'jackpot' },
  ],
  '@NordicBid': [
    { level: 1, upline: '@AlphaWolf', qualified: true, tier: 'Tier 3', amount: 99, destination: 'paid' },
    { level: 2, upline: '@IceQueen', qualified: true, tier: 'Tier 2', amount: 99, destination: 'paid' },
    { level: 3, upline: '@GoldPenguin', qualified: false, amount: 99, destination: 'jackpot' },
    { level: 4, upline: null, qualified: false, amount: 99, destination: 'jackpot' },
    { level: 5, upline: null, qualified: false, amount: 99, destination: 'jackpot' },
  ],
  '@WhaleAlert': [
    { level: 1, upline: '@DeFiDegen', qualified: false, amount: 62, destination: 'jackpot' },
    { level: 2, upline: '@SatoshiFan', qualified: true, tier: 'Tier 1', amount: 62, destination: 'paid' },
    { level: 3, upline: null, qualified: false, amount: 62, destination: 'jackpot' },
    { level: 4, upline: null, qualified: false, amount: 62, destination: 'jackpot' },
    { level: 5, upline: null, qualified: false, amount: 62, destination: 'jackpot' },
  ],
  // Week 1 winners
  '@SatoshiFan': [
    { level: 1, upline: '@DeFiDegen', qualified: true, tier: 'Tier 1', amount: 40, destination: 'paid' },
    { level: 2, upline: null, qualified: false, amount: 40, destination: 'jackpot' },
    { level: 3, upline: null, qualified: false, amount: 40, destination: 'jackpot' },
    { level: 4, upline: null, qualified: false, amount: 40, destination: 'jackpot' },
    { level: 5, upline: null, qualified: false, amount: 40, destination: 'jackpot' },
  ],
  '@DeFiDegen': [
    { level: 1, upline: null, qualified: false, amount: 25, destination: 'jackpot' },
    { level: 2, upline: null, qualified: false, amount: 25, destination: 'jackpot' },
    { level: 3, upline: null, qualified: false, amount: 25, destination: 'jackpot' },
    { level: 4, upline: null, qualified: false, amount: 25, destination: 'jackpot' },
    { level: 5, upline: null, qualified: false, amount: 25, destination: 'jackpot' },
  ],
};

// Auction result social circle bonus data
export const AUCTION_RESULT_BONUSES: Record<string, CircleBonusEntry[]> = {
  'hist-1': [ // Arctic Rush #46 — @ArcticFox
    { level: 1, upline: '@MoonShot', qualified: true, tier: 'Tier 4', amount: 256, destination: 'paid' },
    { level: 2, upline: '@StarGazer', qualified: true, tier: 'Tier 3', amount: 256, destination: 'paid' },
    { level: 3, upline: '@CryptoKing', qualified: false, amount: 256, destination: 'jackpot' },
    { level: 4, upline: '@WhaleAlert', qualified: true, tier: 'Tier 2', amount: 256, destination: 'paid' },
    { level: 5, upline: '@DeFiDegen', qualified: false, amount: 256, destination: 'jackpot' },
  ],
};

// Missed bonuses detail for Social Circle page
export const MISSED_BONUSES = [
  { date: 'Feb 15', user: '@MoonShot', event: 'Won Arctic Rush #46', missed: 40, reason: "didn't bid" },
  { date: 'Feb 12', user: '@ColdFish', event: 'Won Quick Freeze', missed: 18, reason: "didn't play" },
  { date: 'Feb 10', user: '@IcePenguin', event: 'Won Blind Auction #8', missed: 22, reason: "didn't bid" },
  { date: 'Feb 8', user: '@StarGazer', event: 'Won PvP Duel', missed: 12, reason: "didn't play" },
  { date: 'Feb 6', user: '@SnowDrift', event: 'Won Quick Freeze 15m #19', missed: 28, reason: "didn't bid" },
  { date: 'Feb 4', user: '@MoonShot', event: 'Won Arctic Rush #43', missed: 35, reason: 'Tier 3 locked' },
  { date: 'Feb 2', user: '@ColdFish', event: 'Won Shadow Auction #5', missed: 25, reason: "didn't play" },
];
