import { motion, AnimatePresence } from 'framer-motion';

interface CreditModalProps {
  creditModal: { userId: string; username: string } | null;
  setCreditModal: (v: any) => void;
  creditAmount: string;
  setCreditAmount: (v: string) => void;
  creditDirection: 'IN' | 'OUT';
  setCreditDirection: (v: 'IN' | 'OUT') => void;
  creditReason: string;
  setCreditReason: (v: string) => void;
  submitting: boolean;
  handleCredit: () => void;
}

const CreditModal = ({ creditModal, setCreditModal, creditAmount, setCreditAmount, creditDirection, setCreditDirection, creditReason, setCreditReason, submitting, handleCredit }: CreditModalProps) => (
  <AnimatePresence>
    {creditModal && (
      <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setCreditModal(null)}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          className="bg-card border border-border-active rounded-2xl p-6 max-w-sm w-full" onClick={(e: any) => e.stopPropagation()}>
          <h3 className="font-display font-bold text-lg mb-4">💰 Credit/Debit @{creditModal.username}</h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <button onClick={() => setCreditDirection('IN')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border ${creditDirection === 'IN' ? 'bg-pngwin-green/20 text-pngwin-green border-pngwin-green/30' : 'border-border text-muted-foreground'}`}>
                ➕ Credit (IN)
              </button>
              <button onClick={() => setCreditDirection('OUT')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border ${creditDirection === 'OUT' ? 'bg-pngwin-red/20 text-pngwin-red border-pngwin-red/30' : 'border-border text-muted-foreground'}`}>
                ➖ Debit (OUT)
              </button>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Amount</label>
              <input value={creditAmount} onChange={(e: any) => setCreditAmount(e.target.value)} type="number"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Reason</label>
              <input value={creditReason} onChange={(e: any) => setCreditReason(e.target.value)} placeholder="Admin adjustment"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCreditModal(null)} className="flex-1 py-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg">Cancel</button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCredit} disabled={submitting || !creditAmount}
                className="flex-1 py-2 gradient-gold text-primary-foreground font-display font-bold text-xs rounded-lg shadow-gold disabled:opacity-60">
                {submitting ? 'Processing...' : 'Confirm'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default CreditModal;
