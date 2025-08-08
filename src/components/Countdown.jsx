import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import PropTypes from "prop-types";

/**
 * Countdown (animated)
 *
 * - Mantém lógica start -> target (start fixado 08/08/2025 00:01)
 * - Progress ring animado com spring
 * - Partículas + confete com movimentos suaves
 * - Sem overflow horizontal (mobile friendly)
 */

export default function Countdown({ targetDate, onComplete }) {
  // parse timestamps
  const targetTimestamp = useMemo(() => {
    if (targetDate instanceof Date && !Number.isNaN(targetDate.getTime())) return targetDate.getTime();
    const parsed = new Date(targetDate);
    return Number.isNaN(parsed.getTime()) ? Date.now() : parsed.getTime();
  }, [targetDate]);

  const startTimestamp = useMemo(() => new Date(2025, 7, 8, 0, 1, 0, 0).getTime(), []);

  const totalSpan = Math.max(targetTimestamp - startTimestamp, 1);

  // particle presets (stable)
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }).map(() => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        dx: Math.random() * 80 - 40,
        dy: Math.random() * 40 - 20,
        delay: Math.random() * 2,
        dur: 3 + Math.random() * 3,
        scale: 0.6 + Math.random() * 1.1,
        opacityPeak: 0.4 + Math.random() * 0.6,
      })),
    []
  );

  const confetti = useMemo(
    () =>
      Array.from({ length: 18 }).map(() => ({
        left: `${8 + Math.random() * 84}%`,
        color: ["#f472b6", "#a855f7", "#06b6d4", "#f59e0b"][Math.floor(Math.random() * 4)],
        delay: Math.random() * 0.6,
        dur: 1.2 + Math.random() * 0.8,
        x: Math.random() * 160 - 80,
        y: 240 + Math.random() * 160,
        rotate: Math.random() * 360,
      })),
    []
  );

  // state/time
  const [timeLeft, setTimeLeft] = useState(() => {
    const distance = Math.max(targetTimestamp - Date.now(), 0);
    const d = Math.floor(distance / (1000 * 60 * 60 * 24));
    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((distance % (1000 * 60)) / 1000);
    return { d, h, m, s, secs: Math.floor(distance / 1000) };
  });
  const [isComplete, setIsComplete] = useState(() => targetTimestamp - Date.now() <= 0);

  // raw progress (0..100) and smoothed motion value
  const [rawProgress, setRawProgress] = useState(() => {
    const now = Date.now();
    if (now < startTimestamp) return 0;
    if (now >= targetTimestamp) return 100;
    return Math.min(100, Math.max(0, ((now - startTimestamp) / totalSpan) * 100));
  });

  // motion value & spring for smooth ring animation
  const progressMV = useMotionValue(rawProgress);
  const smooth = useSpring(progressMV, { stiffness: 120, damping: 18, mass: 0.8 });
  // dash offset transform will be defined after circumference computed below via useTransform in render scope

  const intervalRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const distance = Math.max(targetTimestamp - now, 0);

      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft({ d, h, m, s, secs: Math.floor(distance / 1000) });

      let newRaw;
      if (now < startTimestamp) newRaw = 0;
      else if (now >= targetTimestamp) newRaw = 100;
      else newRaw = Math.min(100, Math.max(0, ((now - startTimestamp) / totalSpan) * 100));
      setRawProgress(newRaw);
      progressMV.set(newRaw);

      if (distance <= 0 && !isComplete) {
        setIsComplete(true);
        setTimeout(() => {
          if (typeof onCompleteRef.current === "function") onCompleteRef.current();
        }, 900);
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetTimestamp, startTimestamp, totalSpan]);

  // main unit selection
  const getMainUnit = () => {
    if (timeLeft.d > 0) return { value: timeLeft.d, label: "DIAS" };
    if (timeLeft.h > 0) return { value: timeLeft.h, label: "HORAS" };
    if (timeLeft.m > 0) return { value: timeLeft.m, label: "MINUTOS" };
    return { value: timeLeft.s, label: "SEGUNDOS" };
  };
  const mainUnit = getMainUnit();

  // ring geometry
  const R = 85;
  const circumference = 2 * Math.PI * R;
  const dashOffsetMV = useTransform(smooth, (p) => circumference - (circumference * p) / 100);

  // helpers
  const pad = (n) => String(n).padStart(2, "0");

  // small staggered animation config for grid
  const cellStagger = { type: "spring", stiffness: 200, damping: 20 };

  // render
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-x-hidden">
      {/* subtle animated overlay to give depth */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ duration: 1.2 }}
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 10% 10%, rgba(244,114,182,0.04), transparent 10%), radial-gradient(ellipse at 90% 90%, rgba(168,85,247,0.03), transparent 12%)",
          pointerEvents: "none",
        }}
        aria-hidden
      />

      {isComplete ? (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="relative w-full max-w-md mx-auto text-center">
            {/* celebration confetti */}
            <div className="absolute inset-0 pointer-events-none">
              {confetti.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -40, opacity: 0, rotate: 0, x: 0 }}
                  animate={{ y: c.y, opacity: [1, 0.9, 0], rotate: c.rotate, x: c.x }}
                  transition={{ delay: c.delay + i * 0.02, duration: c.dur, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    left: c.left,
                    top: "-10%",
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: c.color,
                    transformOrigin: "center",
                  }}
                  aria-hidden
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.2, 0.9, 0.3, 1] }}
              className="relative z-10 bg-white/6 backdrop-blur-md rounded-3xl p-8"
            >
              <div className="text-7xl mb-4">🎉</div>
              <h1 className="text-2xl font-bold text-white mb-2">É hora da magia!</h1>
              <div className="h-1 bg-gradient-to-r from-rose-500 to-purple-400 rounded-full mx-auto my-4" />
              <p className="text-slate-300">Sua jornada especial pode começar, Vitória! 💖</p>
            </motion.div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 min-h-screen flex flex-col justify-center items-center p-4">
          {/* particles behind */}
          <div className="absolute inset-0 pointer-events-none">
            {particles.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  x: [0, p.dx, 0],
                  y: [0, p.dy, 0],
                  opacity: [0, p.opacityPeak, 0],
                  scale: [0, p.scale, 0],
                }}
                transition={{
                  duration: p.dur,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: "easeInOut",
                }}
                style={{
                  position: "absolute",
                  left: p.left,
                  top: p.top,
                  width: 3,
                  height: 3,
                  borderRadius: 999,
                  background: "rgba(244,114,182,0.28)",
                }}
                aria-hidden
              />
            ))}
          </div>

          {/* header */}
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6"
          >
            <motion.div
              animate={{ rotate: [0, 4, -4, 0], scale: [1, 1.03, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-6xl mb-2"
              aria-hidden
            >
              ✨
            </motion.div>

            <p className="text-slate-400 text-sm mb-1 tracking-wide">Surpresinha da melhor forma</p>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent">Vih</h1>
          </motion.div>

          {/* main ring */}
          <div className="w-full flex flex-col items-center">
            <div className="relative w-52 h-52 sm:w-56 sm:h-56">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500/20 to-purple-500/20 blur-lg animate-pulse" />

              <svg viewBox="0 0 192 192" className="w-full h-full transform -rotate-90 relative z-10" aria-hidden>
                <circle cx="96" cy="96" r={R} stroke="rgba(148,163,184,0.12)" strokeWidth="2" fill="none" />
                <motion.circle
                  cx="96"
                  cy="96"
                  r={R}
                  stroke="url(#gradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  style={{ strokeDashoffset: dashOffsetMV }}
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f472b6" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
              </svg>

              {/* center - animate scale/entrance */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <motion.div
                  key={`${mainUnit.value}-${mainUnit.label}`}
                  initial={{ scale: 1.06, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 360, damping: 28 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="text-5xl sm:text-6xl font-extrabold text-white leading-none"
                  >
                    {pad(mainUnit.value)}
                  </motion.div>
                  <div className="text-xs sm:text-sm font-semibold text-rose-400 tracking-widest mt-1">{mainUnit.label}</div>
                </motion.div>
              </div>
            </div>

            {/* grid breakdown */}
            <div className="w-full max-w-xs mt-6">
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: "Dias", value: timeLeft.d },
                  { label: "Hrs", value: timeLeft.h },
                  { label: "Min", value: timeLeft.m },
                  { label: "Seg", value: timeLeft.s },
                ].map(({ label, value }, idx) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06, ...cellStagger }}
                    className="text-center"
                  >
                    <div className="bg-white/8 backdrop-blur-md border border-white/10 rounded-xl p-2 mb-1">
                      <motion.div
                        key={value}
                        initial={{ scale: 1.04, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.24 }}
                        className="text-base sm:text-lg font-bold text-white"
                        aria-live="polite"
                      >
                        {pad(value)}
                      </motion.div>
                    </div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">{label}</div>
                  </motion.div>
                ))}
              </div>

              <div className="text-center space-y-2">
                <motion.p
                  animate={{ opacity: [0.65, 1, 0.65] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="text-slate-400 text-sm"
                >
                  Aguarde até que chegue a zero...
                </motion.p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Countdown.propTypes = {
  targetDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
  onComplete: PropTypes.func,
};

Countdown.defaultProps = {
  onComplete: undefined,
};
