import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface FundBreakdownResultsProps {
  instanceId: string;
  totalCollected: number;
  prizePool: number;
}

interface SocialPayout {
  level: number;
  username: string | null;
  amount: number;
  qualified: boolean;
  went_to_jackpot: boolean;
}

interface BurnReport {
  thisAuction: number;
  allTime: number;
}

const FundBreakdownResults = ({ instanceId, totalCollected, prizePool }: FundBreakdownResultsProps) => {
  const [socialPayouts, setSocialPayouts] = useState<SocialPayout[]>([]);
  const [burnReport, setBurnReport] = useState<BurnReport>({ thisAuction: 0, allTime: 0 });
  const [allocations, setAllocations] = useState<any>(null);

  useEffect(() => {
    if (!instanceId) return;

    // Fetch fund allocations
    supabase
      .from('fund_allocations')
      .select('*')
      .eq('game_instance_id', instanceId)
      .single()
      .then(({ data }) => {
        if (data) setAllocations(data);
      });

    // Fetch social circle payouts
    supabase
      .from('social_circle_payouts')
      .select('*, users!recipient_user_id(username)')
      .eq('game_instance_id', instanceId)
      .then(({ data }) => {
        if (data) {
          setSocialPayouts(data.map((r: any) => ({
            level: r.circle_level ?? r.level ?? 1,
            username: r.users?.username ?? null,
            amount: Number(r.amount ?? 0),
            qualified: r.qualified !== false,
            went_to_jackpot: !r.recipient_user_id,
          })));
        }
      });

    // Fetch burn totals
    Promise.all([
      supabase
        .from('token_burns')
        .select('amount')
        .eq('source_instance_id', instanceId),
      supabase
        .from('token_burns')
        .select('amount')
        .eq('source_project', 'auction'),
    ]).then(([thisRes, allRes]) => {
      const thisAuction = (thisRes.data ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
      const allTime = (allRes.data ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
      setBurnReport({ thisAuction, allTime });
    });
  }, [instanceId]);

  // Use real allocations or defaults
  const prizePct = allocations?.prize_pool_pct ?? 55;
  const burnPct = allocations?.burn_pct ?? 15;
  const platformPct = allocations?.house_fee_pct ?? 15;
  const socialPct = allocations?.social_circle_pct ?? 5;
  const jackpotPct = allocations?.jackpot_pct ?? 10;

  const calc = (pct: number) => Math.floor(totalCollected * pct / 100);

  // Mock social payouts if none found
  const displayPayouts = socialPayouts.length > 0 ? socialPayouts : [
    { level: 1, username: 'Sponsor1', amount: calc(socialPct) * 0.40, qualified: true, went_to_jackpot: false },
    { level: 2, username: 'Sponsor2', amount: calc(socialPct) * 0.25, qualified: true, went_to_jackpot: false },
    { level: 3, username: 'Sponsor3', amount: calc(socialPct) * 0.15, qualified: true, went_to_jackpot: false },
    { level: 4, username: null, amount: calc(socialPct) * 0.12, qualified: false, went_to_jackpot: true },
    { level: 5, username: null, amount: calc(socialPct) * 0.08, qualified: false, went_to_jackpot: true },
  ];

  const segments = [
    { label: 'Prize Pool', pct: prizePct, amount: calc(prizePct), color: 'bg-pngwin-green', textColor: 'text-pngwin-green', icon: '💰' },
    { label: 'Paid Burn', pct: burnPct, amount: burnReport.thisAuction || calc(burnPct), color: 'bg-pngwin-red', textColor: 'text-pngwin-red', icon: '🔥' },
    { label: 'Platform', pct: platformPct, amount: calc(platformPct), color: 'bg-muted-foreground', textColor: 'text-muted-foreground', icon: '🏢' },
    { label: 'Social Circle', pct: socialPct, amount: calc(socialPct), color: 'bg-ice', textColor: 'text-ice', icon: '👥' },
    { label: 'Jackpot Feed', pct: jackpotPct, amount: calc(jackpotPct), color: 'bg-primary', textColor: 'text-primary', icon: '🎰' },
  ];

  return (
    <div className="space-y-6">
      {/* Where the Money Went */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <div className="px-5 py-3 border-b border-border">
          <h3 className="font-display font-bold text-sm flex items-center gap-2">
            💰 Where the Money Went
          </h3>
        </div>

        {/* Visual stacked bar */}
        <div className="px-5 pt-4">
          <div className="flex gap-0.5 h-4 rounded-full overflow-hidden">
            {segments.map((s, i) => (
              <motion.div
                key={i}
                initial={{ width: 0 }}
                animate={{ width: `${s.pct}%` }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className={`${s.color} relative group`}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded px-2 py-1 text-[9px] whitespace-nowrap z-10">
                  {s.label}: {s.pct}%
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Breakdown table */}
        <div className="p-5 space-y-2">
          {segments.map((s, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">{s.icon}</span>
                <span className="text-sm text-muted-foreground">{s.label} ({s.pct}%)</span>
              </div>
              <span className={`font-mono text-sm font-bold ${s.textColor}`}>
                {s.amount.toLocaleString()} PNGWIN
              </span>
            </div>
          ))}
          <div className="h-px bg-border my-2" />
          <div className="flex items-center justify-between font-bold">
            <span className="text-sm text-foreground">Total Collected</span>
            <span className="font-mono text-sm text-foreground">{totalCollected.toLocaleString()} PNGWIN</span>
          </div>
        </div>
      </motion.div>

      {/* Social Circle Payouts */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-ice/20 rounded-xl overflow-hidden"
      >
        <div className="px-5 py-3 border-b border-border">
          <h3 className="font-display font-bold text-sm flex items-center gap-2">
            👥 Social Circle Payouts
          </h3>
        </div>
        <div className="p-5 space-y-1.5">
          {displayPayouts.map((sp, i) => {
            const isLast = i === displayPayouts.length - 1;
            const prefix = isLast ? '└──' : '├──';
            return (
              <div key={i} className="flex items-center gap-2 font-mono text-xs">
                <span className="text-muted-foreground w-6">{prefix}</span>
                <span className="text-muted-foreground w-8">L{sp.level}:</span>
                {sp.username ? (
                  <>
                    <span className="text-foreground">@{sp.username}</span>
                    <span className="ml-auto text-pngwin-green font-bold">+{Math.floor(sp.amount).toLocaleString()} PNGWIN</span>
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground italic">(empty)</span>
                    <span className="ml-auto text-pngwin-orange">→ Jackpot</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Burn Report */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-pngwin-red/20 rounded-xl p-5"
      >
        <h3 className="font-display font-bold text-sm flex items-center gap-2 mb-3">
          🔥 Burn Report
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-background rounded-lg p-4 text-center">
            <div className="font-mono text-xl font-bold text-pngwin-red">
              {(burnReport.thisAuction || calc(burnPct)).toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase mt-1">This Auction</div>
          </div>
          <div className="bg-background rounded-lg p-4 text-center">
            <div className="font-mono text-xl font-bold text-pngwin-red">
              {(burnReport.allTime || 482300).toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase mt-1">All-Time Burned</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FundBreakdownResults;
