import React, { useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Countdown from "./Countdown";

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const TARGET = "2025-08-12T00:00:00";

  // lê parâmetros de query e variável de env apenas uma vez
  const { isAllowedDev } = useMemo(() => {
    const search = new URLSearchParams(location.search);
    const devParam = search.get("dev") === "1";
    const devTokenParam = search.get("devToken") || null;
    const envToken = import.meta.env.VITE_DEV_TOKEN || null;

    const isAllowed =
      import.meta.env.DEV ||
      devParam ||
      (devTokenParam && envToken && devTokenParam === envToken);

    return { isAllowedDev: isAllowed };
  }, [location.search]);

  useEffect(() => {
    // se modo dev permitido, vai direto para primeira charada
    if (isAllowedDev) {
      navigate("/riddle/1");
      return;
    }

    // se já passou da data alvo
    const now = new Date();
    const targetDate = new Date(TARGET);
    if (now >= targetDate) {
      navigate("/riddle/1");
    }
  }, [isAllowedDev, navigate]);

  const handleCountdownComplete = () => {
    navigate("/riddle/1");
  };

  // Só mostra o countdown quando não está em dev mode/override
  if (!isAllowedDev) {
    return <Countdown targetDate={TARGET} onComplete={handleCountdownComplete} />;
  }

  // em dev, redirecionamento já acontece no useEffect; retornar nulo para evitar flicker
  return null;
}
