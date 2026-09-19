import React, { useEffect, useState } from 'react';
import { GiftEventPayload } from '../types';
import { Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GiftNotificationBannerProps {
  giftEvent: GiftEventPayload | null;
}

export const GiftNotificationBanner: React.FC<GiftNotificationBannerProps> = ({ giftEvent }) => {
  const [currentEvent, setCurrentEvent] = useState<GiftEventPayload | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!giftEvent) return;

    setCurrentEvent(giftEvent);
    setVisible(true);

    // If it's a Galaxy or huge gift, fire celestial confetti!
    if (giftEvent.giftId === 'galaxy' || giftEvent.applesAdded >= 100) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.25 },
        colors: ['#a855f7', '#38bdf8', '#fbbf24', '#ec4899'],
      });
    }

    const timer = setTimeout(() => {
      setVisible(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [giftEvent]);

  if (!visible || !currentEvent) return null;

  const isGalaxy = currentEvent.giftId === 'galaxy';

  return (
    <div
      id="gift-notification-overlay"
      className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-300 transform animate-in fade-in slide-in-from-top-4"
    >
      <div
        className={`px-5 py-3 rounded-2xl flex items-center gap-4 shadow-2xl backdrop-blur-xl border ${
          isGalaxy
            ? 'bg-purple-950/90 border-purple-500/50 shadow-purple-900/50 ring-2 ring-purple-500/30'
            : 'bg-zinc-900/90 border-zinc-700/80 shadow-emerald-950/40'
        }`}
      >
        {/* User Avatar */}
        <div className="relative">
          <img
            src={currentEvent.user.avatar}
            alt={currentEvent.user.displayName}
            className="w-12 h-12 rounded-full border-2 border-emerald-400 object-cover bg-zinc-800"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Gift Details */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm text-white tracking-tight">
              @{currentEvent.user.username}
            </span>
            {isGalaxy && (
              <span className="flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-300 border border-purple-500/40">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" /> GALAXY
              </span>
            )}
          </div>

          <div className="text-xs text-zinc-300 flex items-center gap-1.5">
            <span>enviou</span>
            <span className="font-bold text-white flex items-center gap-1">
              <span>{currentEvent.giftIcon}</span>
              <span>{currentEvent.giftName}</span>
              <span className="text-emerald-400">x{currentEvent.repeatCount}</span>
            </span>
          </div>

          <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
            <span>+{currentEvent.applesAdded} 🍎 geradas na arena!</span>
            <span className="text-zinc-400 font-normal">&middot; 🐍 Obrigado!</span>
          </div>
        </div>
      </div>
    </div>
  );
};
