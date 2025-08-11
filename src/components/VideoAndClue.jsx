// src/components/VideoAndClue.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Confetti = ({ show }) => {
  const pieces = Array.from({ length: 18 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {pieces.map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -10, opacity: 0, scale: 0.6 }}
          animate={
            show
              ? {
                  y: 300 + Math.random() * 200,
                  x: (i - 9) * (6 + Math.random() * 6),
                  opacity: [1, 0.8, 0],
                  scale: [1, 0.8],
                }
              : {}
          }
          transition={{ duration: 1.6 + Math.random(), delay: i * 0.03 }}
          className="absolute w-3 h-3 rounded-full"
          style={{
            left: `${10 + Math.random() * 80}%`,
            backgroundColor: ["#f472b6", "#a855f7", "#06b6d4", "#f59e0b"][i % 4],
          }}
          aria-hidden
        />
      ))}
    </div>
  );
};

const VideoAndClue = ({ videoSrc, message, clue }) => {
  const [showContent, setShowContent] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!showContent) setShowContent(true);
    }, 3000);
    return () => clearTimeout(fallbackTimer);
  }, [showContent]);

  // Orientation helpers with safe guards
  const lockOrientation = async (orientation = "landscape") => {
    try {
      if (screen && screen.orientation && typeof screen.orientation.lock === "function") {
        await screen.orientation.lock(orientation);
        console.log("orientation locked to", orientation);
      }
    } catch (err) {
      console.warn("orientation lock failed:", err);
    }
  };

  const unlockOrientation = () => {
    try {
      if (screen && screen.orientation && typeof screen.orientation.unlock === "function") {
        screen.orientation.unlock();
        console.log("orientation unlocked");
      }
    } catch (err) {
      console.warn("orientation unlock failed:", err);
    }
  };

  // Enter fullscreen (try element fullscreen; fallback to video element; iOS webkit attempt)
  const enterFullscreen = async () => {
    const el = containerRef.current || videoRef.current;
    if (!el) return;

    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitEnterFullscreen) {
        // Safari iOS video element specific
        el.webkitEnterFullscreen();
      } else if (videoRef.current && videoRef.current.requestFullscreen) {
        await videoRef.current.requestFullscreen();
      }
      // try lock to landscape after entering fullscreen
      await lockOrientation("landscape");
    } catch (err) {
      console.warn("enterFullscreen failed", err);
    }
  };

  // Listen fullscreenchange to unlock orientation when leaving fullscreen
  useEffect(() => {
    const onFullScreenChange = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement || null;
      if (!fsEl) {
        unlockOrientation();
      } else {
        lockOrientation("landscape");
      }
    };

    document.addEventListener("fullscreenchange", onFullScreenChange);
    document.addEventListener("webkitfullscreenchange", onFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullScreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullScreenChange);
      unlockOrientation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVideoEnd = () => {
    setVideoEnded(true);
    setShowContent(true);
  };

  const handleVideoError = () => {
    setVideoError(true);
    setShowContent(true);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const { currentTime, duration } = videoRef.current;
      if (duration > 0 && currentTime / duration >= 0.9) setShowContent(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div ref={containerRef} className="w-full max-w-2xl space-y-8 relative">
          <Confetti show={showContent || videoEnded} />

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="bg-white/6 backdrop-blur-md border border-white/10 rounded-3xl p-3 shadow-lg relative">
            <div className="flex items-center justify-between gap-4">
              <div className="text-left">
                <h2 className="text-lg font-semibold text-white">Vídeo da Etapa</h2>
                <p className="text-sm text-slate-300">Assista ao vídeo para liberar a pista.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={enterFullscreen}
                  className="px-3 py-2 rounded-lg bg-rose-500/90 hover:bg-rose-600 text-white font-medium text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                  aria-label="Ver em tela cheia"
                >
                  Tela cheia
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-2xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                className="w-full h-auto block"
                controls
                playsInline
                onEnded={handleVideoEnd}
                onError={handleVideoError}
                onTimeUpdate={handleTimeUpdate}
                preload="metadata"
              >
                <source src={videoSrc} type="video/mp4" />
                Seu navegador não suporta vídeo HTML5.
              </video>
            </div>

            {videoError && (
              <div className="mt-3 text-sm text-yellow-300">Problema ao carregar o vídeo. Você ainda verá a pista após alguns segundos.</div>
            )}
          </motion.div>

          <AnimatePresence>
            {showContent && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5 }} className="space-y-4">
                <div className="bg-white/6 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-lg text-center">
                  <div className="text-6xl mb-3">🎉</div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent mb-2">Parabéns!</h2>
                  <p className="text-slate-300">{message || "Parabéns!"}</p>
                </div>

                {clue && (
                  <div className="bg-white/6 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-lg">
                    <h3 className="text-lg font-semibold text-rose-400 mb-2">🔎 Próxima pista</h3>
                    <p className="text-slate-300">{clue}</p>
                  </div>
                )}

                <div className="text-center text-slate-400 text-sm">A próxima etapa só é acessível via QR code externo.</div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showContent && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center bg-white/6 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-lg">
              <div className="text-4xl mb-3">✨</div>
              <p className="text-slate-300">Aguarde o vídeo terminar (ou use o botão Tela cheia) para ver a pista.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoAndClue;
