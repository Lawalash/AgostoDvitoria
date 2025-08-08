import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

/**
 * MapGuide - mostra um mapa estilizado em SVG, traça uma rota
 * do usuário até o destino final (coordenadas definidas abaixo)
 * e exibe distância / tempo estimado / status de chegada.
 *
 * Destino fixo: -7.257106781268056, -35.944510491423486
 */

export default function MapGuide() {
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState(0); // km
  const [estimatedTime, setEstimatedTime] = useState(0); // minutes
  const [isNearDestination, setIsNearDestination] = useState(false);

  const watchIdRef = useRef(null);
  const animRef = useRef(null);
  const animTRef = useRef(0);
  const [animT, setAnimT] = useState(0); // progress 0..1 for moving dot

  // destino final solicitado
  const destination = {
    lat: -7.257106781268056,
    lng: -35.944510491423486,
  };

  // Haversine — retorna distância em km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // tempo estimado (minutos) com velocidade média heurística
  const calcEstimatedTimeMin = (km) => {
    if (km <= 0) return 0;
    const avgSpeedKmh = km > 2 ? 40 : 25; // heurística
    return Math.max(1, Math.ceil((km / avgSpeedKmh) * 60));
  };

  // inicia rastreamento (getCurrentPosition + watchPosition)
  const startLocationTracking = () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocalização não é suportada neste navegador.");
      setIsLoading(false);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 5000,
    };

    // primeira posição (um "snapshot")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp || Date.now(),
        };
        setUserLocation(loc);
        updateDistanceInfo(loc);
        setIsLoading(false);
        setIsTracking(true);

        // watch contínuo
        watchIdRef.current = navigator.geolocation.watchPosition(
          (p) => {
            const updated = {
              lat: p.coords.latitude,
              lng: p.coords.longitude,
              accuracy: p.coords.accuracy,
              timestamp: p.timestamp || Date.now(),
            };
            setUserLocation(updated);
            updateDistanceInfo(updated);
          },
          (err) => {
            console.error("watchPosition error:", err);
            // não sobrescrever mensagem de permissão já mostrada
          },
          options
        );
      },
      (err) => {
        console.error("getCurrentPosition error:", err);
        if (err.code === 1) {
          setError("Permissão negada. Habilite o acesso à localização no navegador.");
        } else if (err.code === 3) {
          setError("Timeout ao obter localização. Tente novamente.");
        } else {
          setError("Não foi possível obter sua localização. Verifique as permissões do navegador.");
        }
        setIsLoading(false);
        setIsTracking(false);
      },
      options
    );
  };

  // atualiza distância/tempo/status
  const updateDistanceInfo = (loc) => {
    const d = calculateDistance(loc.lat, loc.lng, destination.lat, destination.lng);
    setDistance(d);
    setEstimatedTime(calcEstimatedTimeMin(d));
    setIsNearDestination(d < 0.1); // menos de 100 metros
  };

  useEffect(() => {
    startLocationTracking();

    // cleanup
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation && navigator.geolocation.clearWatch) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- PROJEÇÃO SIMPLES: lat/lon -> x,y no SVG ---
  // utiliza uma projeção equiretangular ajustada por cos(lat) (suficiente para curto alcance)
  const projectLatLngToXY = (lat, lng, mapWidth = 600, mapHeight = 400, padding = 60) => {
    // center entre destino e user (se user não existir, center = destination)
    const centerLat = userLocation ? (userLocation.lat + destination.lat) / 2 : destination.lat;
    const centerLng = userLocation ? (userLocation.lng + destination.lng) / 2 : destination.lng;

    // metros por grau
    const metersPerDegLat = 111320;
    const metersPerDegLng = 111320 * Math.cos((centerLat * Math.PI) / 180);

    // delta em metros do ponto até o centro
    const dxMeters = (lng - centerLng) * metersPerDegLng;
    const dyMeters = (lat - centerLat) * metersPerDegLat;

    // determinar escala: quantos pixels por metro
    const latSpanMeters = Math.abs((destination.lat - (userLocation ? userLocation.lat : destination.lat)) * metersPerDegLat) || 1;
    const lngSpanMeters = Math.abs((destination.lng - (userLocation ? userLocation.lng : destination.lng)) * metersPerDegLng) || 1;
    const usableW = mapWidth - padding * 2;
    const usableH = mapHeight - padding * 2;
    const pxPerMeter = Math.min(usableW / (lngSpanMeters * 1.5), usableH / (latSpanMeters * 1.5));
    const scale = Math.max(pxPerMeter, 0.02); // evitar 0

    const cx = mapWidth / 2;
    const cy = mapHeight / 2;

    const x = cx + dxMeters * scale;
    const y = cy - dyMeters * scale; // lat crescente => y decrescente na tela

    return { x, y };
  };

  // calcula os pontos da curva (P0 user, P1 ctrl1, P2 ctrl2, P3 dest)
  const getRoutePathPoints = () => {
    if (!userLocation) return null;

    const mapW = 600;
    const mapH = 400;
    const pUser = projectLatLngToXY(userLocation.lat, userLocation.lng, mapW, mapH);
    const pDest = projectLatLngToXY(destination.lat, destination.lng, mapW, mapH);

    // curva suave: control points baseados na direção entre pontos
    const dx = pDest.x - pUser.x;
    const dy = pDest.y - pUser.y;
    const distPx = Math.hypot(dx, dy);
    const offset = Math.min(120, distPx * 0.35);

    // control points deslocados orthogonal para criar curva elegante
    const angle = Math.atan2(dy, dx);
    const orthX = -Math.sin(angle);
    const orthY = Math.cos(angle);

    const control1 = {
      x: pUser.x + dx * 0.3 + orthX * offset * 0.6,
      y: pUser.y + dy * 0.3 + orthY * offset * 0.6,
    };
    const control2 = {
      x: pUser.x + dx * 0.7 + orthX * offset * -0.6,
      y: pUser.y + dy * 0.7 + orthY * offset * -0.6,
    };

    return {
      p0: pUser,
      p1: control1,
      p2: control2,
      p3: pDest,
    };
  };

  // cálculo ponto de Bézier cúbica para t em [0,1]
  const cubicBezierPoint = (t, P0, P1, P2, P3) => {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    const x =
      uuu * P0.x +
      3 * uu * t * P1.x +
      3 * u * tt * P2.x +
      ttt * P3.x;

    const y =
      uuu * P0.y +
      3 * uu * t * P1.y +
      3 * u * tt * P2.y +
      ttt * P3.y;

    return { x, y };
  };

  // iniciar loop de animação para mover a bolinha ao longo da curva
  useEffect(() => {
    const points = getRoutePathPoints();
    if (!points) {
      // sem usuário ainda
      return;
    }

    let start = null;
    const duration = Math.max(2000, Math.min(6000, Math.ceil((distance || 0.1) * 1000))); // ms - ajusta conforme distância (heurística)

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      let t = (elapsed % duration) / duration; // ciclo infinito
      animTRef.current = t;
      setAnimT(t);
      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, distance]); // reinicia quando user muda

  // RENDER: estados iniciais
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-md">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="text-6xl mb-6">
            🧭
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-4">Obtendo sua localização...</h2>
          <p className="text-slate-300">Permita o acesso à localização para mostrarmos o caminho até a surpresa final!</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Problema com Localização</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <motion.button onClick={() => window.location.reload()} className="px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold rounded-xl" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            Tentar Novamente
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // layout principal
  const points = getRoutePathPoints();
  const pathD = points ? `M ${points.p0.x} ${points.p0.y} C ${points.p1.x} ${points.p1.y}, ${points.p2.x} ${points.p2.y}, ${points.p3.x} ${points.p3.y}` : "";
  const movingPoint = points ? cubicBezierPoint(animT, points.p0, points.p1, points.p2, points.p3) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent mb-4">🗺️ Sua Jornada Final</h1>
          {isNearDestination ? (
            <motion.p animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1, repeat: Infinity }} className="text-green-400 text-lg font-bold">
              🎉 Você chegou! A surpresa está bem aqui! 🎉
            </motion.p>
          ) : (
            <p className="text-slate-300 text-lg">
              {isTracking ? "Rastreando sua localização..." : "Siga a rota para descobrir a surpresa especial."}
            </p>
          )}
        </motion.div>

        {/* status de rastreamento (simples) */}
        {isTracking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-green-500/20 backdrop-blur-md border border-green-500/30 rounded-2xl p-4 text-center">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-green-400 text-sm flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Localização em tempo real ativa
            </motion.div>
          </motion.div>
        )}

        {/* Mapa (SVG) */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 overflow-hidden">
          <div className="relative">
            <svg viewBox="0 0 600 400" className="w-full h-auto bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10" style={{ maxHeight: 400 }}>
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148,163,184,0.06)" strokeWidth="1"/>
                </pattern>

                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>

                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>

                <filter id="pulse">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              <rect width="600" height="400" fill="url(#grid)" />

              {/* Decorações */}
              <rect x="80" y="280" width="25" height="40" fill="rgba(148,163,184,0.18)" rx="2"/>
              <rect x="180" y="220" width="30" height="60" fill="rgba(148,163,184,0.18)" rx="2"/>
              <rect x="320" y="300" width="20" height="30" fill="rgba(148,163,184,0.18)" rx="2"/>
              <rect x="450" y="250" width="28" height="50" fill="rgba(148,163,184,0.18)" rx="2"/>

              <circle cx="130" cy="350" r="12" fill="rgba(34,197,94,0.24)"/>
              <circle cx="400" cy="180" r="10" fill="rgba(34,197,94,0.24)"/>
              <circle cx="280" cy="360" r="15" fill="rgba(34,197,94,0.24)"/>

              {/* Rota (curva) */}
              {points && (
                <motion.path
                  d={pathD}
                  stroke="url(#routeGradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="10 6"
                  filter="url(#glow)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                />
              )}

              {/* usuário (marcador) */}
              {points && (
                <g>
                  <motion.circle
                    cx={points.p0.x}
                    cy={points.p0.y}
                    r={20}
                    fill="rgba(14,165,233,0.08)"
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <circle cx={points.p0.x} cy={points.p0.y} r={8} fill="#0ea5e9" filter="url(#pulse)" />
                  <text x={points.p0.x} y={points.p0.y + 26} textAnchor="middle" fill="white" fontSize="11" fontWeight="600">📍 Você</text>
                </g>
              )}

              {/* destino */}
              {points && (
                <g>
                  <motion.circle
                    cx={points.p3.x}
                    cy={points.p3.y}
                    r={28}
                    fill={isNearDestination ? "rgba(34,197,94,0.22)" : "rgba(239,68,68,0.18)"}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <circle cx={points.p3.x} cy={points.p3.y} r={14} fill={isNearDestination ? "#10b981" : "#ef4444"} />
                  <text x={points.p3.x} y={points.p3.y - 34} textAnchor="middle" fill="white" fontSize="12" fontWeight="700">🎁 Destino</text>
                </g>
              )}

              {/* indicador móvel ao longo da curva */}
              {movingPoint && (
                <g>
                  <circle cx={movingPoint.x} cy={movingPoint.y} r={6} fill="#fbbf24" />
                </g>
              )}
            </svg>
          </div>
        </motion.div>

        {/* Informações / cards: agora apenas Distância e Tempo */}
        <div className="grid md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5">
            <h3 className="text-lg font-bold text-rose-400 mb-3 flex items-center gap-2">📏 Distância</h3>
            <div className="text-center text-slate-300">
              <div className="text-2xl font-bold text-rose-400 mb-1">{distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(2)} km`}</div>
              <div className="text-sm opacity-75">até o destino</div>
              {userLocation && <div className="text-xs mt-2 text-green-400">Precisão: ±{Math.round(userLocation.accuracy)} m</div>}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5">
            <h3 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">⏱️ Tempo</h3>
            <div className="text-center text-slate-300">
              <div className="text-2xl font-bold text-purple-400 mb-1">{estimatedTime < 60 ? `${estimatedTime} min` : `${Math.floor(estimatedTime / 60)} h ${estimatedTime % 60} min`}</div>
              <div className="text-sm opacity-75">estimado</div>
            </div>
          </motion.div>
        </div>

        {/* Mensagem final adaptada */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className={`${isNearDestination ? "bg-gradient-to-r from-green-500/20 to-emerald-600/20 border-green-500/30" : "bg-gradient-to-r from-rose-500/20 to-purple-600/20 border-white/20"} backdrop-blur-md border rounded-3xl p-6 text-center transition-all duration-700`}>
          <motion.div animate={{ scale: [1, 1.08, 1], rotate: [0, 6, -6, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-4xl mb-2">
            💝
          </motion.div>
          <h3 className="text-2xl font-bold text-white mb-2">{isNearDestination ? "Você Conseguiu!" : "A Aventura Final Te Espera!"}</h3>
          <p className="text-slate-300">{isNearDestination ? "Parabéns! Você completou a jornada — a surpresa está muito próxima! 🎊💖" : "Siga seu coração 💖"}</p>

          {isNearDestination && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-4 p-3 bg-white/8 rounded-xl">
              <p className="text-green-400 font-semibold">🎯 Procure ao redor! A surpresa está próxima.</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
