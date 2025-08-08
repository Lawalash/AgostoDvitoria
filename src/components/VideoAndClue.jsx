import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * VideoAndClue - reproduz vídeo e mostra mensagem + pista.
 * Não há botão para avançar: a próxima etapa só é acessível via QR code externo.
 */

const Confetti = ({ show }) => {
  const pieces = Array.from({ length: 18 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {pieces.map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -10, opacity: 0, scale: 0.6 }}
          animate={show ? { y: 300 + Math.random() * 200, x: (i - 9) * (6 + Math.random() * 6), opacity: [1, 0.8, 0], scale: [1, 0.8] } : {}}
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

  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!showContent) {
        setShowContent(true);
      }
    }, 3000);
    return () => clearTimeout(fallbackTimer);
  }, [showContent]);

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
      if (duration > 0 && currentTime / duration >= 0.9) {
        setShowContent(true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-8 relative">
          {/* confetti */}
          <Confetti show={showContent || videoEnded} />

          {/* Video Section */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl">
            <video
              ref={videoRef}
              className="w-full rounded-2xl shadow-lg"
              controls
              autoPlay
              muted
              onEnded={handleVideoEnd}
              onError={handleVideoError}
              onTimeUpdate={handleTimeUpdate}
            >
              <source src={videoSrc} type="video/mp4" />
              <div className="text-rose-400 text-center p-8">
                <div className="text-4xl mb-4">📱</div>
                <p>Seu navegador não suporta vídeos HTML5.</p>
                <p className="text-sm mt-2 opacity-75">Mas isso não vai impedir nossa aventura!</p>
              </div>
            </video>
          </motion.div>

          <AnimatePresence>
            {showContent && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.8, delay: 0.2 }} className="space-y-6">
                {/* Success Message */}
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center shadow-2xl">
                  <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-6xl mb-6">
                    🎉
                  </motion.div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent mb-4">
                    Parabéns!
                  </h2>
                  <p className="text-slate-300 text-lg leading-relaxed">{message || "Lorem ipsum dolor sit amet, consectetur adipiscing elit."}</p>
                </motion.div>

                {/* Próxima pista: (sem botão de avançar) */}
                {clue && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">🔍</div>
                      <div>
                        <h3 className="text-xl font-bold text-rose-400 mb-3">Próxima Pista:</h3>
                        <p className="text-slate-300 text-lg leading-relaxed">{clue}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Observação: removido botão de Próxima Etapa para forçar uso do QR Code */}
                <div className="text-center">
                  <p className="text-slate-400 text-sm">A próxima etapa só pode ser acessada via QR code.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State */}
          {!showContent && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="text-4xl mb-4">
                ✨
              </motion.div>
              <p className="text-slate-300 text-lg">Aguarde o vídeo terminar para ver a próxima pista...</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoAndClue;
