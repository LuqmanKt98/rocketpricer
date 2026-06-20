import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import StarField from './StarField';
import { X } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [showBetaModal, setShowBetaModal] = useState(false);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden font-inter flex flex-col">
      <StarField />

      {/* Header bar — logos */}
      <div className="relative z-20 flex items-center justify-between px-4 pt-4">
        {/* Two Deck Logo — top left, links to twodeck.com */}
        <a href="https://www.twodeck.com" target="_blank" rel="noopener noreferrer">
          <img
            src="https://media.base44.com/images/public/69c37219f83ff2b34462675d/7ac152773_Two_Deck_Logo_RGB_Reversed.png"
            alt="Two Deck Consulting"
            className="h-14 md:h-40 lg:h-24 w-auto"
          />
        </a>

        {/* Dearin & Associates Logo — top right */}
        <a href="https://dearinassociates.com/our-team-international-business-consultants/mike/" target="_blank" rel="noopener noreferrer">
          <img
            src="https://media.base44.com/images/public/69c37219f83ff2b34462675d/8ec2678f1_DALogo300dpi.jpg"
            alt="Dearin & Associates"
            className="h-10 md:h-16 w-auto rounded"
          />
        </a>
      </div>

      {/* Main content — centred in remaining space */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-8 w-full">
        <div className="max-w-xl w-full text-center space-y-6 mx-auto flex flex-col items-center justify-center">
          {/* Rocket icon */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            <span className="text-6xl md:text-7xl">🚀</span>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h1 className="font-orbitron text-3xl md:text-5xl font-bold text-foreground leading-tight">
              Will It <span className="text-accent">Fly…</span>
              <br />or <span className="text-destructive">Fail?</span>
            </h1>
          </motion.div>

          {/* Subheadline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="space-y-1"
          >
            <p className="text-lg md:text-xl font-semibold text-foreground/90">
              4 numbers decide everything.
            </p>
            <p className="text-base md:text-lg text-muted-foreground">
              Factory. Distributor. Wholesale. SRRP.
            </p>
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="w-24 h-px bg-accent/50 mx-auto"
          />

          {/* Body */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
            className="space-y-1"
          >
            <p className="text-base md:text-lg text-foreground/80">Enter your pricing.</p>
            <p className="text-base md:text-lg text-foreground/80">Get your answer.</p>
          </motion.div>

          {/* CTA — moved up before Beta badge so it doesn't obscure text below */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="space-y-3"
          >
            <button
              onClick={() => navigate('/signup')}
              className="w-full md:w-auto px-10 py-4 bg-accent hover:bg-accent/90 text-primary-foreground font-bold text-lg rounded-xl shadow-lg shadow-accent/30 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Test Your Model
            </button>
            <div className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/signin')}
                className="text-accent hover:underline font-semibold transition-colors"
              >
                Sign in
              </button>
            </div>
          </motion.div>

          {/* Beta badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85, duration: 0.6 }}
            className="flex justify-center"
          >
            <button
              onClick={() => setShowBetaModal(true)}
              className="text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full border border-accent/40 text-accent bg-accent/10 hover:bg-accent/20 transition-colors cursor-pointer"
            >
              Limited Beta Access
            </button>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="relative z-10 flex flex-col items-center pb-6"
      >
        <span className="text-[11px] text-muted-foreground/50">
          Rocket Pricer™ — International Pricing Validation Tool
        </span>
      </motion.div>

      {/* Beta Modal */}
      <AnimatePresence>
        {showBetaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            onClick={() => setShowBetaModal(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 max-w-md w-full bg-card border border-border/50 rounded-2xl p-8 shadow-2xl text-left space-y-4"
            >
              <button
                onClick={() => setShowBetaModal(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-3xl">🛸</div>

              <h2 className="font-orbitron text-lg font-bold text-foreground">
                What does <span className="text-accent">Beta</span> mean?
              </h2>

              <p className="text-muted-foreground text-sm leading-relaxed">
                Beta means you're seeing the product as the founder imagined it — raw, real, and full of vision.
                This is what's known as a <span className="text-foreground font-semibold">vibe-coded product</span>:
                built on instinct, shaped by experience, and not quite finished yet.
              </p>

              <p className="text-muted-foreground text-sm leading-relaxed">
                The man behind the madness is{' '}
                <a
                  href="https://www.linkedin.com/in/miketodd101/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground font-semibold underline underline-offset-2 hover:text-accent transition-colors"
                >
                  Mike Todd
                </a>.
                He is not mad. Well… <em>maybe a little.</em> But the thinking is sound —
                so if the app grumbles at you, please cut him a little slack.
                He's working on it. Probably right now.
              </p>

              <div className="pt-2 border-t border-border/30 text-xs text-muted-foreground/60 italic">
                "Vision first. Polish later." — Mike Todd, Chief Engineer
              </div>

              <button
                onClick={() => setShowBetaModal(false)}
                className="w-full mt-2 py-2.5 rounded-xl bg-accent/20 hover:bg-accent/30 text-accent font-semibold text-sm transition-colors"
              >
                Got it — carry on! 🚀
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}