import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, AlertTriangle, Sparkles } from 'lucide-react';

export default function StatusBanner({ status, message }) {
  const config = {
    idle: { icon: Rocket, bg: 'bg-secondary/50', text: 'text-muted-foreground', border: 'border-border/30' },
    ready: { icon: Sparkles, bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
    launching: { icon: Rocket, bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    stuttering: { icon: AlertTriangle, bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    stalled: { icon: AlertTriangle, bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
    launched: { icon: Sparkles, bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  };

  const { icon: Icon, bg, text, border } = config[status] || config.idle;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${bg} ${border} backdrop-blur-sm`}
      >
        <Icon className={`w-5 h-5 ${text} ${status === 'launching' ? 'animate-bounce' : ''}`} />
        <span className={`text-sm font-medium ${text}`}>{message}</span>
      </motion.div>
    </AnimatePresence>
  );
}