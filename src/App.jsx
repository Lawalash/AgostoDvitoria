import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./components/AuthPage";
import RiddlePage from "./components/RiddlePage";
import MapGuide from "./components/MapGuide";

/**
 * DevNavigation:
 * - aparece em localhost (import.meta.env.DEV)
 * - ou quando url tem ?dev=1
 * - ou quando url tem ?devToken=TOKEN e TOKEN bate com VITE_DEV_TOKEN (variável de ambiente)
 */
function DevNavigation() {
  const isDev = import.meta.env.DEV;

  // client-side apenas
  const search =
    typeof window !== "undefined" && window.location ? new URLSearchParams(window.location.search) : null;
  const devParam = search?.get("dev") === "1";
  const devTokenParam = search?.get("devToken") || null;
  const envToken = import.meta.env.VITE_DEV_TOKEN || null;

  const show = isDev || devParam || (devTokenParam && envToken && devTokenParam === envToken);
  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-md rounded-2xl p-4 text-white text-sm">
      <div className="text-xs mb-2 opacity-75">🚧 Dev Navigation</div>
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
        {/* Menu de navegação para desenvolvimento (visível conforme regras acima) */}
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
