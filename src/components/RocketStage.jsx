import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

const STAGE_COLORS = {
  1: { bg: 'from-[#A05700] to-[#CB7005]' },
  2: { bg: 'from-[#2835AB] to-[#4550B4]' },
  3: { bg: 'from-[#16218C] to-[#2835AB]' },
  4: { bg: 'from-[#0D176F] to-[#16218C]' },
};

// isValid: 'valid' | 'warning' | 'invalid' | null
export default function RocketStage({ stage, label, price, marginLabel, marginValue, targetMargin, isValid, index }) {
  const colors = STAGE_COLORS[stage] || STAGE_COLORS[1];
  const displayMargin = marginValue != null ? `${(marginValue * 100).toFixed(1)}%` : '—';
  const displayTarget = targetMargin != null ? `${(targetMargin * 100).toFixed(1)}%` : '—';

  const ringClass =
    isValid === 'valid' ? 'ring-1 ring-green-500/30' :
    isValid === 'warning' ? 'ring-1 ring-yellow-500/40' :
    isValid === 'invalid' ? 'ring-1 ring-red-500/30' : '';

  const marginColor =
    isValid === 'valid' ? 'text-green-400' :
    isValid === 'warning' ? 'text-yellow-400' :
    isValid === 'invalid' ? 'text-red-400' : 'text-foreground';

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="relative"
    >
      <div className={`relative rounded-xl border border-border/50 overflow-hidden backdrop-blur-sm bg-card/60 ${ringClass}`}>
        {/* Stage header stripe */}
        <div className={`bg-gradient-to-r ${colors.bg} px-4 py-2 flex items-center justify-between`}>
          <span className="font-orbitron text-xs font-bold text-white tracking-wider uppercase">
            Stage {stage}
          </span>
          {isValid !== null && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
              {isValid === 'valid' ? (
                <CheckCircle className="w-4 h-4 text-white" />
              ) : isValid === 'warning' ? (
                <span className="text-white text-sm font-bold">⚠</span>
              ) : (
                <XCircle className="w-4 h-4 text-white" />
              )}
            </motion.div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground font-medium">{label}</span>
            <span className="font-orbitron text-lg font-bold text-foreground">
              ${price != null && price !== '' ? Number(price).toFixed(2) : '—'}
            </span>
          </div>

          {marginLabel && (
            <div className="flex items-center justify-between pt-1 border-t border-border/30">
              <span className="text-[11px] text-muted-foreground">{marginLabel}</span>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-sm font-semibold ${marginColor}`}>
                  {displayMargin}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  target: &gt;{displayTarget}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}