// src/components/VideoAndClue.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

/* Confetti leve e desabilitável via Vite env (VITE_DISABLE_CONFETTI='true') */
const Confetti = ({ show }) => {
  const disableInDev = import.meta.env.VITE_DISABLE_CONFETTI === "true";
  if (disableInDev) return null;
  if (!show) return null;

  const pieces = Array.from({ length: 12 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -10, opacity: 0, scale: 0.5 }}
          animate={{
            y: 180 + Math.random() * 140,
            x: (i - 6) * (4 + Math.random() * 4),
            opacity: [1, 0.8, 0],
            scale: [0.85, 0.6],
          }}
          transition={{ duration: 1.1 + Math.random() * 0.5, delay: i * 0.035 }}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${15 + Math.random() * 70}%`,
            backgroundColor: ["#f472b6", "#a855f7", "#06b6d4", "#f59e0b"][i % 4],
          }}
        />
      ))}
    </div>
  );
};

const VideoAndClue = ({ videoSrc, message, clue, isLastStep = false, step = "" }) => {
  const [showContent, setShowContent] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [showManualUnlock, setShowManualUnlock] = useState(false);

  // popup state for last-riddle flow
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupCountdown, setPopupCountdown] = useState(0); // visual countdown
  const delayTimerRef = useRef(null);
  const popupIntervalRef = useRef(null);

  const videoRef = useRef(null);
  const clueHeadingRef = useRef(null);
  const errorTimeoutRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      if (popupIntervalRef.current) clearInterval(popupIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (videoError && !unlocked) {
      errorTimeoutRef.current = setTimeout(() => {
        setShowManualUnlock(true);
      }, 3000);
    }
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }
    };
  }, [videoError, unlocked]);

  // start popup delay after content is shown (applies only when isLastStep === true)
  useEffect(() => {
    if (isLastStep && showContent && unlocked && !popupVisible) {
      delayTimerRef.current = setTimeout(() => {
        setPopupCountdown(15);
        setPopupVisible(true);
        popupIntervalRef.current = setInterval(() => {
          setPopupCountdown((c) => {
            if (c <= 1) {
              clearInterval(popupIntervalRef.current);
              popupIntervalRef.current = null;
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      }, 15000);
    }

    return () => {
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }
    };
  }, [isLastStep, showContent, unlocked, popupVisible]);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const { currentTime, duration } = v;
    if (!duration || duration <= 0) return;

    const newProgress = Math.min(1, Math.max(0, currentTime / duration));
    setProgress(newProgress);

    if (newProgress >= 0.995 && !unlocked) {
      setUnlocked(true);
      setTimeout(() => {
        setShowContent(true);
        if (clueHeadingRef.current) clueHeadingRef.current.focus();
      }, 250);
    }
  }, [unlocked]);

  const handleEnded = useCallback(() => {
    setProgress(1);
    if (!unlocked) {
      setUnlocked(true);
      setShowContent(true);
      setTimeout(() => {
        if (clueHeadingRef.current) clueHeadingRef.current.focus();
      }, 120);
    }
  }, [unlocked]);

  const handleVideoError = useCallback(() => {
    console.warn("Erro ao carregar vídeo");
    setVideoError(true);
  }, []);

  const handleRestartVideo = useCallback(() => {
    const v = videoRef.current;
    if (v) {
      try {
        v.currentTime = 0;
        v.play?.();
      } catch {}
      setProgress(0);
    }
    if (popupVisible) {
      setPopupVisible(false);
      setPopupCountdown(0);
      if (popupIntervalRef.current) {
        clearInterval(popupIntervalRef.current);
        popupIntervalRef.current = null;
      }
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }
    }
  }, [popupVisible]);

  const handleManualUnlock = useCallback(() => {
    setUnlocked(true);
    setShowContent(true);
    setTimeout(() => {
      if (clueHeadingRef.current) clueHeadingRef.current.focus();
    }, 100);
  }, []);

  const handleConfirmRead = () => {
    if (popupIntervalRef.current) {
      clearInterval(popupIntervalRef.current);
      popupIntervalRef.current = null;
    }
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
    navigate("/final");
  };

  const handleReturnToClue = () => {
    setPopupVisible(false);
    setPopupCountdown(0);
    if (popupIntervalRef.current) {
      clearInterval(popupIntervalRef.current);
      popupIntervalRef.current = null;
    }
    setTimeout(() => {
      if (clueHeadingRef.current) clueHeadingRef.current.focus();
    }, 80);
  };

  const percent = Math.round(progress * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-rose-500/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-3xl space-y-6 relative">
          <Confetti show={showContent} />

          <motion.div initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Vídeo da Etapa</h1>
            <p className="text-sm sm:text-base text-slate-300">Assista o vídeo até o final para liberar a próxima pista</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="bg-white/6 backdrop-blur-md border border-white/10 rounded-3xl p-4 sm:p-6 shadow-lg">
            <div className="rounded-2xl overflow-hidden bg-black relative">
              <video
                ref={videoRef}
                className="w-full h-auto block max-h-[70vh]"
                controls
                playsInline
                onEnded={handleEnded}
                onError={handleVideoError}
                onTimeUpdate={handleTimeUpdate}
                preload="metadata"
                aria-label="Vídeo da etapa atual"
              >
                <source src={videoSrc} type="video/mp4" />
                <p className="text-white p-4">Seu navegador não suporta reprodução de vídeo HTML5.</p>
              </video>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRestartVideo}
                  className="text-sm text-slate-300 hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-2 py-1"
                  aria-label="Reiniciar vídeo"
                >
                  ↻ Reiniciar
                </button>
                {videoError && showManualUnlock && (
                  <button
                    onClick={handleManualUnlock}
                    className="text-sm bg-yellow-500/20 text-yellow-200 px-3 py-1 rounded-md hover:bg-yellow-500/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors"
                    aria-label="Liberar pista manualmente"
                  >
                    Liberar pista agora
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-400">
                {percent > 0 ? `Progresso: ${percent}%` : "Progresso: 0%"}
              </div>
            </div>

            {videoError && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="text-sm text-yellow-300">⚠️ Problema ao carregar o vídeo. Você pode liberar a pista manualmente.</div>
              </motion.div>
            )}
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div key={unlocked ? "unlocked" : "locked"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 relative">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white/6 backdrop-blur-md border border-white/10 rounded-3xl p-6 text-center shadow-lg">
                <div className="text-5xl mb-2" role="img" aria-label="Celebração">🎉</div>
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent mb-1">Parabéns!</h2>
                <p className="text-slate-300 text-sm sm:text-base">{message || "Você completou esta etapa!"}</p>
              </motion.div>

              <div className="relative">
                <div className="bg-white/6 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-lg">
                  <h3
                    ref={clueHeadingRef}
                    tabIndex={unlocked ? 0 : -1}
                    className="text-lg sm:text-xl font-semibold text-rose-400 mb-3 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded"
                  >
                    🔎 Próxima Pista
                  </h3>
                  <p className="text-slate-200 text-sm sm:text-base leading-relaxed">{clue}</p>
                </div>

                {!unlocked && (
                  <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="absolute inset-0 rounded-3xl flex items-center justify-center bg-slate-900/92 backdrop-blur-sm" role="region" aria-label="Pista bloqueada">
                    <div className="w-11/12 max-w-sm text-center p-5">
                      <div className="inline-flex items-center gap-2 text-slate-200 bg-white/8 px-3 py-2 rounded-full mb-3" aria-hidden>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="opacity-85" aria-hidden="true">
                          <path d="M6 10v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 10V8a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-xs font-medium">Pista bloqueada</span>
                      </div>

                      <p className="text-sm text-slate-300 mb-4">Assista o vídeo até o final para liberar</p>

                      <div className="w-full" role="presentation">
                        <div role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`Progresso do vídeo: ${percent} por cento`} className="w-full bg-white/10 rounded-full h-3 overflow-hidden mb-2">
                          <motion.div initial={{ width: "0%" }} animate={{ width: `${percent}%` }} transition={{ ease: "easeOut", duration: 0.25 }} className="h-full bg-gradient-to-r from-rose-500 to-purple-500" />
                        </div>
                        <div className="text-xs text-slate-400" aria-live="polite">{percent}% assistido</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {unlocked && showContent && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.25, 0] }} transition={{ duration: 0.8 }} className="absolute inset-0 rounded-3xl pointer-events-none bg-gradient-to-tr from-rose-500/20 via-purple-400/12 to-transparent" aria-hidden="true" />
                )}
              </div>

              {/* Exibe essa linha somente quando NÃO for o riddle 4 (você pediu que no riddle 4 não apareça) */}
              {String(step) !== "4" && (
                <div className="text-center">
                  <p className="text-slate-400 text-xs sm:text-sm">A próxima etapa só é acessível via QR code externo.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* POPUP: aparece somente quando isLastStep === true e após 15s */}
          <AnimatePresence>
            {popupVisible && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="popup-title"
              >
                <div className="w-full max-w-sm bg-white/6 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-center shadow-xl">
                  <h3 id="popup-title" className="text-lg font-semibold text-white mb-2">Conseguiu ler a dica?</h3>
                  <p className="text-sm text-slate-300 mb-4">Tem certeza que já entendeu onde procurar?</p>

                  <div className="mb-4">
                    <div className="text-2xl font-bold text-rose-400">{popupCountdown}s</div>
                    <div className="text-xs text-slate-400">Tempo desde que a pista foi exibida</div>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <button onClick={handleConfirmRead} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400">
                      Sim, já li
                    </button>
                    <button onClick={handleReturnToClue} className="bg-white/6 border border-white/10 text-slate-200 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400">
                      Voltar para a dica
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default VideoAndClue;
