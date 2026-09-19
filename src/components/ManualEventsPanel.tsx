import React, { useState } from 'react';
import { GIFTS_CATALOG } from '../constants';
import { Gift, X, Send } from 'lucide-react';

export function ManualEventsPanel({ open, onClose }: { open:boolean; onClose:()=>void }) {
  const [username,setUsername]=useState('apoiador');
  const [busy,setBusy]=useState(false);
  const trigger=async(giftId:string)=>{
    setBusy(true);
    try { await fetch('/api/manual/gift',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({giftId,username,displayName:username,repeatCount:1})}); }
    finally { setBusy(false); }
  };
  if(!open) return null;
  return <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
    <div className="w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-3xl border border-zinc-700 bg-zinc-950 p-5">
      <div className="flex justify-between items-center"><div><p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Controle da LIVE</p><h2 className="text-xl font-black">Eventos manuais</h2></div><button onClick={onClose} className="p-2 bg-zinc-900 rounded-xl"><X className="w-4 h-4"/></button></div>
      <p className="text-xs text-zinc-400 mt-2">Digite o @ de quem enviou o presente e toque no presente correspondente. A Snake recebe o evento imediatamente, sem obedecer ao chat.</p>
      <input value={username} onChange={e=>setUsername(e.target.value.replace(/^@/,'').slice(0,64))} placeholder="usuario_tiktok" className="mt-4 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm outline-none focus:border-emerald-500"/>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
        {GIFTS_CATALOG.map(g=><button key={g.id} disabled={busy} onClick={()=>trigger(g.id)} className="text-left rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 hover:border-emerald-500/50 disabled:opacity-50">
          <div className="text-2xl">{g.icon}</div><div className="font-bold text-sm mt-1">{g.name}</div><div className="text-[10px] text-zinc-500">{g.description}</div>
        </button>)}
      </div>
      <div className="mt-4 text-[11px] text-zinc-500 flex gap-2"><Gift className="w-4 h-4"/><span>Use este painel como operador durante a LIVE. Os eventos passam pela mesma validação do jogo.</span></div>
    </div>
  </div>;
}
