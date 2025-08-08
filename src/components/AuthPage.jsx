import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Countdown from "./Countdown";

export default function AuthPage() {
  const [showCountdown, setShowCountdown] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const TARGET = "2025-08-12T00:00:00";

  useEffect(() => {
    const search = new URLSearchParams(location.search);
    const devParam = search.get("dev") === "1";
    const devTokenParam = search.get("devToken") || null;
    const envToken = import.meta.env.VITE_DEV_TOKEN || null;

    // permitir debug se:
    // - modo dev local (Vite)
    // - ?dev=1
    // - ?devToken=<token> e token bate com VITE_DEV_TOKEN
    const isAllowedDev =
      import.meta.env.DEV ||
      devParam ||
      (devTokenParam && envToken && devTokenParam === envToken);

    if (isAllowedDev) {
      // redireciona direto para a primeira charada
      navigate("/riddle/1");
      return;
    }

    // Se já passou da data alvo, libera também
    const now = new Date();
    const targetDate = new Date(TARGET);
    if (now >= targetDate) {
      navigate("/riddle/1");
    }
  }, [location.search, navigate]);

  const handleCountdownComplete = () => {
    navigate("/riddle/1");
  };

  // Só mostra o countdown se ainda não chegou na data alvo e não está em dev mode/token
  // (showCountdown está mantido para compatibilidade caso queira controlar via estado)
  const search = new URLSearchParams(location.search);
  const devParam = search.get("dev") === "1";
  const devTokenParam = search.get("devToken") || null;
  const envToken = import.meta.env.VITE_DEV_TOKEN || null;
  const isAllowedDev =
    import.meta.env.DEV ||
    devParam ||
    (devTokenParam && envToken && devTokenParam === envToken);

  if (showCountdown && !isAllowedDev) {
    return <Countdown targetDate={TARGET} onComplete={handleCountdownComplete} />;
  }

  return null;
}
