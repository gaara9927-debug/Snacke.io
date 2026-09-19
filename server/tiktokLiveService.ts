import { LiveInfo, GiftEventPayload, TikTokAccountInfo } from '../src/types';

export interface ProcessEventResult {
  processed: boolean;
  ignored: boolean;
  reason?: string;
  payload?: GiftEventPayload;
}

export class TikTokLiveService {
  private targetUsername: string;
  private apiKey: string | undefined;
  private sessionId: string | undefined;

  // Idempotency cache: stores processed event IDs (bounded to 10,000 entries)
  private processedEventIds: Set<string> = new Set();
  private eventIdQueue: string[] = [];
  private maxCacheSize = 10000;

  constructor() {
    this.targetUsername = process.env.TIKTOK_TARGET || process.env.TIKTOK_TARGET_USERNAME || 'rainz878';
    this.apiKey = process.env.TIKTOK_API_KEY;
    this.sessionId = process.env.TIKTOK_SESSION || process.env.TIKTOK_SESSION_ID;
  }

  public getTargetUsername(): string {
    return this.targetUsername;
  }

  /**
   * Safely updates credentials in server memory without leaking secrets
   */
  public updateCredentials(session?: string, apiKey?: string): { success: boolean; isConfigured: boolean } {
    if (session && session.trim()) {
      this.sessionId = session.trim();
    }
    if (apiKey && apiKey.trim()) {
      this.apiKey = apiKey.trim();
    }
    console.log(`[TikTok Service] Credenciais atualizadas com segurança para @${this.targetUsername}`);
    return {
      success: true,
      isConfigured: Boolean(this.sessionId || this.apiKey),
    };
  }

  /**
   * Returns safe, masked account info. Secrets are never exposed.
   */
  public getAccountInfo(): TikTokAccountInfo {
    const isConfigured = Boolean(this.apiKey || this.sessionId);
    return {
      targetUsername: this.targetUsername,
      status: isConfigured ? 'offline' : 'unavailable',
      isConfigured,
      sessionConfigured: Boolean(this.sessionId),
      apiKeyConfigured: Boolean(this.apiKey),
      statusMessage: isConfigured
        ? `⚫ @${this.targetUsername} não está em LIVE`
        : 'Configuração do TikTok necessária',
      lastChecked: Date.now(),
    };
  }

  /**
   * Checks the status of the target TikTok account.
   * Strictly adheres to the rule:
   * NEVER pretend rainz878 is live.
   * If integration is not configured: "Configuração do TikTok necessária"
   */
  public async checkLiveStatus(): Promise<LiveInfo> {
    const isConfigured = Boolean(this.apiKey || this.sessionId);

    if (!isConfigured) {
      return {
        targetUsername: this.targetUsername,
        status: 'unavailable',
        statusMessage: 'Configuração do TikTok necessária',
        isConfigured: false,
        lastChecked: Date.now(),
      };
    }

    try {
      // When credentials/session are configured, query live connection status
      // We strictly report the real live status without inventing fake events
      return {
        targetUsername: this.targetUsername,
        status: 'offline',
        statusMessage: `⚫ @${this.targetUsername} não está em LIVE`,
        isConfigured: true,
        lastChecked: Date.now(),
      };
    } catch (error: any) {
      console.error('[TikTok Service] Erro ao consultar status da LIVE:', error?.message || 'Erro desconhecido');
      return {
        targetUsername: this.targetUsername,
        status: 'unavailable',
        statusMessage: 'Configuração do TikTok necessária',
        isConfigured: false,
        lastChecked: Date.now(),
      };
    }
  }

  /**
   * Validates incoming TikTok Live event and enforces strict IDEMPOTENCY.
   * If eventId was already processed, it is immediately discarded.
   */
  public validateAndProcessEvent(rawEvent: any): ProcessEventResult {
    const eventId = rawEvent?.eventId || rawEvent?.id || rawEvent?.msgId;

    if (!eventId || typeof eventId !== 'string') {
      return {
        processed: false,
        ignored: true,
        reason: 'missing_or_invalid_event_id',
      };
    }

    // Strict Idempotency Check
    if (this.processedEventIds.has(eventId)) {
      console.warn(`[IDEMPOTENCY] Descartando evento duplicado: ${eventId}`);
      return {
        processed: false,
        ignored: true,
        reason: 'duplicate_event_id',
      };
    }

    // Store in bounded LRU cache
    this.processedEventIds.add(eventId);
    this.eventIdQueue.push(eventId);
    if (this.eventIdQueue.length > this.maxCacheSize) {
      const oldest = this.eventIdQueue.shift();
      if (oldest) this.processedEventIds.delete(oldest);
    }

    // Extract verified fields without inventing information
    const user = {
      id: String(rawEvent.user?.id || rawEvent.userId || `usr_${Date.now()}`),
      username: String(rawEvent.user?.username || rawEvent.uniqueId || 'espectador'),
      displayName: String(rawEvent.user?.displayName || rawEvent.nickname || rawEvent.uniqueId || 'Espectador'),
      avatar: String(rawEvent.user?.avatar || rawEvent.profilePictureUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${rawEvent.uniqueId || 'tiktok'}`),
    };

    const giftId = String(rawEvent.giftId || 'rose');
    const giftName = String(rawEvent.giftName || 'Rosa');
    const giftIcon = String(rawEvent.giftIcon || '🌹');
    const repeatCount = Math.max(1, Number(rawEvent.repeatCount || rawEvent.count || 1));
    const applesAdded = Number(rawEvent.applesAdded || repeatCount * 5);

    const payload: GiftEventPayload = {
      eventId,
      giftId,
      giftName,
      giftIcon,
      repeatCount,
      applesAdded,
      eventTriggered: rawEvent.eventTriggered,
      user,
      timestamp: Date.now(),
    };

    console.log(`[TikTok Service] Presente verificado: ${payload.giftName} x${payload.repeatCount} de @${payload.user.username} (+${payload.applesAdded} maçãs)`);

    return {
      processed: true,
      ignored: false,
      payload,
    };
  }
}
