import React, { useEffect, useState } from 'react';
import { TikTokAccountInfo } from '../types';
import { X, ShieldCheck, Radio, RefreshCw, ExternalLink } from 'lucide-react';

interface Props { isOpen: boolean; onClose: () => void; onStatusUpdated: () => void; }

export const TikTokLoginModal: React.FC<Props> = ({ isOpen, onClose, onStatusUpdated }) => {
  const [info, setInfo] = useState<TikTokAccountInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const refresh = async () => {
    setLoading(true);
    try { const r = await fetch('/api/tiktok/account'); if (r.ok) setInfo(await r.json()); onStatusUpdated(); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (isOpen) refresh(); }, [isOpen]);
  if (!isOpen) return null;

  return <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
    <div className="w-full max-w-md rounded-3xl border border-emerald-400/20 bg-zinc-950/95 p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[11px] uppercase tracking-[.25em] text-emerald-400">TikTok LIVE</p>
          <h2 className="text-xl font-black text-white">@rainz878</h2></div>
        <button onClick={onClose} className="p-2 rounded-xl bg-zinc-900 text-zinc-400"><X className="w-4 h-4"/></button>
      </div>
      <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
        <div className="flex items-center gap-2 text-sm font-bold"><Radio className="w-4 h-4 text-emerald-400"/> Estado da integração</div>
        <p className="mt-3 text-sm text-zinc-300">{info?.statusMessage || 'Consultando servidor...'}</p>
        <button onClick={refresh} disabled={loading} className="mt-3 text-xs text-emerald-300 flex gap-2 items-center"><RefreshCw className={`w-3.5 h-3.5 ${loading?'animate-spin':''}`}/>Atualizar</button>
      </div>
      <div className="mt-4 flex gap-3 rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4 text-xs text-zinc-300">
        <ShieldCheck className="w-5 h-5 text-sky-300 shrink-0"/>
        <p>O jogo não pede Session ID, cookie ou senha. A autorização acontece no TikTok e os segredos ficam somente no servidor.</p>
      </div>
      <button onClick={() => { window.location.href='/api/tiktok/auth'; }} className="mt-5 w-full rounded-2xl bg-white py-3 text-sm font-black text-black flex justify-center items-center gap-2">
        Conectar TikTok <ExternalLink className="w-4 h-4"/>
      </button>
      <p className="mt-4 text-[11px] leading-relaxed text-zinc-500">Presentes e status LIVE só serão marcados como reais quando a integração tiver acesso ao recurso LIVE correspondente. O jogo nunca simula uma LIVE.</p>
    </div>
  </div>;
};
