import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Rocket } from 'lucide-react';
import { track, EVENTS } from '@/lib/tracking';

const CHIEF_EMAIL = 'mike.todd@dearinassociates.com';
const EMAIL_SUBJECT = 'Ready to go international — RocketPricer';
const EMAIL_BODY = "Hi Mike,\n\nI just ran my pricing through Rocket Pricer and my model passed. I'd love to chat about taking my brand international.\n\nLet's talk!";

export default function LaunchSuccessModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal card */}
          <motion.div
            className="relative z-10 w-full max-w-md rounded-2xl border border-accent/30 bg-card p-8 shadow-2xl text-center space-y-5"
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center">
                <Rocket className="w-8 h-8 text-accent" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="font-orbitron text-xl font-bold text-foreground">
                Launch Clearance Granted!
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Your pricing margins are aligned across all four stages. Your brand has the numbers to go international.
              </p>
            </div>

            <div className="rounded-xl border border-border/50 bg-background/60 p-4 space-y-1 text-left">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">What's next?</p>
              <p className="text-sm text-foreground leading-relaxed">
                Book a discovery call with the Chief Engineer to turn this pricing model into a real market entry strategy.
              </p>
            </div>

            <a
              href={`mailto:${CHIEF_EMAIL}?subject=${encodeURIComponent(EMAIL_SUBJECT)}&body=${encodeURIComponent(EMAIL_BODY)}`}
              onClick={() => track(EVENTS.CTA_CLICK, { source: 'success_modal' })}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-accent px-5 py-3.5 text-sm font-bold text-white hover:bg-accent/90 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Contact the Chief Engineer
            </a>

            <button
              onClick={onClose}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Dismiss
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
