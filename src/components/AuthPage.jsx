import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Countdown from "./Countdown";

export default function AuthPage() {
  const [showCountdown, setShowCountdown] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Parâmetros da URL
  const searchParams = new URLSearchParams(location.search);
  const devMode = searchParams.get("dev") === "1";
  const isDev = import.meta.env.DEV;

  const TARGET = "2025-08-12T00:00:00";

  useEffect(() => {
    // Se estiver em modo dev E com parâmetro dev=1, vai direto para riddle/1
    if (isDev && devMode) {
      console.log("🚧 Modo desenvolvedor ativado - indo para riddle/1");
      navigate("/riddle/1");
      return;
    }

    // Verificar se já passou da data alvo
    const now = new Date();
    const targetDate = new Date(TARGET);
    if (now >= targetDate) {
      navigate("/riddle/1");
    }
  }, [devMode, isDev, navigate]);

  const handleCountdownComplete = () => {
    // Quando o contador chegar a 0, vai para riddle/1
    navigate("/riddle/1");
  };

  // Só mostra o countdown se ainda não chegou na data alvo e não está em dev mode
  if (showCountdown && !devMode) {
    return <Countdown targetDate={TARGET} onComplete={handleCountdownComplete} />;
  }

  return null;
}
