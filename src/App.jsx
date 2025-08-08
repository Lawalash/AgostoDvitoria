import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./components/AuthPage";
import RiddlePage from "./components/RiddlePage";
import MapGuide from "./components/MapGuide";

/**
 * DevNavigation:
 * - mostra quando estiver em import.meta.env.DEV
 * - ou quando ?dev=1
 * - ou quando ?devToken=<token> e token bate com VITE_DEV_TOKEN
 *
 * Exibe aviso se a VITE_DEV_TOKEN não estiver presente no bundle (útil para debug pós-deploy).
 */
function DevNavigation() {
  const isDev = import.meta.env.DEV;
  const envToken = import.meta.env.VITE_DEV_TOKEN || null;

  // client-side only checks
  const search =
    typeof window !== "undefined" && window.location ? new URLSearchParams(window.location.search) : null;
  const devParam = search?.get("dev") === "1";
  const devTokenParam = search?.get("devToken") || null;

  const show = isDev || devParam || (devTokenParam && envToken && devTokenParam === envToken);

  useEffect(() => {
    // útil para ver no console se o token compilado está presente
    console.log("DevNavigation - import.meta.env:", import.meta.env);
    console.log("DevNavigation - isDev:", isDev, "envToken:", envToken, "devParam:", devParam, "devTokenParam:", devTokenParam);
  }, [isDev, envToken, devParam, devTokenParam]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-md rounded-2xl p-4 text-white text-sm">
      <div className="text-xs mb-2 opacity-75">🚧 Dev Navigation</div>

      { !envToken && (
        <div className="mb-2 text-yellow-300 text-xs">
          ⚠️ VITE_DEV_TOKEN não encontrado no bundle. Adicione VITE_DEV_TOKEN na Vercel e redeploy.
        </div>
      )}

      <div className="flex flex-col gap-2">
        <a href="/riddle/1" className="hover:text-rose-400 transition-colors">🎯 Charada 1</a>
        <a href="/riddle/2" className="hover:text-rose-400 transition-colors">🎯 Charada 2</a>
        <a href="/riddle/3" className="hover:text-rose-400 transition-colors">🎯 Charada 3</a>
        <a href="/riddle/4" className="hover:text-rose-400 transition-colors">🎯 Charada 4</a>
        <a href="/final" className="hover:text-rose-400 transition-colors">🗺️ Mapa Final</a>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <DevNavigation />

        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/riddle/:step" element={<RiddlePage />} />
          <Route path="/final" element={<MapGuide />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
