import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import AlienRefueler from './AlienRefueler';

function Flame({ intensity = 1 }) {
  return (
    <div className="flex flex-col items-center -mt-1">
      <motion.div
        animate={{
          scaleY: [1, 1.3, 0.9, 1.2, 1],
          scaleX: [1, 0.9, 1.1, 0.85, 1],
          opacity: [0.9, 1, 0.85, 1, 0.9],
        }}
        transition={{ duration: 0.3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-8 h-16 rounded-b-full"
        style={{
          background: `linear-gradient(to bottom, #ff6b00, #ff4400, #ff2200, transparent)`,
          filter: `blur(2px) brightness(${intensity})`,
        }}
      />
      <motion.div
        animate={{
          scaleY: [1, 1.5, 0.8, 1.3, 1],
          opacity: [0.6, 0.8, 0.5, 0.7, 0.6],
        }}
        transition={{ duration: 0.2, repeat: Infinity, ease: 'easeInOut' }}
        className="w-5 h-10 rounded-b-full -mt-4"
        style={{
          background: `linear-gradient(to bottom, #ffaa00, #ff6600, transparent)`,
          filter: 'blur(3px)',
        }}
      />
    </div>
  );
}

function SmokeParticle({ delay, x1, x2 }) {
  return (
    <motion.div
      initial={{ opacity: 0.6, scale: 0.3, y: 0, x: 0 }}
      animate={{
        opacity: [0.6, 0.3, 0],
        scale: [0.3, 1.5, 3],
        y: [0, 30, 60],
        x: [0, x1, x2],
      }}
      transition={{ duration: 2, delay, repeat: Infinity, ease: 'easeOut' }}
      className="absolute bottom-0 w-6 h-6 rounded-full bg-white/20"
      style={{ filter: 'blur(6px)' }}
    />
  );
}

export default function RocketVisual({ status, stageStatuses, refueling, alienPhase = 'hidden' }) {
  const [showSmoke, setShowSmoke] = useState(false);

  useEffect(() => {
    setShowSmoke(status === 'launching' || status === 'stuttering');
  }, [status]);

  // Generate random smoke offsets once on mount — avoids re-render thrash in Strict Mode
  const smokeOffsets = useMemo(() =>
    Array.from({ length: 8 }, () => ({
      x1: (Math.random() - 0.5) * 80,
      x2: (Math.random() - 0.5) * 150,
    })), []);

  const stageColorMap = (s, valid, warning, invalid) => {
    if (s === 'valid') return valid;
    if (s === 'warning') return warning;
    return invalid;
  };

  const stageColors = [
    stageColorMap(stageStatuses[0], '#f97316', '#f59e0b', '#374151'),
    stageColorMap(stageStatuses[1], '#eab308', '#f59e0b', '#374151'),
    stageColorMap(stageStatuses[2], '#06b6d4', '#f59e0b', '#374151'),
    stageColorMap(stageStatuses[3], '#8b5cf6', '#f59e0b', '#374151'),
  ];

  const allGood = stageStatuses.every(s => s === 'valid');

  return (
    <div className="relative flex flex-col items-center justify-end h-full min-h-[340px] md:min-h-[480px] lg:min-h-[560px]">
      {/* Alien refueler */}
      <AlienRefueler alienPhase={alienPhase} />

      {/* Smoke effects */}
      <AnimatePresence>
        {showSmoke && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            {smokeOffsets.map((offsets, i) => (
              <SmokeParticle key={i} delay={i * 0.15} x1={offsets.x1} x2={offsets.x2} />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Rocket body */}
      <motion.div
        animate={
          status === 'launching'
            ? { y: [0, -600], opacity: [1, 1, 0.8, 0] }
            : status === 'stalled'
            ? { y: [0, -15, 0, -8, 0, -3, 0], rotate: [0, -2, 2, -1, 1, 0] }
            : status === 'stuttering'
            ? {
                y: [0, -40, 10, -25, 5, -10, 0, -5, 0],
                rotate: [0, -3, 3, -2, 2, -1, 1, 0],
                transition: { duration: 3, ease: 'easeInOut' },
              }
            : { y: 0 }
        }
        transition={
          status === 'launching'
            ? { duration: 3, ease: [0.45, 0, 0.55, 1] }
            : status === 'stalled'
            ? { duration: 1.5, ease: 'easeInOut' }
            : { duration: 0.5 }
        }
        className="relative flex flex-col items-center"
      >
        {/* Nose cone */}
        <div className="relative">
          <div
            className="w-[85px] h-[107px]"
            style={{
              background: allGood
                ? 'linear-gradient(to bottom, #e2e8f0, #94a3b8)'
                : 'linear-gradient(to bottom, #4b5563, #374151)',
              clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
              transition: 'background 0.5s',
            }}
          />
          {/* Earth window */}
          <div className="absolute top-[44px] left-1/2 -translate-x-1/2 w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-300/60"
               style={{ boxShadow: allGood ? '0 0 14px rgba(34,211,238,0.6)' : '0 0 6px rgba(34,211,238,0.2)' }}>
            <motion.img
              src="https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=120&q=80"
              alt="Earth"
              className="w-full h-full object-cover"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              style={{ scale: 1.3 }}
            />
          </div>
        </div>

        {/* Rocket stages — wrapper for liquid fill overlay */}
        <div className="relative">
          {/* Single liquid fill rising from S1 (bottom) to S4 (top) */}
          <AnimatePresence>
            {refueling && (
              <motion.div
                className="absolute left-0 right-0 bottom-0 z-20 pointer-events-none overflow-hidden"
                initial={{ height: '0%' }}
                animate={{ height: '100%' }}
                transition={{ duration: 4, ease: [0.3, 0, 0.15, 1] }}
              >
                {/* Wave surface */}
                <motion.div
                  className="absolute top-0 left-0 right-0 h-4"
                  style={{
                    background: 'rgba(56,189,248,0.7)',
                    borderRadius: '50%',
                    filter: 'blur(3px)',
                  }}
                  animate={{ scaleX: [1, 1.08, 0.94, 1.05, 0.97, 1], y: [0, -3, 2, -2, 1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Liquid body */}
                <div
                  className="absolute top-2 left-0 right-0 bottom-0"
                  style={{ background: 'linear-gradient(to top, rgba(14,165,233,0.6), rgba(56,189,248,0.35))' }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {[3, 2, 1, 0].map((i, mapIdx) => (
            <motion.div
              key={i}
              className="w-[85px] h-[85px] border-x border-border/20 relative"
              animate={{
                backgroundColor: refueling ? '#1e293b' : stageColors[i],
                boxShadow: !refueling && stageStatuses[i] && stageStatuses[i] !== 'invalid'
                  ? `0 0 20px ${stageColors[i]}66`
                  : '0 0 0px transparent',
              }}
              transition={{
                duration: 0.8,
                delay: refueling ? 0 : (3 - mapIdx) * 0.5,
                ease: 'easeInOut',
              }}
            >
              <div className="w-full h-full flex items-center justify-center relative z-30">
                <motion.span
                  className="text-base font-orbitron font-bold text-white/90"
                  animate={{ opacity: refueling ? 0 : 1 }}
                  transition={{
                    duration: 0.6,
                    delay: refueling ? 0 : (3 - mapIdx) * 0.5 + 0.4,
                  }}
                >
                  S{i + 1}
                </motion.span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Fins */}
        <div className="relative w-[85px] -mt-0.5">
          <div className="absolute -left-6 bottom-0 w-7 h-16"
            style={{
              background: 'linear-gradient(to right, #ef4444, #dc2626)',
              clipPath: 'polygon(100% 0%, 100% 100%, 0% 100%)',
            }}
          />
          <div className="absolute -right-6 bottom-0 w-7 h-16"
            style={{
              background: 'linear-gradient(to left, #ef4444, #dc2626)',
              clipPath: 'polygon(0% 0%, 0% 100%, 100% 100%)',
            }}
          />
          <div className="w-full h-5 bg-gray-600 rounded-b-sm" />
        </div>

        {/* Flame when launching */}
        <AnimatePresence>
          {(status === 'launching' || status === 'stalled') && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: status === 'stalled' ? 0.5 : 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              <Flame intensity={status === 'launching' ? 1.5 : 0.7} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Launch pad */}
      <div className="flex flex-col items-center mt-1">
        {/* Pad top platform */}
        <div className="w-[149px] h-4 bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 rounded-sm" />
        {/* Pad legs */}
        <div className="flex gap-8">
          <div className="w-3 h-[53px] bg-gray-500" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' }} />
          <div className="w-3 h-[53px] bg-gray-500" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' }} />
        </div>
        {/* Pad base */}
        <div className="w-48 h-2 bg-gradient-to-r from-transparent via-gray-500 to-transparent rounded-full" />
      </div>
    </div>
  );
}
