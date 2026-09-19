import React, { useEffect, useRef, useState } from 'react';
import { Eye, MonitorUp, Square, X } from 'lucide-react';

export function LiveVisionPanel({open,onClose}:{open:boolean;onClose:()=>void}) {
  const videoRef=useRef<HTMLVideoElement>(null);
  const streamRef=useRef<MediaStream|null>(null);
  const [active,setActive]=useState(false);
  const [message,setMessage]=useState('Compartilhe a tela/janela da LIVE para a Snacke visualizar.');
  const start=async()=>{
    try {
      if(!navigator.mediaDevices?.getDisplayMedia) throw new Error('Captura de tela não disponível neste navegador.');
      const stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:5,max:10}},audio:false});
      streamRef.current=stream; if(videoRef.current){videoRef.current.srcObject=stream; await videoRef.current.play();}
      setActive(true); setMessage('Visão ativa. A tela só é capturada enquanto você permitir.');
      stream.getVideoTracks()[0]?.addEventListener('ended',stop);
    } catch(e:any){setMessage(e?.message||'Permissão de captura não concedida.');}
  };
  const stop=()=>{streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null;if(videoRef.current)videoRef.current.srcObject=null;setActive(false);setMessage('Visão desligada. O painel manual continua disponível.');};
  useEffect(()=>()=>stop(),[]);
  if(!open)return null;
  return <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
    <div className="w-full max-w-xl rounded-3xl border border-sky-400/20 bg-zinc-950 p-5">
      <div className="flex justify-between"><div><p className="text-xs uppercase tracking-widest text-sky-400 font-bold">Snacke Vision</p><h2 className="text-xl font-black">Visão da LIVE</h2></div><button onClick={onClose} className="p-2 rounded-xl bg-zinc-900"><X className="w-4 h-4"/></button></div>
      <p className="mt-2 text-xs text-zinc-400">{message}</p>
      <div className="mt-4 aspect-video overflow-hidden rounded-2xl border border-zinc-800 bg-black flex items-center justify-center">
        <video ref={videoRef} muted playsInline className="w-full h-full object-contain"/>
        {!active&&<Eye className="absolute w-8 h-8 text-zinc-700"/>}
      </div>
      <div className="mt-4 flex gap-2">
        {!active?<button onClick={start} className="flex-1 rounded-xl bg-sky-400 text-zinc-950 py-3 font-black flex justify-center gap-2"><MonitorUp className="w-4 h-4"/>Compartilhar tela da LIVE</button>:
        <button onClick={stop} className="flex-1 rounded-xl bg-rose-500 py-3 font-black flex justify-center gap-2"><Square className="w-4 h-4"/>Parar visão</button>}
      </div>
      <p className="mt-3 text-[11px] text-zinc-500">A captura exige sua autorização. Este modo prepara a fonte visual sem substituir eventos manuais ou a IA autônoma da cobra. Reconhecimento automático só deve disparar um presente quando houver confiança suficiente; caso contrário, use Eventos.</p>
    </div>
  </div>;
}
