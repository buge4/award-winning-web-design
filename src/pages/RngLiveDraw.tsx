import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link, useLocation } from 'react-router-dom';
import { AUCTIONS } from '@/data/mockData';
import { DEMO_DRAW_RESULTS, DRAW_HISTORY, type DrawPrize } from '@/data/drawHistory';

const PRIZE_SPLITS = [0.5, 0.25, 0.12, 0.08, 0.05];

type DrawPhase = 'countdown' | 'drawing' | 'complete';
type DigitState = 'spinning' | 'locked' | 'idle';

const SpinningDigit = ({
  finalDigit,
  state,
  delay,
}: {
  finalDigit: string;
  state: DigitState;
  delay: number;
}) => {
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (state === 'spinning') {
      const interval = setInterval(() => {
        setDisplay(String(Math.floor(Math.random() * 10)));
      }, 50);
      const lockTimer = setTimeout(() => {
        clearInterval(interval);
        setDisplay(finalDigit);
      }, delay);
      return () => { clearInterval(interval); clearTimeout(lockTimer); };
    }
    if (state === 'locked') setDisplay(finalDigit);
  }, [state, finalDigit, delay]);

  return (
    <motion.div
      className={`w-16 h-20 md:w-20 md:h-24 rounded-lg flex items-center justify-center font-mono text-4xl md:text-5xl font-bold border-2 transition-all duration-300 ${
        state === 'spinning'
          ? 'border-ice/50 bg-background text-ice shadow-[0_0_20px_hsla(192,100%,50%,0.3)]'
          : state === 'locked'
          ? 'border-primary bg-gold-subtle text-primary shadow-[0_0_25px_hsla(43,90%,60%,0.4)]'
          : 'border-border bg-card text-muted-foreground'
      }`}
      animate={state === 'locked' ? { scale: [1.1, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      {state === 'idle' ? '?' : display}
    </motion.div>
  );
};

const ConfettiParticle = ({ index }: { index: number }) => {
  const colors = ['hsl(43,90%,60%)', 'hsl(192,100%,50%)', 'hsl(152,100%,45%)', 'hsl(270,91%,65%)', 'hsl(350,100%,63%)'];
  const x = Math.random() * 100;
  const delay = Math.random() * 0.5;
  const duration = 2 + Math.random() * 2;
  const color = colors[index % colors.length];
  const size = 4 + Math.random() * 8;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: -10, width: size, height: size, backgroundColor: color, borderRadius: Math.random() > 0.5 ? '50%' : '2px' }}
      initial={{ opacity: 1, y: -20, rotate: 0 }}
      animate={{ opacity: 0, y: '100vh', rotate: 360 * (Math.random() > 0.5 ? 1 : -1), x: (Math.random() - 0.5) * 200 }}
      transition={{ duration, delay, ease: 'easeIn' }}
    />
  );
};

const RngLiveDraw = () => {
  const { id } = useParams();
  const location = useLocation();

  // Determine mode: demo, replay, or live
  const isDemo = id === 'demo';
  const isReplay = location.pathname.includes('/replay');
  const replayWeek = isReplay ? Number(location.pathname.split('/draws/')[1]?.split('/')[0]) : null;

  const auction = isDemo
    ? { prizePool: 62500, bidCount: 567, uniqueBids: 320, burnedBids: 247, title: 'Demo Draw', icon: '🎰', type: 'jackpot' as const }
    : AUCTIONS.find((a) => a.id === id) || AUCTIONS.find(a => a.type === 'jackpot') || AUCTIONS[0];

  // Pick results based on mode
  let drawResults: DrawPrize[];
  let drawPool: number;
  if (isReplay && replayWeek) {
    const weekData = DRAW_HISTORY.find(d => d.week === replayWeek);
    drawResults = weekData?.draws || DEMO_DRAW_RESULTS;
    drawPool = weekData?.prizePool || 62500;
  } else if (isDemo) {
    drawResults = DEMO_DRAW_RESULTS;
    drawPool = 62500;
  } else {
    drawResults = DEMO_DRAW_RESULTS;
    drawPool = auction.prizePool;
  }

  // Speed: demo/replay = fast, live = normal
  const speed = (isDemo || isReplay) ? 0.5 : 1;

  const [phase, setPhase] = useState<DrawPhase>('countdown');
  const [currentPrize, setCurrentPrize] = useState(0);
  const [digitStates, setDigitStates] = useState<DigitState[]>(['idle', 'idle', 'idle', 'idle']);
  const [showResult, setShowResult] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [completedDraws, setCompletedDraws] = useState<DrawPrize[]>([]);
  const [countdown, setCountdown] = useState(isDemo || isReplay ? 3 : 10);
  const [key, setKey] = useState(0); // for "Watch Again"

  // Reset on key change
  useEffect(() => {
    setPhase('countdown');
    setCurrentPrize(0);
    setDigitStates(['idle', 'idle', 'idle', 'idle']);
    setShowResult(false);
    setShowConfetti(false);
    setCompletedDraws([]);
    setCountdown(isDemo || isReplay ? 3 : 10);
  }, [key, isDemo, isReplay]);

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      setPhase('drawing');
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdown]);

  const runDraw = useCallback((prizeIndex: number) => {
    const result = drawResults[prizeIndex];
    const digits = result.targetValue.replace('.', '');

    setCurrentPrize(prizeIndex);
    setShowResult(false);
    setShowConfetti(false);
    setDigitStates(['idle', 'idle', 'idle', 'idle']);

    const s = speed;
    setTimeout(() => setDigitStates(['spinning', 'spinning', 'spinning', 'spinning']), 400 * s);

    const lockTimes = [1200 * s, 2000 * s, 2800 * s, 3600 * s];
    lockTimes.forEach((time, i) => {
      setTimeout(() => {
        setDigitStates(prev => prev.map((st, j) => j <= i ? 'locked' : st) as DigitState[]);
      }, time);
    });

    setTimeout(() => {
      setShowResult(true);
      if (result.winner) setShowConfetti(true);
      setCompletedDraws(prev => [...prev, result]);
    }, 4200 * s);

    setTimeout(() => {
      if (prizeIndex < 4) {
        runDraw(prizeIndex + 1);
      } else {
        setTimeout(() => setPhase('complete'), 1500 * s);
      }
    }, 6000 * s);
  }, [drawResults, speed]);

  useEffect(() => {
    if (phase === 'drawing' && completedDraws.length === 0) {
      runDraw(0);
    }
  }, [phase, completedDraws.length, runDraw]);

  const currentResult = drawResults[currentPrize];
  const digits = currentResult?.targetValue.replace('.', '') || '0000';
  const totalDistributed = drawResults.filter(r => r.winner).reduce((a, r) => a + r.winAmount, 0);
  const totalRolled = drawResults.filter(r => !r.winner).reduce((a, r) => a + Math.floor(drawPool * (r.prizePercent / 100)), 0);

  const backLink = isReplay ? '/draws' : isDemo ? '/' : `/auction/${id}`;
  const backLabel = isReplay ? '← Back to Draw History' : isDemo ? '← Back to Lobby' : '← Back to Auction';

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0 relative overflow-hidden">
      {/* Stage lighting */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-ice/5 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-pngwin-purple/3 rounded-full blur-[150px]" />
      </div>

      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 60 }).map((_, i) => (
            <ConfettiParticle key={`${key}-${currentPrize}-${i}`} index={i} />
          ))}
        </div>
      )}

      <div className="container py-8 relative z-10">
        <Link to={backLink} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          {backLabel}
        </Link>

        {/* Demo/Replay badge */}
        {(isDemo || isReplay) && (
          <div className="text-center mb-4">
            <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase bg-pngwin-purple/10 text-pngwin-purple border border-pngwin-purple/20">
              {isDemo ? '🎬 DEMO MODE' : `🎬 REPLAY — WEEK ${replayWeek}`}
            </span>
          </div>
        )}

        {/* COUNTDOWN */}
        {phase === 'countdown' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="text-xs text-ice uppercase tracking-[6px] mb-4 font-semibold">🎲 RNG LUCKY NUMBER DRAW</div>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-8">
              {isDemo ? 'DEMO DRAW' : isReplay ? `WEEK ${replayWeek} REPLAY` : 'DRAW BEGINS IN'}
            </h1>
            <motion.div
              className="font-mono text-7xl md:text-9xl font-bold text-primary mb-12"
              key={countdown}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {countdown}
            </motion.div>

            {!isDemo && !isReplay && (
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-12">
                <div className="bg-card border border-border rounded-lg p-4 text-center">
                  <div className="font-mono text-2xl font-bold text-ice">{auction.bidCount}</div>
                  <div className="text-[10px] text-muted-foreground">Total Bids</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4 text-center">
                  <div className="font-mono text-2xl font-bold text-pngwin-green">{auction.uniqueBids}</div>
                  <div className="text-[10px] text-muted-foreground">Unique Alive</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4 text-center">
                  <div className="font-mono text-2xl font-bold text-pngwin-red">{auction.burnedBids}</div>
                  <div className="text-[10px] text-muted-foreground">Burned</div>
                </div>
              </div>
            )}

            <div className="bg-card border border-gold/20 rounded-xl p-6 max-w-lg mx-auto glow-gold">
              <div className="font-display font-bold text-lg mb-1">5 PRIZES TO WIN!</div>
              <div className="font-mono text-3xl font-bold text-primary mb-4">
                {drawPool.toLocaleString()} PNGWIN
              </div>
              <div className="space-y-2">
                {PRIZE_SPLITS.map((split, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Prize #{i + 1} ({(split * 100).toFixed(0)}%)</span>
                    <span className="font-mono font-bold text-primary">
                      {Math.floor(drawPool * split).toLocaleString()} PNGWIN
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* DRAWING */}
        {phase === 'drawing' && (
          <div className="text-center py-8">
            <motion.div
              key={currentPrize}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <div className="text-xs text-pngwin-orange uppercase tracking-[4px] mb-2 font-semibold">
                Drawing Prize #{currentPrize + 1} of 5
              </div>
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-2">
                {currentResult.winAmount > 0 ? currentResult.winAmount.toLocaleString() : Math.floor(drawPool * (currentResult.prizePercent / 100)).toLocaleString()} <span className="text-primary">PNGWIN</span>
              </h2>
            </motion.div>

            <div className="flex items-center justify-center gap-3 md:gap-4 mb-12">
              <SpinningDigit finalDigit={digits[0]} state={digitStates[0]} delay={1200 * speed} />
              <SpinningDigit finalDigit={digits[1]} state={digitStates[1]} delay={2000 * speed} />
              <span className="font-mono text-5xl font-bold text-muted-foreground">.</span>
              <SpinningDigit finalDigit={digits[2]} state={digitStates[2]} delay={2800 * speed} />
              <SpinningDigit finalDigit={digits[3]} state={digitStates[3]} delay={3600 * speed} />
            </div>

            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="max-w-md mx-auto"
                >
                  {currentResult.winner ? (
                    <div className="bg-card border border-gold/30 rounded-xl p-8 glow-gold">
                      <div className="text-4xl mb-3">🎉</div>
                      <div className="font-display text-2xl font-bold text-primary mb-2">MATCH!</div>
                      <div className="text-lg mb-1">
                        <span className="font-bold text-ice">{currentResult.winner}</span> bid {currentResult.targetValue}!
                      </div>
                      <div className="font-mono text-3xl font-bold text-pngwin-green mb-2">
                        WINS {currentResult.winAmount.toLocaleString()} PNGWIN!
                      </div>
                      <div className="text-sm text-muted-foreground">{currentResult.distance}</div>
                    </div>
                  ) : (
                    <div className="bg-card border border-pngwin-red/30 rounded-xl p-8">
                      <div className="text-4xl mb-3">❌</div>
                      <div className="font-display text-xl font-bold text-pngwin-red mb-2">NO WINNER</div>
                      <div className="text-sm text-muted-foreground">
                        No unique bid matches. {Math.floor(drawPool * (currentResult.prizePercent / 100)).toLocaleString()} PNGWIN rolls to next jackpot!
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-center gap-3 mt-10">
              {drawResults.map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all ${
                    i < completedDraws.length
                      ? completedDraws[i]?.winner ? 'bg-pngwin-green' : 'bg-pngwin-red'
                      : i === currentPrize
                      ? 'bg-primary animate-pulse-glow'
                      : 'bg-border'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* COMPLETE */}
        {phase === 'complete' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto py-8">
            <div className="text-center mb-8">
              <div className="text-xs text-ice uppercase tracking-[6px] mb-3 font-semibold">🎲 DRAW COMPLETE</div>
              <h1 className="font-display text-4xl font-bold">Results</h1>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden mb-8">
              {drawResults.map((result, i) => (
                <div key={i} className={`px-6 py-4 flex items-center justify-between border-b border-border/50 last:border-0 ${
                  result.winner ? 'bg-green-subtle' : 'bg-red-subtle'
                }`}>
                  <div className="flex items-center gap-4">
                    <span className="text-lg">{result.winner ? '✅' : '❌'}</span>
                    <div>
                      <div className="text-sm font-semibold">Prize #{result.prizeNumber}</div>
                      <div className="font-mono text-xs text-muted-foreground">{result.targetValue}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {result.winner ? (
                      <>
                        <div className="text-sm font-bold text-ice">{result.winner}</div>
                        <div className="font-mono text-sm text-pngwin-green font-bold">
                          +{result.winAmount.toLocaleString()} PNGWIN
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-pngwin-red font-semibold">Rolled Over</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="font-mono text-xl font-bold text-pngwin-green">{totalDistributed.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground">Distributed</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="font-mono text-xl font-bold text-pngwin-red">{totalRolled.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground">Rolled Over</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="font-mono text-xl font-bold text-primary">{(totalRolled + 5000).toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground">Next Jackpot Starts</div>
              </div>
            </div>

            <div className="flex gap-3 justify-center flex-wrap mb-4">
              <button
                onClick={() => setKey(k => k + 1)}
                className="px-5 py-2.5 bg-secondary border border-border text-muted-foreground font-display font-semibold text-sm rounded-lg hover:text-foreground transition-colors"
              >
                🔄 Watch Again
              </button>
              <Link
                to="/auction/rng-1"
                className="px-5 py-2.5 gradient-gold text-primary-foreground font-display font-bold text-sm rounded-lg shadow-gold"
              >
                Enter This Week's Jackpot →
              </Link>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Next draw: <span className="text-primary font-semibold">Saturday Feb 22 at 20:00 UTC</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default RngLiveDraw;
