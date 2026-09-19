import { createHmac, timingSafeEqual } from 'crypto';
import { LiveInfo, GiftEventPayload, TikTokAccountInfo } from '../src/types';
import { GIFTS_CATALOG } from '../src/constants';

export interface ProcessEventResult {
  processed: boolean;
  ignored: boolean;
  reason?: string;
  payload?: GiftEventPayload;
}

export class TikTokLiveService {
  private targetUsername: string;
  private accessToken?: string;
  private refreshToken?: string;
  private tokenExpiresAt = 0;
  private processedEventIds = new Set<string>();
  private eventIdQueue: string[] = [];
  private maxCacheSize = 10000;

  constructor() {
    this.targetUsername = process.env.TIKTOK_TARGET || process.env.TIKTOK_TARGET_USERNAME || 'rainz878';
  }

  public getTargetUsername() { return this.targetUsername; }

  public getAccountInfo(): TikTokAccountInfo {
    const isConfigured = Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET && process.env.TIKTOK_REDIRECT_URI);
    const authorized = Boolean(this.accessToken);
    return {
      targetUsername: this.targetUsername,
      status: 'unavailable',
      isConfigured,
      sessionConfigured: false,
      apiKeyConfigured: Boolean(process.env.TIKTOK_CLIENT_KEY),
      statusMessage: authorized ? 'TikTok conectado. Status LIVE depende de acesso LIVE aprovado.' : isConfigured ? 'TikTok configurado — conecte a conta.' : 'Configure Login Kit no servidor.',
      lastChecked: Date.now(),
    };
  }

  public async exchangeCode(code: string): Promise<void> {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI;
    if (!clientKey || !clientSecret || !redirectUri) throw new Error('TikTok Login Kit não configurado');

    const body = new URLSearchParams({
      client_key: clientKey, client_secret: clientSecret, code,
      grant_type: 'authorization_code', redirect_uri: redirectUri,
    });
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
    });
    const data: any = await response.json();
    if (!response.ok || !data.access_token) throw new Error(data.error_description || 'Falha no OAuth TikTok');
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.tokenExpiresAt = Date.now() + Number(data.expires_in || 0) * 1000;
  }

  public async checkLiveStatus(): Promise<LiveInfo> {
    const configured = Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET && process.env.TIKTOK_REDIRECT_URI);
    if (!configured) return { targetUsername: this.targetUsername, status: 'unavailable', statusMessage: 'Configure TikTok Login Kit no servidor.', isConfigured: false, lastChecked: Date.now() };
    if (!this.accessToken) return { targetUsername: this.targetUsername, status: 'unavailable', statusMessage: 'Conecte @rainz878 pelo Login Kit.', isConfigured: true, lastChecked: Date.now() };
    return {
      targetUsername: this.targetUsername,
      status: 'unavailable',
      statusMessage: 'Conta conectada. A API pública configurada não fornece status LIVE/presentes sem acesso LIVE específico.',
      isConfigured: true,
      lastChecked: Date.now(),
    };
  }

  public verifyWebhookSignature(rawBody: string, signatureHeader?: string): boolean {
    const secret = process.env.TIKTOK_CLIENT_SECRET;
    if (!secret || !signatureHeader) return false;
    const parts = Object.fromEntries(signatureHeader.split(',').map(p => p.split('=').map(v => v.trim())));
    const timestamp = parts.t;
    const signature = parts.s;
    if (!timestamp || !signature || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
    const expected = createHmac('sha256', secret).update(timestamp + '.' + rawBody).digest('hex');
    try { return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex')); } catch { return false; }
  }

  public validateAndProcessEvent(rawEvent: any): ProcessEventResult {
    const eventId = String(rawEvent?.eventId || rawEvent?.id || rawEvent?.msgId || '');
    if (!eventId) return { processed: false, ignored: true, reason: 'missing_event_id' };
    if (this.processedEventIds.has(eventId)) return { processed: false, ignored: true, reason: 'duplicate_event_id' };

    const giftId = String(rawEvent.giftId || '').toLowerCase();
    const gift = GIFTS_CATALOG.find(g => g.id === giftId);
    if (!gift) return { processed: false, ignored: true, reason: 'unknown_gift' };

    this.processedEventIds.add(eventId); this.eventIdQueue.push(eventId);
    if (this.eventIdQueue.length > this.maxCacheSize) { const old = this.eventIdQueue.shift(); if (old) this.processedEventIds.delete(old); }

    const repeatCount = Math.min(1000, Math.max(1, Math.floor(Number(rawEvent.repeatCount || rawEvent.count || 1))));
    const username = String(rawEvent.user?.username || rawEvent.uniqueId || 'espectador').slice(0, 64);
    const payload: GiftEventPayload = {
      eventId, giftId: gift.id, giftName: gift.name, giftIcon: gift.icon,
      repeatCount, applesAdded: Math.min(500, gift.apples * repeatCount), eventTriggered: gift.eventTrigger,
      user: {
        id: String(rawEvent.user?.id || rawEvent.userId || username).slice(0, 128),
        username,
        displayName: String(rawEvent.user?.displayName || rawEvent.nickname || username).slice(0, 80),
        avatar: String(rawEvent.user?.avatar || rawEvent.profilePictureUrl || '').slice(0, 2048),
      },
      timestamp: Date.now(),
    };
    return { processed: true, ignored: false, payload };
  }
}
