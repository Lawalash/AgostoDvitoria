import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getRiddleByPath } from "../config/riddles";
import VideoAndClue from "./VideoAndClue";

const RiddlePage = () => {
  const { step } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRiddle, setCurrentRiddle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const riddle = getRiddleByPath(step);
    if (!riddle) {
      navigate("/");
      return;
    }
    setCurrentRiddle(riddle);
    setIsLoading(false);
  }, [step, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentRiddle) return;

    if (password.trim().toLowerCase() === currentRiddle.password.toLowerCase()) {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Senha incorreta! Verifique a pista novamente.");
      setPassword("");
      setTimeout(() => setError(""), 3000);
    }
  };

  // NOTA: não existe navegação para a próxima etapa pela UI.
  // A transição para a próxima etapa deve ocorrer via QR code (externo).

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="text-6xl mb-4">
            💝
          </motion.div>
          <p className="text-slate-300">Carregando aventura...</p>
        </motion.div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Ao autenticar, mostra o vídeo + mensagem + pista (sem botão de avançar)
    return (
      <VideoAndClue
        videoSrc={currentRiddle.videoSrc}
        message={currentRiddle.message}
        clue={currentRiddle.clue}
        isLastStep={false} // não utilizado para navegação aqui
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-12">
          <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="text-7xl mb-6">
            🗝️
          </motion.div>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent mb-3">
            Etapa {step}
          </h1>

          <p className="text-slate-300 text-lg">Digite a senha para desbloquear</p>
        </motion.div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            <div>
              <label className="block text-rose-400 font-semibold mb-4 text-lg">Palavra-chave:</label>
              <input
                type="text"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="w-full px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-slate-400 text-lg focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 transition-all duration-300"
                placeholder="Digite aqui..."
                autoFocus
                autoComplete="off"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-xl py-3 px-4">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={!password.trim()}
              className="w-full py-4 px-6 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold rounded-2xl text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:from-rose-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-rose-400/30 shadow-xl transform active:scale-95"
              whileHover={{ scale: password.trim() ? 1.02 : 1 }}
              whileTap={{ scale: password.trim() ? 0.98 : 1 }}
            >
              Desbloquear
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Procure pela pista no local indicado na etapa anterior
            </p>
          </div>
        </motion.div>

        {/* removido: botão de voltar / navegação para próxima etapa */}
      </div>
    </div>
  );
};

export default RiddlePage;
