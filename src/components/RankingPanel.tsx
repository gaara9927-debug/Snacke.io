import React, { useState } from 'react';
import { Supporter, HistoryEventItem, LiveLogItem } from '../types';
import { Trophy, Crown, Medal, ScrollText, Gift } from 'lucide-react';

interface RankingPanelProps {
  topSupporters: Supporter[];
  history: HistoryEventItem[];
  liveLogs: LiveLogItem[];
}

export const RankingPanel: React.FC<RankingPanelProps> = ({
  topSupporters,
  history,
  liveLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'gifts'>('logs');

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-[10px] font-black">
          <Crown className="w-3 h-3" />
        </div>
      );
    }
    if (index === 1) {
      return (
        <div className="w-5 h-5 rounded-full bg-slate-300/20 text-slate-300 border border-slate-300/40 flex items-center justify-center text-[10px] font-black">
          <Medal className="w-3 h-3" />
        </div>
      );
    }
    if (index === 2) {
      return (
        <div className="w-5 h-5 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/40 flex items-center justify-center text-[10px] font-black">
          3
        </div>
      );
    }
    return (
      <span className="w-5 text-center text-xs font-bold text-zinc-500">
        {index + 1}
      </span>
    );
  };

  const formatLogTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  };

  return (
    <aside
      id="ranking-sidebar"
      className="w-full lg:w-72 flex flex-col gap-4 order-3"
    >
      {/* 1. TOP APOIADORES (Requirement: TOP APOIADORES) */}
      <div
        id="top-ranking-card"
        className="p-4 rounded-2xl bg-zinc-900/70 backdrop-blur-md border border-zinc-800/90 shadow-lg"
      >
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 pb-2 border-b border-zinc-800/80">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Top Apoiadores</span>
        </div>

        {topSupporters.length > 0 ? (
          <div className="flex flex-col gap-2">
            {topSupporters.slice(0, 5).map((supporter, idx) => (
              <div
                key={`top_${supporter.userId}_${idx}`}
                className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60 hover:border-zinc-700/80 transition-all text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getRankBadge(idx)}
                  <img
                    src={supporter.avatar}
                    alt={supporter.username}
                    className="w-7 h-7 rounded-full border border-zinc-700 object-cover bg-zinc-800 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <span className="font-bold text-zinc-200 truncate max-w-[100px]">
                    @{supporter.username}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-extrabold text-amber-400">
                    {supporter.totalApples}
                  </span>
                  <span className="text-[10px] text-zinc-500 ml-1">🍎</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-zinc-500">
            Ainda não há apoiadores no ranking da LIVE.
          </div>
        )}
      </div>

      {/* 2. LOGS DA LIVE (Requirement: LOGS DA LIVE) */}
      <div
        id="live-logs-card"
        className="p-4 rounded-2xl bg-zinc-900/70 backdrop-blur-md border border-zinc-800/90 shadow-lg flex-1 flex flex-col min-h-[320px]"
      >
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'logs'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ScrollText className="w-3 h-3" />
              <span>LOGS DA LIVE</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('gifts')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'gifts'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Gift className="w-3 h-3" />
              <span>Presentes</span>
            </button>
          </div>

          <span className="text-[10px] font-mono text-zinc-500">LIVE</span>
        </div>

        {/* Tab 1: LOGS DA LIVE */}
        {activeTab === 'logs' && (
          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[340px] pr-1 font-mono text-[11px]">
            {liveLogs.length > 0 ? (
              liveLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2 rounded-lg bg-zinc-950/70 border border-zinc-800/60 leading-relaxed"
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-0.5">
                    <span
                      className={`font-semibold uppercase ${
                        log.type === 'gift'
                          ? 'text-emerald-400'
                          : log.type === 'event'
                          ? 'text-amber-400'
                          : log.type === 'connection'
                          ? 'text-sky-400'
                          : 'text-zinc-400'
                      }`}
                    >
                      [{log.type}]
                    </span>
                    <span>{formatLogTime(log.timestamp)}</span>
                  </div>
                  <p className="text-zinc-300 break-words">{log.message}</p>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-zinc-500 font-sans">
                Aguardando logs de atividade da LIVE...
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Histórico de Presentes */}
        {activeTab === 'gifts' && (
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[340px] pr-1">
            {history.length > 0 ? (
              history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-zinc-950/50 border border-zinc-800/50"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-zinc-300 truncate max-w-[90px] font-semibold">
                      @{item.username}
                    </span>
                    <span className="text-zinc-600">&rarr;</span>
                    <span className="flex items-center gap-0.5 text-zinc-200 font-semibold">
                      <span>{item.giftIcon}</span>
                      <span>x{item.count}</span>
                    </span>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="font-bold text-emerald-400">+{item.apples} 🍎</span>
                    {item.event && (
                      <span className="block text-[9px] text-amber-400 uppercase font-mono">
                        {item.event}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-zinc-500">
                Aguardando presentes recebidos na LIVE...
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
