import React from 'react';
import { Supporter } from '../types';
import { Heart, Users } from 'lucide-react';

interface SupportersPanelProps {
  lastSupporter: Supporter | null;
  recentSupporters: Supporter[];
}

export const SupportersPanel: React.FC<SupportersPanelProps> = ({
  lastSupporter,
  recentSupporters,
}) => {
  return (
    <aside
      id="supporters-sidebar"
      className="w-full lg:w-72 flex flex-col gap-4 order-2 lg:order-1"
    >
      {/* 1. Último Apoiador Highlight Card (Requirement: ÚLTIMO APOIADOR) */}
      <div
        id="last-supporter-card"
        className="p-4 rounded-2xl bg-zinc-900/70 backdrop-blur-md border border-zinc-800/90 shadow-lg relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-400">
            <Heart className="w-3.5 h-3.5 fill-rose-500/20 text-rose-400" />
            <span>Último Apoiador</span>
          </div>
        </div>

        {lastSupporter ? (
          <div className="flex items-center gap-3">
            <img
              src={lastSupporter.avatar}
              alt={lastSupporter.displayName}
              className="w-11 h-11 rounded-full border-2 border-rose-500/50 object-cover bg-zinc-800 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-white truncate">
                @{lastSupporter.username}
              </p>
              <div className="flex items-center gap-1 text-xs text-zinc-300 mt-0.5">
                <span>{lastSupporter.lastGiftIcon}</span>
                <span className="font-semibold text-zinc-200 truncate">
                  {lastSupporter.lastGiftName}
                </span>
                <span className="text-emerald-400 font-bold ml-auto">
                  +{lastSupporter.totalApples} 🍎
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-zinc-500 italic">
            Aguardando primeiro apoiador da LIVE...
          </div>
        )}
      </div>

      {/* 2. Últimos Apoiadores List */}
      <div
        id="recent-supporters-card"
        className="p-4 rounded-2xl bg-zinc-900/70 backdrop-blur-md border border-zinc-800/90 shadow-lg flex-1 flex flex-col"
      >
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 pb-2 border-b border-zinc-800/80">
          <Users className="w-3.5 h-3.5 text-zinc-400" />
          <span>Apoiadores Recentes</span>
        </div>

        {recentSupporters.length > 0 ? (
          <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[360px] pr-1">
            {recentSupporters.map((supporter, idx) => (
              <div
                key={`${supporter.userId}_${idx}`}
                className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60 hover:border-zinc-700/80 transition-all text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={supporter.avatar}
                    alt={supporter.username}
                    className="w-8 h-8 rounded-full border border-zinc-700 object-cover bg-zinc-800 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-zinc-200 truncate max-w-[110px]">
                      @{supporter.username}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                      <span>{supporter.lastGiftIcon}</span>
                      <span className="truncate">{supporter.lastGiftName}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-bold text-emerald-400">
                    +{supporter.totalApples}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">🍎</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-zinc-500">
            Aguardando presentes na LIVE do TikTok...
          </div>
        )}
      </div>
    </aside>
  );
};
