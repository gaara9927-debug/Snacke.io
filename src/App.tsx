import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, GameEngineState } from './engine/GameEngine';
import { useWebSocket } from './hooks/useWebSocket';
import { LiveHeader } from './components/LiveHeader';
import { SnakeCanvas } from './components/SnakeCanvas';
import { SupportersPanel } from './components/SupportersPanel';
import { RankingPanel } from './components/RankingPanel';
import { BottomHud } from './components/BottomHud';
import { GiftNotificationBanner } from './components/GiftNotificationBanner';
import { ThankYouToast } from './components/ThankYouToast';
import { TikTokLoginModal } from './components/TikTokLoginModal';
import { GiftEventPayload, LiveInfo } from './types';

export default function App() {
  const engineRef = useRef<GameEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current = new GameEngine();
  }
  const engine = engineRef.current;

  // React state synchronized with engine ticks
  const [gameState, setGameState] = useState<GameEngineState>(() => engine.getState());
  const [latestGiftReceived, setLatestGiftReceived] = useState<GiftEventPayload | null>(null);
  const [isTikTokLoginOpen, setIsTikTokLoginOpen] = useState(false);
  const [showAiVision, setShowAiVision] = useState(true);

  // WebSocket connection & synchronization
  const handleWsEvent = useCallback((type: string, data: any) => {
    if (type === 'gift_received' && engineRef.current) {
      engineRef.current.handleGiftEvent(data);
      setLatestGiftReceived(data);
      setGameState(engineRef.current.getState());
    } else if (type === 'live_status' && engineRef.current) {
      engineRef.current.updateLiveStatus(data);
      setGameState(engineRef.current.getState());
    } else if (type === 'connection_status' && engineRef.current) {
      if (data?.target) {
        engineRef.current.addLiveLog('connection', `Canal TikTok: @${data.target} sincronizado.`);
      }
    }
  }, []);

  const { isConnected, serverLiveInfo } = useWebSocket(handleWsEvent);

  // Sync server live info with engine
  useEffect(() => {
    if (serverLiveInfo && engine) {
      engine.updateLiveStatus(serverLiveInfo);
      setGameState(engine.getState());
    }
  }, [serverLiveInfo, engine]);

  // Initial fetch of live status directly via REST API as immediate fallback
  const fetchLiveStatus = useCallback(() => {
    fetch('/api/tiktok/status')
      .then((r) => r.json())
      .then((info: LiveInfo) => {
        if (info && engine) {
          engine.updateLiveStatus(info);
          setGameState(engine.getState());
        }
      })
      .catch(() => {
        // Handled silently
      });
  }, [engine]);

  useEffect(() => {
    fetchLiveStatus();
  }, [fetchLiveStatus]);

  // Start autonomous game engine
  useEffect(() => {
    engine.start();

    // High frequency state sync with engine loop
    const syncInterval = setInterval(() => {
      setGameState(engine.getState());
    }, 60);

    const unsubscribe = engine.addListener((type, data) => {
      if (type === 'gift_received') {
        setLatestGiftReceived(data);
      }
    });

    return () => {
      clearInterval(syncInterval);
      unsubscribe();
      engine.stop();
    };
  }, [engine]);

  return (
    <div className="min-h-screen bg-[#07080c] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 1. Header with TikTok live status & controls */}
      <LiveHeader
        liveInfo={gameState.liveInfo}
        isConnected={isConnected}
        onOpenTikTokLogin={() => setIsTikTokLoginOpen(true)}
        isAiDebugActive={showAiVision}
        onToggleAiDebug={() => setShowAiVision((v) => !v)}
      />

      {/* 2. Main Arena & Sidebars Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 flex flex-col lg:flex-row items-stretch gap-4">
        {/* Left: Supporters Panel (ÚLTIMO APOIADOR & APOIADORES RECENTES) */}
        <SupportersPanel
          lastSupporter={gameState.lastSupporter}
          recentSupporters={gameState.recentSupporters}
        />

        {/* Center: Interactive Arena & Notification Overlays (JOGO) */}
        <div className="flex-1 flex flex-col min-w-0 order-1 lg:order-2 relative">
          {/* Floating Real Gift Notification */}
          <GiftNotificationBanner giftEvent={latestGiftReceived} />

          {/* Autonomous AI Snake Canvas */}
          <SnakeCanvas
            snake={gameState.snake}
            apples={gameState.apples}
            portals={gameState.portals}
            activeEvent={gameState.activeEvent}
            aiDebug={gameState.aiDebug}
            showAiVision={showAiVision}
          />

          {/* Smart Thank You Toast */}
          <ThankYouToast thankYou={gameState.activeThankYou} />
        </div>

        {/* Right: Ranking & Logs Panel (TOP APOIADORES & LOGS DA LIVE) */}
        <RankingPanel
          topSupporters={gameState.supporters}
          history={gameState.history}
          liveLogs={gameState.liveLogs}
        />
      </main>

      {/* 3. Bottom HUD Status & Multipliers (MAÇÃS, TAMANHO, PONTUAÇÃO, EVENTO ATIVO) */}
      <BottomHud
        applesEaten={gameState.snake.applesEaten}
        length={gameState.snake.length}
        score={gameState.snake.score}
        activeEvent={gameState.activeEvent}
        scoreMultiplier={gameState.scoreMultiplier}
        growthMultiplier={gameState.growthMultiplier}
      />

      {/* 4. Menu de Login TikTok: rainz878 */}
      <TikTokLoginModal
        isOpen={isTikTokLoginOpen}
        onClose={() => setIsTikTokLoginOpen(false)}
        onStatusUpdated={fetchLiveStatus}
      />
    </div>
  );
}
