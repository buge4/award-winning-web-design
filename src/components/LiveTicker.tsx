import { TICKER_ITEMS } from '@/data/mockData';

const LiveTicker = () => {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]; // duplicate for seamless loop

  return (
    <div className="bg-gold-subtle border-y border-gold overflow-hidden">
      <div className="flex gap-10 animate-ticker whitespace-nowrap py-2.5 px-6">
        {items.map((item, i) => (
          <span key={i} className="text-muted-foreground text-xs">
            {item.text}{' '}
            {item.amount && <span className="text-primary font-semibold">{item.amount}</span>}{' '}
            {item.event && <span className="text-muted-foreground">{item.event}</span>}
          </span>
        ))}
      </div>
    </div>
  );
};

export default LiveTicker;
