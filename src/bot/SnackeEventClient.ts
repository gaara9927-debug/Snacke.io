import type { VisionDetection } from './types';
export class SnackeEventClient { async send(d:VisionDetection){const r=await fetch('/api/bot/gift',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});if(!r.ok)throw new Error('Bot event rejected');return r.json();} }
