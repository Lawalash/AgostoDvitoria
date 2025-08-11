// src/components/RiddlePage.jsx
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="text-6xl mb-4">💝</motion.div>
          <p className="text-slate-300">Carregando aventura...</p>
        </motion.div>
      </div>
    );
  }

  if (isAuthenticated && currentRiddle) {
    // o comportamento de popup/redirect de 15s foi definido para a etapa 3 (isLastStep),
    // aqui mantemos a checagem externa e passamos o step para o componente.
    const last = String(step) === "3";
    return (
      <VideoAndClue
        videoSrc={currentRiddle.videoSrc}
        message={currentRiddle.message}
        clue={currentRiddle.clue}
        isLastStep={last}
        step={String(step)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent mb-2">Etapa {step}</h1>
          <p className="text-slate-300">Digite a senha para desbloquear</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/6 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            <label className="block text-left text-sm font-semibold text-rose-300">Palavra-chave</label>
            <input
              type="text"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              className="w-full px-5 py-3 bg-transparent border border-white/10 rounded-xl text-white placeholder-slate-400 text-lg focus:outline-none focus:ring-2 focus:ring-rose-400/20"
              placeholder="Digite aqui..."
              autoFocus
              autoComplete="off"
            />

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="text-red-400 text-center bg-red-500/8 border border-red-500/20 rounded-lg py-2">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3">
              <button type="submit" disabled={!password.trim()} className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold rounded-xl disabled:opacity-50">Desbloquear</button>
            </div>

            <p className="text-slate-400 text-sm text-center mt-2">Procure pela pista no local indicado na etapa anterior</p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default RiddlePage;
