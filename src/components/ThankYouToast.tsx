import React from 'react';
import { ThankYouMessage } from '../types';
import { Heart } from 'lucide-react';

interface ThankYouToastProps {
  thankYou: ThankYouMessage | null;
}

export const ThankYouToast: React.FC<ThankYouToastProps> = ({ thankYou }) => {
  if (!thankYou) return null;

  return (
    <div
      id="thank-you-toast"
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-300 transform animate-in fade-in slide-in-from-bottom-3"
    >
      <div className="px-4 py-2 rounded-xl bg-zinc-950/85 backdrop-blur-md border border-emerald-500/40 shadow-xl flex items-center gap-2.5 text-xs text-zinc-200">
        <Heart className="w-4 h-4 text-rose-400 fill-rose-400/30 animate-pulse" />
        <span className="font-medium">{thankYou.text}</span>
      </div>
    </div>
  );
};
