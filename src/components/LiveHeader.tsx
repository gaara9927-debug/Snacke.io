import React from 'react';
import { LiveInfo } from '../types';
import { Radio, Wifi, WifiOff, Sparkles, LogIn } from 'lucide-react';

interface LiveHeaderProps {
  liveInfo: LiveInfo;
  isConnected: boolean;
  onOpenTikTokLogin: () => void;
  isAiDebugActive: boolean;
  onToggleAiDebug: () => void;
}

export const LiveHeader: React.FC<LiveHeaderProps> = ({
  liveInfo,
  isConnected,
  onOpenTikTokLogin,
  isAiDebugActive,
  onToggleAiDebug,
}) => {
  const getStatusBadge = () => {
    if (liveInfo.status === 'live') {
      return (
        <div
          id="live-status-badge"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold tracking-wide"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span>🔴 LIVE ATIVA — @{liveInfo.targetUsername}</span>
        </div>
      );
    }

    if (liveInfo.status === 'offline') {
      return (
        <div
          id="live-status-badge"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-400 text-xs font-semibold tracking-wide"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-500"></span>
          <span>⚫ @{liveInfo.targetUsername} não está em LIVE</span>
        </div>
      );
    }

    if (liveInfo.status === 'connecting') {
      return (
        <div
          id="live-status-badge"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-medium"
        >
          <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span>Aguardando conexão com @{liveInfo.targetUsername}</span>
        </div>
      );
    }

    // not configured / unavailable
    return (
      <div
        id="live-status-badge"
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium"
      >
        <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span>Configuração do TikTok necessária</span>
      </div>
    );
  };

  return (
    <header
      id="main-app-header"
      className="w-full bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3 sticky top-0 z-40"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Live Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-950">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <span className="text-xl select-none">🐍</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                SNAKE <span className="text-emerald-400">LIVE</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% IA
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Cobra Autônoma &middot; TikTok LIVE @rainz878 &middot; Apoiadores em Tempo Real
            </p>
          </div>
        </div>

        {/* Live Status Requirement 1 & 8 */}
        <div className="flex items-center gap-2">{getStatusBadge()}</div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          {/* WebSocket Status Indicator */}
          <div
            id="ws-status-indicator"
            className="flex items-center gap-1.5 text-xs text-zinc-400 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800"
            title={isConnected ? 'WebSocket conectado e sincronizado com o servidor' : 'Reconectando WebSocket...'}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-zinc-300 font-medium hidden md:inline">Sincronizado</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-[11px] text-amber-300 font-medium hidden md:inline">Desconectado</span>
              </>
            )}
          </div>

          {/* AI Vision Toggle */}
          <button
            id="toggle-ai-debug-btn"
            type="button"
            onClick={onToggleAiDebug}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isAiDebugActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-950'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Visão IA</span>
          </button>

          {/* TikTok Login Menu Button (Requirement: Login TikTok: rainz878) */}
          <button
            id="open-tiktok-login-btn"
            type="button"
            onClick={onOpenTikTokLogin}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-zinc-900 hover:bg-zinc-850 text-emerald-400 border border-emerald-500/40 hover:border-emerald-500 shadow-md shadow-zinc-950 transition-all active:scale-95"
          >
            <LogIn className="w-3.5 h-3.5 text-emerald-400" />
            <span>Login TikTok: @rainz878</span>
          </button>
        </div>
      </div>
    </header>
  );
};
