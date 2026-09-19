import type { VisionDetection } from './types';

/**
 * Adapter for a real vision/OCR service. The browser sends a captured frame
 * only after the user explicitly enables screen sharing.
 * The server/provider must return evidence; this class never fabricates gifts.
 */
export class FrameVisionClient {
  async analyze(blob: Blob): Promise<Partial<VisionDetection> | null> {
    const body=new FormData(); body.append('frame',blob,'live-frame.jpg');
    const r=await fetch('/api/bot/vision',{method:'POST',body});
    if(r.status===204)return null;
    if(!r.ok)throw new Error('Vision provider unavailable');
    return r.json();
  }
}
