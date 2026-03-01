const badgeStyles: Record<string, string> = {
  BID_FEE: 'bg-ice/10 text-ice',
  AUCTION_BID: 'bg-ice/10 text-ice',
  AUCTION_WIN: 'bg-pngwin-green/10 text-pngwin-green',
  CREDIT: 'bg-pngwin-green/10 text-pngwin-green',
  SIGNUP_BONUS: 'bg-pngwin-green/10 text-pngwin-green',
  SOCIAL_BONUS: 'bg-ice/10 text-ice',
  BURN: 'bg-pngwin-red/10 text-pngwin-red',
  JACKPOT: 'bg-primary/10 text-primary',
};

const labels: Record<string, string> = {
  BID_FEE: 'BID',
  AUCTION_BID: 'BID',
  AUCTION_WIN: 'PAYOUT',
  CREDIT: 'CREDIT',
  SIGNUP_BONUS: 'BONUS',
  SOCIAL_BONUS: 'SOCIAL',
  BURN: 'BURN',
  JACKPOT: 'JACKPOT',
};

const TransactionBadge = ({ type }: { type: string }) => (
  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-md ${badgeStyles[type] ?? 'bg-secondary text-muted-foreground'}`}>
    {labels[type] ?? type}
  </span>
);

export default TransactionBadge;
