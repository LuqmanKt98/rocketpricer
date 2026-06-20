import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { playLaunchSound, playRefuelSound } from '../utils/sounds';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, RotateCcw, Mail, LogOut, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import StarField from '../components/StarField';
import RocketStage from '../components/RocketStage';
import RocketVisual from '../components/RocketVisual';
import PricingInput from '../components/PricingInput';
import LaunchSuccessModal from '../components/LaunchSuccessModal';
import { useAuth } from '@/lib/AuthContext';
import { track, EVENTS } from '@/lib/tracking';

// Margin thresholds
const STUTTER_LOW = 0.35;   // below this = fail
const STUTTER_HIGH = 0.40;  // above this = launch, between = stutter
const RETAIL_TARGET = 0.50; // retail margin must meet or exceed this
const MAX_ATTEMPTS = 4;

const CHIEF_EMAIL = 'mike.todd@dearinassociates.com';
const CHIEF_EMAIL_SUBJECT = 'Ready to go international — RocketPricer';
const CHIEF_EMAIL_BODY = "Hi Mike,\n\nI've been testing my pricing on Rocket Pricer and I'd love to chat about taking my brand international.\n\nLet's talk!";

// Returns 'valid', 'warning', or 'invalid' for S2/S3 distributor-type margins
function classifyMargin(margin) {
  if (margin > STUTTER_HIGH) return 'valid';
  if (margin >= STUTTER_LOW) return 'warning';
  return 'invalid';
}

// Returns 'valid', 'warning', or 'invalid' for Stage 4 retail margin (≥50% = valid, 45–50% = warning)
function classifyS4(margin) {
  if (margin >= RETAIL_TARGET) return 'valid';
  if (margin >= 0.45) return 'warning';
  return 'invalid';
}

// Computes each stage independently — an empty field nulls only that stage
function calcMargins(factoryPrice, distributorPrice, wholesale, srrp) {
  const fp = parseFloat(factoryPrice);
  const dp = parseFloat(distributorPrice);
  const ws = parseFloat(wholesale);
  const sr = parseFloat(srrp);

  const fpOk = !isNaN(fp) && fp > 0;
  const dpOk = !isNaN(dp) && dp > 0;
  const wsOk = !isNaN(ws) && ws > 0;
  const srOk = !isNaN(sr) && sr > 0;

  const s1 = fpOk ? 'valid' : (factoryPrice === '' ? null : 'invalid');
  const s2 = dpOk && fpOk ? classifyMargin((dp - fp) / dp) : (distributorPrice === '' ? null : 'invalid');
  const s3 = wsOk && dpOk ? classifyMargin((ws - dp) / ws) : (wholesale === '' ? null : 'invalid');
  const s4 = srOk && wsOk ? classifyS4((sr - ws) / sr) : (srrp === '' ? null : 'invalid');

  const intlMargin = fpOk && dpOk ? (dp - fp) / dp : null;
  const distributorMargin = dpOk && wsOk ? (ws - dp) / ws : null;
  const retailMargin = wsOk && srOk ? (sr - ws) / sr : null;
  const markUp = wsOk && srOk ? sr / ws : null;

  return { stages: [s1, s2, s3, s4], margins: { intlMargin, distributorMargin, retailMargin, markUp } };
}

export default function RocketPricer() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [factoryPrice, setFactoryPrice] = useState('15');
  const [distributorPrice, setDistributorPrice] = useState('27');
  const [wholesale, setWholesale] = useState('50');
  const [srrp, setSrrp] = useState('100');
  const [rocketStatus, setRocketStatus] = useState('idle');
  const [resetKey, setResetKey] = useState(0);
  const [refueling, setRefueling] = useState(false);
  const [alienPhase, setAlienPhase] = useState('hidden');
  const [attemptCount, setAttemptCount] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { stages, margins } = calcMargins(factoryPrice, distributorPrice, wholesale, srrp);
  const allValid = stages.every(s => s === 'valid');
  const anyStutter = !allValid && stages.every(s => s === 'valid' || s === 'warning') && stages.some(s => s === 'warning');
  const anyEntered = [factoryPrice, distributorPrice, wholesale, srrp].some(v => v !== '');
  const attemptsExhausted = attemptCount >= MAX_ATTEMPTS && !allValid;

  // Inline price-order validation
  const fp = parseFloat(factoryPrice);
  const dp = parseFloat(distributorPrice);
  const ws = parseFloat(wholesale);
  const sr = parseFloat(srrp);
  const pricingErrors = {
    s2: !isNaN(dp) && dp > 0 && !isNaN(fp) && fp > 0 && dp <= fp ? 'Must be higher than Factory price' : null,
    s3: !isNaN(ws) && ws > 0 && !isNaN(dp) && dp > 0 && ws <= dp ? 'Must be higher than Distributor price' : null,
    s4: !isNaN(sr) && sr > 0 && !isNaN(ws) && ws > 0 && sr <= ws ? 'Must be higher than Wholesale price' : null,
  };

  // Declare handlers before effects that reference them
  const handleLaunch = useCallback(() => {
    const result = allValid ? 'launched' : anyStutter ? 'stuttered' : 'stalled';
    track(EVENTS.LAUNCH_ATTEMPT, {
      result,
      prices: [factoryPrice, distributorPrice, wholesale, srrp],
      stages,
      margins,
      attempt_number: allValid ? attemptCount : attemptCount + 1,
    });
    if (!allValid && attemptCount + 1 >= MAX_ATTEMPTS) {
      track(EVENTS.ATTEMPTS_EXHAUSTED, { attempts: attemptCount + 1 });
    }

    if (allValid) {
      setRocketStatus('launching');
      playLaunchSound();
      setTimeout(() => {
        setRocketStatus('launched');
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
        setTimeout(() => setShowSuccessModal(true), 600);
      }, 3200);
    } else if (anyStutter) {
      setAttemptCount(c => c + 1);
      setRocketStatus('stuttering');
      setTimeout(() => setRocketStatus('idle'), 3000);
    } else {
      setAttemptCount(c => c + 1);
      setRocketStatus('stalled');
      setTimeout(() => setRocketStatus('idle'), 2000);
    }
  }, [allValid, anyStutter, factoryPrice, distributorPrice, wholesale, srrp, stages, margins, attemptCount]);

  const handleReset = useCallback(() => {
    if (alienPhase !== 'hidden') return;

    setFactoryPrice('');
    setDistributorPrice('');
    setWholesale('');
    setSrrp('');
    setRocketStatus('idle');
    setResetKey(k => k + 1);
    setAttemptCount(0);
    setShowSuccessModal(false);

    setAlienPhase('walk-in');

    setTimeout(() => {
      setAlienPhase('refueling');
      setRefueling(true);
      playRefuelSound();
    }, 1400);

    setTimeout(() => {
      setFactoryPrice('15');
      setDistributorPrice('27');
      setWholesale('50');
      setSrrp('100');
      setRefueling(false);
    }, 5400);

    setTimeout(() => {
      setAlienPhase('walk-out');
    }, 5800);

    setTimeout(() => {
      setAlienPhase('hidden');
    }, 7200);
  }, [alienPhase]);

  useEffect(() => {
    if (rocketStatus === 'launching' || rocketStatus === 'launched' || rocketStatus === 'stalled') return;
    if (allValid && anyEntered) {
      setRocketStatus('ready');
    } else {
      setRocketStatus('idle');
    }
  }, [allValid, anyEntered, stages, rocketStatus]);

  // Keyboard Enter shortcut for launch
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' && !attemptsExhausted && rocketStatus !== 'launching' && rocketStatus !== 'stuttering') {
        handleLaunch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleLaunch, attemptsExhausted, rocketStatus]);

  const statusMessages = {
    idle: anyEntered ? 'Adjust your prices and attempt launch' : 'Set all 4 prices to check your model',
    ready: 'All systems go — ready for liftoff!',
    launching: 'Ignition sequence started... 🚀',
    stuttering: 'Margins in warning zone (35–40%) — rocket stutters!',
    stalled: 'Launch aborted — pricing margins are off!',
    launched: 'Well done, you are going international! 🌍',
  };

  const stageData = [
    {
      stage: 1, label: 'US$ Factory Price', price: factoryPrice,
      marginLabel: null, marginValue: null, targetMargin: null,
      isValid: stages[0],
    },
    {
      stage: 2, label: 'Distributor Price (US$)', price: distributorPrice,
      marginLabel: "Int'l Margin (gross)", marginValue: margins.intlMargin,
      targetMargin: STUTTER_HIGH, isValid: stages[1],
    },
    {
      stage: 3, label: 'US Wholesale (WS)', price: wholesale,
      marginLabel: 'Distributor Margin', marginValue: margins.distributorMargin,
      targetMargin: STUTTER_HIGH, isValid: stages[2],
    },
    {
      stage: 4, label: 'US SRRP (Retail Price)', price: srrp,
      marginLabel: 'Retail Margin', marginValue: margins.retailMargin,
      targetMargin: RETAIL_TARGET, isValid: stages[3],
    },
  ];

  const launchButtonLabel = allValid ? '🟢 GO FOR LAUNCH' : attemptsExhausted ? '⛔ ATTEMPTS EXHAUSTED' : '🟠 ATTEMPT LAUNCH';
  const launchButtonSubtext = attemptsExhausted
    ? 'Contact the Chief Engineer to continue'
    : !allValid && attemptCount > 0
    ? `Attempt ${attemptCount} of ${MAX_ATTEMPTS} — ${statusMessages[rocketStatus] || statusMessages.idle}`
    : statusMessages[rocketStatus] || statusMessages.idle;

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden font-inter">
      <StarField />

      <LaunchSuccessModal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} />

      {/* Two Deck logo — top left (hidden on mobile) */}
      <div className="absolute top-4 left-4 z-20 hidden md:block">
        <a href="https://twodeck.com/" target="_blank" rel="noopener noreferrer">
          <img
            src="https://media.base44.com/images/public/69c37219f83ff2b34462675d/7ac152773_Two_Deck_Logo_RGB_Reversed.png"
            alt="Two Deck Consulting"
            className="h-12 md:h-24 w-auto"
          />
        </a>
      </div>

      {/* User pill / logout — top right */}
      {user && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-2 rounded-full bg-card/60 border border-border/40 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => navigate('/how-it-works')}
            title="How it works"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-card/80 text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">How it works</span>
          </button>
          <span className="hidden md:inline text-xs text-muted-foreground/60">|</span>
          <span className="text-xs text-muted-foreground hidden md:inline max-w-[160px] truncate">
            {user.email || user.full_name || 'Signed in'}
          </span>
          <button
            type="button"
            onClick={() => logout()}
            title="Log out"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/15 hover:bg-accent/25 text-accent text-xs font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      )}

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-orbitron text-3xl md:text-5xl font-bold text-foreground tracking-tight">
            Rocket <span className="text-accent">Pricer</span><sup className="text-xl text-muted-foreground align-super">™</sup>
          </h1>
          <p className="text-muted-foreground mt-3 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Set your pricing across all 4 stages. If margins align, your rocket launches —
            and your brand goes international.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left column — Inputs (appears below rocket on mobile via order) */}
          <div className="lg:col-span-4 space-y-4 order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm p-5 space-y-4"
            >
              <h2 className="font-orbitron text-xs font-bold text-muted-foreground tracking-widest uppercase">
                Pricing Controls
              </h2>
              <PricingInput
                label="Stage 1 — Factory Price (US$)"
                value={factoryPrice}
                onChange={setFactoryPrice}
                placeholder="15.00"
                tooltip="Your product cost from the manufacturer before any markup"
                description="What you pay to make it"
              />
              <PricingInput
                label="Stage 2 — Distributor Price (US$)"
                value={distributorPrice}
                onChange={setDistributorPrice}
                placeholder="27.00"
                tooltip="Price you sell to your US distributor. Margin = (Dist − Factory) ÷ Dist. Target: >40%"
                description="What your US distributor pays you"
                error={pricingErrors.s2}
              />
              <PricingInput
                label="Stage 3 — Wholesale Price (US$)"
                value={wholesale}
                onChange={setWholesale}
                placeholder="50.00"
                tooltip="Price from distributor to US retailer. Margin = (WS − Dist) ÷ WS. Target: >40%"
                description="What US retailers pay the distributor"
                error={pricingErrors.s3}
              />
              <PricingInput
                label="Stage 4 — SRRP (US$)"
                value={srrp}
                onChange={setSrrp}
                placeholder="100.00"
                tooltip="Suggested Retail/Shelf Price — what consumers pay. Retail margin = (SRRP − WS) ÷ SRRP. Target: ≥50%"
                description="Shelf price consumers pay"
                error={pricingErrors.s4}
              />

              {/* Launch button — swaps to CTA when attempts exhausted */}
              <AnimatePresence mode="wait">
                {attemptsExhausted ? (
                  <motion.a
                    key="cta-button"
                    href={`mailto:${CHIEF_EMAIL}?subject=${encodeURIComponent(CHIEF_EMAIL_SUBJECT)}&body=${encodeURIComponent(CHIEF_EMAIL_BODY)}`}
                    onClick={() => track(EVENTS.CTA_CLICK, { source: 'exhausted_button' })}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full mt-2 rounded-xl px-5 py-4 flex items-center gap-4 bg-accent hover:bg-accent/90 transition-all duration-300 shadow-lg shadow-orange-900/40"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold text-sm tracking-wide">Contact the Chief Engineer</div>
                      <div className="text-white/80 text-xs mt-0.5 leading-snug">
                        You've used all {MAX_ATTEMPTS} attempts — let's talk strategy
                      </div>
                    </div>
                  </motion.a>
                ) : (
                  <motion.button
                    key="launch-button"
                    onClick={handleLaunch}
                    disabled={rocketStatus === 'launching' || rocketStatus === 'stuttering'}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full mt-2 rounded-xl px-5 py-4 flex items-center gap-4 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed
                      ${
                        allValid
                          ? 'bg-green-700 hover:bg-green-600 shadow-lg shadow-green-900/40'
                          : anyStutter
                          ? 'bg-[#F7931D] hover:bg-[#FFAC4A] shadow-lg shadow-orange-900/40'
                          : 'bg-[#2835AB] hover:bg-[#4550B4] shadow-lg shadow-blue-900/40'
                      }`}
                  >
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                      ${allValid ? 'bg-green-500/40' : anyStutter ? 'bg-[#FFBF73]/30' : 'bg-white/20'}`}>
                      <Rocket className={`w-6 h-6 text-white ${rocketStatus === 'launching' ? 'animate-bounce' : ''}`} />
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold text-sm tracking-wide">{launchButtonLabel}</div>
                      <div className="text-white/80 text-xs mt-0.5 leading-snug">{launchButtonSubtext}</div>
                    </div>
                  </motion.button>
                )}
              </AnimatePresence>

              <button
                onClick={handleReset}
                disabled={alienPhase !== 'hidden'}
                className="w-full mt-2 rounded-xl px-5 py-3 flex items-center gap-3 bg-red-700 hover:bg-red-600 transition-all duration-300 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-semibold tracking-wide">Bring back the Engineers</span>
              </button>
            </motion.div>
          </div>

          {/* Center column — Rocket visual (first on mobile via order-1) */}
          <div className="lg:col-span-4 flex items-center justify-center order-1 lg:order-2">
            <div className="w-full max-w-[320px]">
              <RocketVisual
                key={resetKey}
                status={rocketStatus}
                stageStatuses={stages}
                refueling={refueling}
                alienPhase={alienPhase}
              />
            </div>
          </div>

          {/* Right column — Stage readouts (S1 → S4 natural reading order) */}
          <div className="lg:col-span-4 space-y-3 order-3">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-orbitron text-xs font-bold text-muted-foreground tracking-widest uppercase mb-1"
            >
              Stage Readout
            </motion.h2>
            {stageData.map((s, i) => (
              <RocketStage key={s.stage} {...s} index={i} />
            ))}

            {/* Persistent CTA card */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-2 rounded-xl border border-accent/25 bg-accent/5 p-4 space-y-2 text-center"
            >
              <p className="text-xs font-semibold text-accent uppercase tracking-wider">Ready to go international?</p>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Turn your pricing model into a real market entry strategy.
              </p>
              <a
                href={`mailto:${CHIEF_EMAIL}?subject=${encodeURIComponent(CHIEF_EMAIL_SUBJECT)}&body=${encodeURIComponent(CHIEF_EMAIL_BODY)}`}
                onClick={() => track(EVENTS.CTA_CLICK, { source: 'sidebar_card' })}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Contact the Chief Engineer →
              </a>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col items-center gap-4 mt-12"
        >
          <a href="https://dearinassociates.com/our-team-international-business-consultants/mike/" target="_blank" rel="noopener noreferrer">
            <img
              src="https://media.base44.com/images/public/69c37219f83ff2b34462675d/8ec2678f1_DALogo300dpi.jpg"
              alt="Dearin & Associates"
              className="h-8 md:h-9 w-auto rounded"
            />
          </a>
          {/* Two Deck logo — mobile only */}
          <a href="https://twodeck.com/" target="_blank" rel="noopener noreferrer" className="md:hidden">
            <img
              src="https://media.base44.com/images/public/69c37219f83ff2b34462675d/7ac152773_Two_Deck_Logo_RGB_Reversed.png"
              alt="Two Deck Consulting"
              className="h-12 w-auto"
            />
          </a>
          <span className="text-[11px] text-muted-foreground/50">
            Rocket Pricer™ — International Pricing Validation Tool
          </span>
        </motion.div>
      </div>
    </div>
  );
}
