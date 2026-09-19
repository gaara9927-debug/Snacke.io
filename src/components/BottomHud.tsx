import React, { useEffect, useState } from 'react';
import { ActiveGameEvent } from '../types';
import { Sparkles, Zap, Flame, ShieldAlert, Award } from 'lucide-react';

interface BottomHudProps {
  applesEaten: number;
  length: number;
  score: number;
  activeEvent: ActiveGameEvent | null;
  scoreMultiplier: number;
  growthMultiplier: number;
}

export const BottomHud: React.FC<BottomHudProps> = ({
  applesEaten,
  length,
  score,
  activeEvent,
  scoreMultiplier,
  growthMultiplier,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!activeEvent) {
      setProgress(100);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const total = activeEvent.durationMs;
      const left = activeEvent.endTime - now;
      const pct = Math.max(0, Math.min(100, (left / total) * 100));
      setProgress(pct);
    }, 100);

    return () => clearInterval(interval);
  }, [activeEvent]);

  return (
    <div
      id="bottom-game-hud"
      className="w-full bg-zinc-950/80 backdrop-blur-md border-t border-zinc-800/80 px-4 py-3 sticky bottom-0 z-30"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* 1. MAÇÃS */}
        <div
          id="stat-apples"
          className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Maçãs Coletadas
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-red-400 tracking-tight">
                {applesEaten.toLocaleString()}
              </span>
              <span className="text-sm">🍎</span>
            </div>
          </div>
          {scoreMultiplier > 1 && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
              {scoreMultiplier}x PONTOS
            </span>
          )}
        </div>

        {/* 2. TAMANHO */}
        <div
          id="stat-length"
          className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Tamanho da Cobra
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-emerald-400 tracking-tight">
                {length}
              </span>
              <span className="text-xs text-zinc-500">elos</span>
            </div>
          </div>
          {growthMultiplier > 1 && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              {growthMultiplier}x CRESCIMENTO
            </span>
          )}
        </div>

        {/* 3. PONTOS */}
        <div
          id="stat-score"
          className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Pontuação Total
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xl font-extrabold text-amber-300 tracking-tight">
                {score.toLocaleString()}
              </span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
          </div>
        </div>

        {/* 4. EVENTO ATIVO */}
        <div
          id="stat-event"
          className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
            activeEvent
              ? 'bg-purple-950/40 border-purple-500/40 shadow-sm shadow-purple-950'
              : 'bg-zinc-900/80 border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-purple-400" />
              <span>Evento Ativo</span>
            </span>

            {activeEvent && (
              <span className="text-[10px] font-bold text-purple-300 animate-pulse">
                {Math.ceil(
                  Math.max(0, activeEvent.endTime - Date.now()) / 1000
                )}
                s
              </span>
            )}
          </div>

          {activeEvent ? (
            <div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm">{activeEvent.icon}</span>
                <span className="text-xs font-bold text-white truncate">
                  {activeEvent.name}
                </span>
              </div>
              {/* Event Progress Bar */}
              <div className="w-full bg-purple-950 h-1.5 rounded-full overflow-hidden mt-1.5 border border-purple-500/30">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Arena em regime normal</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
