import type { VisionDetection,BotGiftId } from './types';
const gifts:Record<BotGiftId,string>={rose:'Rosa',doughnut:'Rosquinha',heart_me:'Heart Me',finger_heart:'Finger Heart',perfume:'Perfume',confetti:'Confete',rocket:'Foguete',lion:'Leão',galaxy:'Galáxia'};
export class GiftDetector {
  readonly threshold=.85;
  // Receives evidence from a real vision provider. It never invents detections from pixels.
  normalize(raw:any):VisionDetection|null {
    const giftId=String(raw?.giftId||'') as BotGiftId; const confidence=Number(raw?.confidence);
    if(!(giftId in gifts)||!Number.isFinite(confidence)||confidence<this.threshold)return null;
    const username=String(raw?.username||'').replace(/[^a-zA-Z0-9._-]/g,'').slice(0,64);
    if(!username)return null;
    const repeatCount=Math.max(1,Math.min(1000,Math.floor(Number(raw?.repeatCount)||1)));
    return {giftId,giftName:gifts[giftId],username,displayName:String(raw?.displayName||username).slice(0,80),avatar:String(raw?.avatar||'').slice(0,2048),repeatCount,confidence,fingerprint:String(raw?.fingerprint||`${username}:${giftId}:${repeatCount}`).slice(0,160)};
  }
}
