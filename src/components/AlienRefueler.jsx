import { motion, AnimatePresence } from 'framer-motion';

function Alien({ flipped = false, armUp = false }) {
  return (
    <svg
      width="52"
      height="68"
      viewBox="0 0 52 68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: flipped ? 'scaleX(-1)' : 'scaleX(1)' }}
    >
      {/* Body */}
      <ellipse cx="26" cy="42" rx="13" ry="14" fill="#4ade80" />
      {/* Head */}
      <ellipse cx="26" cy="22" rx="16" ry="14" fill="#86efac" />
      {/* Eyes */}
      <ellipse cx="19" cy="20" rx="5" ry="6" fill="#000" />
      <ellipse cx="33" cy="20" rx="5" ry="6" fill="#000" />
      {/* Eye shine */}
      <circle cx="21" cy="18" r="2" fill="#fff" />
      <circle cx="35" cy="18" r="2" fill="#fff" />
      {/* Antennae */}
      <line x1="20" y1="9" x2="14" y2="3" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="3" r="2.5" fill="#f0abfc" />
      <line x1="32" y1="9" x2="38" y2="3" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
      <circle cx="38" cy="3" r="2.5" fill="#f0abfc" />
      {/* Legs */}
      <rect x="19" y="54" width="5" height="12" rx="2.5" fill="#4ade80" />
      <rect x="28" y="54" width="5" height="12" rx="2.5" fill="#4ade80" />
      {/* Feet */}
      <ellipse cx="21.5" cy="66" rx="5" ry="2.5" fill="#86efac" />
      <ellipse cx="30.5" cy="66" rx="5" ry="2.5" fill="#86efac" />
      {/* Left arm */}
      <path d="M13 41 Q6 46 8 52" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Right arm — raised toward rocket when fueling */}
      {armUp ? (
        <path d="M39 39 Q50 28 48 18" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M39 41 Q46 46 44 52" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" fill="none" />
      )}
      {/* Hand / nozzle connector */}
      {armUp && (
        <>
          <circle cx="48" cy="18" r="4" fill="#fbbf24" />
          <circle cx="48" cy="18" r="2" fill="#f59e0b" />
        </>
      )}
    </svg>
  );
}

/**
 * alienPhase:
 *   'hidden'     — not visible
 *   'walk-in'    — walking in from the right
 *   'refueling'  — standing with arm up, plugged in with hose
 *   'walk-out'   — walking off to the right
 */
export default function AlienRefueler({ alienPhase }) {
  const isVisible = alienPhase !== 'hidden';
  const armUp = alienPhase === 'refueling';
  const walkingOut = alienPhase === 'walk-out';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="alien"
          className="absolute z-30 pointer-events-none"
          style={{ bottom: '72px', right: '-4px' }}
          initial={{ x: 140, opacity: 0 }}
          animate={
            alienPhase === 'walk-in'
              ? { x: 8, opacity: 1, transition: { duration: 1.2, ease: 'easeOut' } }
              : alienPhase === 'refueling'
              ? { x: 8, opacity: 1 }
              : alienPhase === 'walk-out'
              ? { x: 200, opacity: 0, transition: { duration: 1.2, ease: 'easeIn' } }
              : { x: 140, opacity: 0 }
          }
          exit={{ x: 200, opacity: 0, transition: { duration: 0.8 } }}
        >
          {/* Hose — only visible when refueling, drawn behind alien */}
          {armUp && (
            <svg
              className="absolute pointer-events-none"
              style={{ top: '-10px', right: '42px', width: '80px', height: '90px', zIndex: -1 }}
              viewBox="0 0 80 90"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              overflow="visible"
            >
              {/* Hose tube — curves from alien hand tip to rocket S1 side */}
              <motion.path
                d="M 70 28 C 60 20, 30 10, 0 30"
                stroke="#fbbf24"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
              {/* Hose highlight */}
              <motion.path
                d="M 70 28 C 60 20, 30 10, 0 30"
                stroke="#fde68a"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
              />
              {/* Rocket nozzle plug */}
              <motion.circle
                cx="0" cy="30" r="5"
                fill="#f59e0b"
                stroke="#fbbf24"
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
              />
              {/* Liquid flow dots */}
              {[0, 1, 2].map((i) => (
                <motion.circle
                  key={i}
                  cx="0" cy="0" r="3"
                  fill="#38bdf8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 1, 0] }}
                  transition={{
                    duration: 1.2,
                    delay: i * 0.4,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{
                    offsetPath: "path('M 70 28 C 60 20, 30 10, 0 30')",
                    offsetDistance: `${i * 33}%`,
                  }}
                />
              ))}
            </svg>
          )}

          {/* Walking bounce */}
          <motion.div
            animate={
              alienPhase === 'walk-in' || alienPhase === 'walk-out'
                ? { y: [0, -6, 0, -6, 0], transition: { duration: 0.5, repeat: Infinity } }
                : alienPhase === 'refueling'
                ? { y: [0, -2, 0], transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } }
                : { y: 0 }
            }
          >
            <Alien flipped={walkingOut} armUp={armUp} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}