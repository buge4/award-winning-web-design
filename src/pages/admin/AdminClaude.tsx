import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';


type Message = { role: 'user' | 'assistant' | 'error'; content: string };

const STARTER_PROMPTS = [
  'List active auctions',
  'Platform overview',
  'Create a test auction',
  'Show auction leaderboard',
  'System health check',
];

const AdminClaude = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    const history = [...messages.filter(m => m.role !== 'error'), userMsg];
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://89.167.102.46:3000/api/claude-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': 'cpx-admin-2026',
        },
        body: JSON.stringify({
          message: text.trim(),
          conversation_history: history.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      if (data?.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', content: data.response ?? 'No response' }]);
    } catch (e: any) {
      const errMsg = e?.message?.includes('timed out')
        ? 'Request timed out after 30 seconds. The VPS may be unresponsive.'
        : `Could not reach Claude Admin. ${e?.message ?? 'Check VPS status.'}`;
      setMessages(prev => [...prev, { role: 'error', content: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const retry = () => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (lastUser) {
      setMessages(prev => prev.filter((_, i) => i < prev.length - 1));
      send(lastUser.content);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/60 backdrop-blur-sm rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <span className="font-display font-bold text-sm">Claude Admin — Auction</span>
          <span className="w-2 h-2 rounded-full bg-pngwin-green animate-pulse" />
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-secondary">
            Clear chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🧠</div>
              <h2 className="font-display font-bold text-lg">Claude Admin</h2>
              <p className="text-xs text-muted-foreground mt-1">Ask anything about the auction platform</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {STARTER_PROMPTS.map(prompt => (
                <button key={prompt} onClick={() => send(prompt)}
                  className="px-3 py-1.5 text-xs bg-card border border-border rounded-lg hover:border-primary hover:text-primary transition-all">
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'error' ? (
                <div className="max-w-[85%] bg-pngwin-red/10 border border-pngwin-red/20 rounded-xl px-4 py-3">
                  <p className="text-xs text-pngwin-red">{msg.content}</p>
                  <button onClick={retry} className="text-[10px] text-pngwin-red/70 hover:text-pngwin-red mt-2 underline">
                    Retry
                  </button>
                </div>
              ) : msg.role === 'user' ? (
                <div className="max-w-[75%] bg-primary/15 border border-primary/20 rounded-xl rounded-br-sm px-4 py-2.5">
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              ) : (
                <div className="max-w-[85%] bg-card border border-border rounded-xl rounded-bl-sm px-4 py-3">
                  <div className="prose prose-sm prose-invert max-w-none text-sm
                    [&_pre]:bg-[#0D1117] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-xs [&_pre]:overflow-x-auto
                    [&_code]:bg-[#0D1117] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
                    [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-xs [&_th]:bg-secondary
                    [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1.5 [&_td]:text-xs
                    [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline
                    [&_ul]:list-disc [&_ol]:list-decimal [&_li]:text-sm
                    [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold
                    [&_p]:leading-relaxed">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-card border border-border rounded-xl px-4 py-3 flex gap-1">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card/60 backdrop-blur-sm rounded-b-xl">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Claude about the auction platform..."
            disabled={loading}
            rows={1}
            className="flex-1 resize-none bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-50 max-h-32"
            style={{ minHeight: '40px' }}
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 gradient-gold text-primary-foreground font-display font-bold text-sm rounded-lg shadow-gold disabled:opacity-40 transition-opacity"
          >
            ➤
          </button>
        </div>
        <p className="text-[9px] text-muted-foreground mt-1.5">Shift+Enter for new line • Enter to send</p>
      </div>
    </div>
  );
};

export default AdminClaude;
