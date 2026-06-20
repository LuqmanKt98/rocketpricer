import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import StarField from './StarField';
import { Rocket, Mail } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const steps = [
  {
    icon: '🎛️',
    title: 'Set Your Prices',
    description:
      "On the left-hand side of the model you'll find four pricing inputs — Factory Price, Distributor Price, Wholesale, and SRRP. Enter your numbers and watch the rocket stages light up in real time.",
  },
  {
    icon: '🚀',
    title: 'Attempt Launch',
    description:
      'Hit the launch button. If your margins are aligned across all four stages, the rocket lifts off and your pricing model is cleared for international take-off.',
  },
  {
    icon: '🔁',
    title: 'Bring Back the Engineers',
    description:
      "If the rocket doesn't launch, don't panic. Hit \"Bring back the Engineers\" to reset the model, adjust your pricing, and go for launch again. You get four attempts to get it right.",
  },
  {
    icon: '👨‍🚀',
    title: 'Still Stuck After Four Tries?',
    description:
      "On your fifth attempt, it's time to speak to the Chief Engineer. That's me — I'll help you work through your pricing strategy and find a model that actually flies.",
  },
];

export default function HowItWorksPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden font-inter flex flex-col items-center justify-center px-6 py-16">
      <StarField />

      {/* Two Deck Logo — top left */}
      <div className="absolute top-4 left-4 z-20">
        <a href="https://twodeck.com/" target="_blank" rel="noopener noreferrer">
          <img
            src="https://media.base44.com/images/public/69c37219f83ff2b34462675d/7ac152773_Two_Deck_Logo_RGB_Reversed.png"
            alt="Two Deck Consulting"
            className="h-14 md:h-24 w-auto"
          />
        </a>
      </div>

      {/* Dearin & Associates Logo — top right */}
      <div className="absolute top-4 right-4 z-20">
        <a href="https://dearinassociates.com/our-team-international-business-consultants/mike/" target="_blank" rel="noopener noreferrer">
          <img
            src="https://media.base44.com/images/public/69c37219f83ff2b34462675d/8ec2678f1_DALogo300dpi.jpg"
            alt="Dearin & Associates"
            className="h-10 md:h-16 w-auto rounded"
          />
        </a>
      </div>

      <div className="relative z-10 max-w-2xl w-full space-y-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-3"
        >
          <span className="text-5xl">🛸</span>
          <h1 className="font-orbitron text-2xl md:text-4xl font-bold text-foreground">
            How It <span className="text-accent">Works</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
            Four numbers. Four stages. One rocket. Here's your mission briefing.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
              className="flex gap-4 rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm p-5"
            >
              <div className="flex-shrink-0 text-2xl mt-0.5">{step.icon}</div>
              <div>
                <h3 className="font-orbitron text-sm font-bold text-foreground mb-1">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Chief Engineer callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.5 }}
          className="rounded-xl border border-accent/30 bg-accent/10 p-6 text-center space-y-3"
        >
          <p className="text-foreground/90 font-semibold text-sm md:text-base">
            Ready to speak to the Chief Engineer?
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            If you've had four cracks at launch and the rocket still won't fly,
            let's talk. Book a discovery call and we'll work through your pricing
            strategy together.
          </p>
          <a
            href="mailto:mike.todd@dearinassociates.com?subject=Rocket%20Pricer%20%E2%80%94%20Discovery%20Call&body=Hi%20Mike%2C%0A%0AI've%20been%20using%20the%20Rocket%20Pricer%20model%20and%20would%20love%20to%20discuss%20my%20pricing%20strategy.%0A%0ALooking%20forward%20to%20connecting."
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-primary-foreground font-bold text-sm rounded-xl shadow-lg shadow-accent/30 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Mail className="w-4 h-4" />
            Contact the Chief Engineer
          </a>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <button
            onClick={() => navigate(isAuthenticated ? '/' : '/landing')}
            className="px-8 py-3 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-all duration-200 text-sm font-medium"
          >
            ← Back
          </button>
          <button
            onClick={() => navigate(isAuthenticated ? '/' : '/signup')}
            className="px-10 py-3 bg-accent hover:bg-accent/90 text-primary-foreground font-bold text-base rounded-xl shadow-lg shadow-accent/30 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 justify-center"
          >
            <Rocket className="w-4 h-4" />
            Launch the Model
          </button>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute bottom-6 flex flex-col items-center gap-3 z-10"
      >
        <span className="text-[11px] text-muted-foreground/50">
          Rocket Pricer™ — International Pricing Validation Tool
        </span>
      </motion.div>
    </div>
  );
}