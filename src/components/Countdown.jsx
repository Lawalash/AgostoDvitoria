import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

export default function Countdown({ targetDate, onComplete }) {
  // --- timestamps ---
  const targetTimestamp = useMemo(() => {
    const t = new Date(targetDate).getTime();
    return Number.isFinite(t) && t > 0 ? t : Date.now();
  }, [targetDate]);

  // initial distance captured when targetTimestamp changes
  const initialDistanceRef = useRef(Math.max(targetTimestamp - Date.now(), 0));

  useEffect(() => {
    initialDistanceRef.current = Math.max(targetTimestamp - Date.now(), 0);
  }, [targetTimestamp]);

  // --- state ---
  const [timeLeft, setTimeLeft] = useState(() => {
    const distance = Math.max(targetTimestamp - Date.now(), 0);
    const d = Math.floor(distance / (1000 * 60 * 60 * 24));
    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((distance % (1000 * 60)) / 1000);
    return { d, h, m, s };
  });
  const [isComplete, setIsComplete] = useState(() => targetTimestamp - Date.now() <= 0);
  const [progress, setProgress] = useState(() => {
    const init = initialDistanceRef.current;
    if (init <= 0) return 100;
    const passed = init - Math.max(targetTimestamp - Date.now(), 0);
    return Math.min(100, (passed / init) * 100);
  });

  const intervalRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // --- stable randomized particle positions so they don't jump on every render ---
  const particles = useMemo(() => {
    return Array.from({ length: 15 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      x: Math.random() * 60 - 30,
      y: Math.random() * 60 - 30,
      delay: Math.random() * 3,
      duration: 4 + Math.random() * 2,
      scale: 1 + Math.random() * 0.4,
      opacityPeak: 0.6 + Math.random() * 0.4,
    }));
  }, []);

  const celebrationParticles = useMemo(() => {
    return Array.from({ length: 12 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 2,
      scale: 1 + Math.random() * 0.7,
    }));
  }, []);

  // --- countdown logic ---
  useEffect(() => {
    // if already complete, no need to set interval
    if (targetTimestamp - Date.now() <= 0) {
      setIsComplete(true);
      setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
      setProgress(100);
      // call onComplete asynchronously shortly
      const t = setTimeout(() => {
        if (typeof onCompleteRef.current === "function") onCompleteRef.current();
      }, 1500);
      return () => clearTimeout(t);
    }

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const distance = targetTimestamp - now;

      if (distance <= 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        setProgress(100);
        setIsComplete(true);
        // call onComplete after a brief delay for animation
        setTimeout(() => {
          if (typeof onCompleteRef.current === "function") {
            onCompleteRef.current();
          }
        }, 1500);
        return;
      }

      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ d, h, m, s });

      const init = initialDistanceRef.current;
      if (init > 0) {
        const percent = Math.min(100, ((init - distance) / init) * 100);
        setProgress(percent);
      } else {
        setProgress(100);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [targetTimestamp]);

  // --- helper for main unit (big number) ---
  const getMainUnit = () => {
    if (timeLeft.d > 0) return { value: timeLeft.d, label: "DIAS" };
    if (timeLeft.h > 0) return { value: timeLeft.h, label: "HORAS" };
    if (timeLeft.m > 0) return { value: timeLeft.m, label: "MINUTOS" };
    return { value: timeLeft.s, label: "SEGUNDOS" };
  };

  const mainUnit = getMainUnit();

  // --- progress ring geometry ---
  const R = 85;
  const circumference = 2 * Math.PI * R;
  const dashOffset = circumference - (circumference * progress) / 100;

  // --- formatting helper ---
  const pad = (n) => String(n).padStart(2, "0");

  // === RENDER ===
  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0">
          {celebrationParticles.map((p, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-rose-400/40 rounded-full"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                x: [0, p.x, p.x / 2],
                y: [0, p.y, p.y / 2],
                opacity: [0, 1, 0],
                scale: [0, p.scale, 0],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: "easeInOut",
              }}
              style={{ left: p.left, top: p.top }}
              aria-hidden
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOutBack" }}
          className="text-center max-w-xs mx-auto relative z-10"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-7xl mb-6"
            aria-hidden
          >
            🎉
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-2xl font-bold text-white mb-4"
          >
            É hora da magia!
          </motion.h1>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="h-1 bg-gradient-to-r from-rose-500 to-purple-400 rounded-full mx-auto mb-6"
            aria-hidden
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="text-slate-300 text-base"
          >
            Sua jornada especial pode começar, Vitória! 💖
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Default (counting down)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Floating particles (background) */}
      <div className="absolute inset-0" aria-hidden>
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-rose-400/30 rounded-full"
            animate={{
              x: [0, p.x, 0],
              y: [0, p.y, 0],
              opacity: [0, p.opacityPeak, 0],
              scale: [0, p.scale, 0],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut",
            }}
            style={{ left: p.left, top: p.top }}
          />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex flex-col justify-center items-center p-4 max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-6xl mb-3"
            aria-hidden
          >
            ✨
          </motion.div>

          <motion.p
            className="text-slate-400 text-sm mb-2 tracking-wide"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Surpresinha da melhor forma
          </motion.p>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent">
            Vih
          </h1>
        </motion.div>

        {/* MAIN: big centered unit */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center mb-8"
        >
          {/* Progress ring with main unit centered */}
          <div className="relative w-56 h-56">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500/20 to-purple-500/20 blur-lg animate-pulse" />

            <svg
              viewBox="0 0 192 192"
              className="w-full h-full transform -rotate-90 relative z-10"
              aria-hidden
            >
              <circle
                cx="96"
                cy="96"
                r={R}
                stroke="rgba(148,163,184,0.12)"
                strokeWidth="2"
                fill="none"
              />
              <motion.circle
                cx="96"
                cy="96"
                r={R}
                stroke="url(#gradient)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{ filter: "url(#glow)" }}
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

            {/* center content: big main unit */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <motion.div
                key={mainUnit.value + mainUnit.label}
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <div className="text-6xl font-extrabold text-white leading-none">
                  {pad(mainUnit.value)}
                </div>
                <div className="text-sm font-semibold text-rose-400 tracking-widest mt-1">
                  {mainUnit.label}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* compact grid with detailed breakdown (below main unit) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-full max-w-xs"
        >
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Dias", value: timeLeft.d },
              { label: "Hrs", value: timeLeft.h },
              { label: "Min", value: timeLeft.m },
              { label: "Seg", value: timeLeft.s },
            ].map(({ label, value }, index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + index * 0.06, duration: 0.35 }}
                className="text-center"
              >
                <div className="bg-white/8 backdrop-blur-md border border-white/10 rounded-xl p-3 mb-2">
                  <motion.div
                    key={value}
                    initial={{ scale: 1.08, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="text-lg font-bold text-white"
                    aria-live="polite"
                  >
                    {pad(value)}
                  </motion.div>
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                  {label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center space-y-2">
            <motion.p
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="text-slate-400 text-sm"
            >
              Aguarde até que chegue a zero, madame...
            </motion.p>

            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-rose-400 text-xs tracking-wide"
            >
            </motion.div>
          </div>
        </motion.div>
      </div>
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
