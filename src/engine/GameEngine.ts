import {
  ActiveGameEvent,
  AppleItem,
  AppleType,
  EventType,
  GiftDefinition,
  GiftEventPayload,
  HistoryEventItem,
  LiveInfo,
  LiveLogItem,
  PortalPair,
  SnakeAIDebugInfo,
  SnakeSegment,
  Supporter,
  ThankYouMessage,
} from '../types';
import {
  APPLE_DEFINITIONS,
  CELL_SIZE,
  GIFTS_CATALOG,
  GRID_COLS,
  GRID_ROWS,
  TARGET_TIKTOK_USER,
} from '../constants';
import { Point, SnakeAI } from './SnakeAI';

export interface GameEngineState {
  snake: {
    head: Point;
    body: Point[];
    direction: Point;
    applesEaten: number;
    score: number;
    length: number;
    deaths: number;
    speed: number;
  };
  apples: AppleItem[];
  activeEvent: ActiveGameEvent | null;
  eventQueue: ActiveGameEvent[];
  portals: PortalPair[];
  supporters: Supporter[];
  recentSupporters: Supporter[];
  lastSupporter: Supporter | null;
  history: HistoryEventItem[];
  activeThankYou: ThankYouMessage | null;
  liveInfo: LiveInfo;
  aiDebug: SnakeAIDebugInfo;
  liveLogs: LiveLogItem[];
  growthMultiplier: number;
  scoreMultiplier: number;
}

export type GameEventListener = (eventType: string, data: any) => void;

export class GameEngine {
  private snakeAI: SnakeAI;
  private listeners: Set<GameEventListener> = new Set();

  // State
  private head: Point = { x: Math.floor(GRID_COLS / 2), y: Math.floor(GRID_ROWS / 2) };
  private body: Point[] = [];
  private direction: Point = { x: 1, y: 0 };
  private growthPending: number = 0;
  private applesEaten: number = 0;
  private score: number = 0;
  private deaths: number = 0;

  private apples: AppleItem[] = [];
  private activeEvent: ActiveGameEvent | null = null;
  private eventQueue: ActiveGameEvent[] = [];
  private eventCooldownUntil: number = 0;
  private lastRandomEventCheck: number = Date.now();
  private portals: PortalPair[] = [];

  private supportersMap: Map<string, Supporter> = new Map();
  private recentSupportersList: Supporter[] = [];
  private lastSupporterItem: Supporter | null = null;
  private historyList: HistoryEventItem[] = [];

  private thankYouQueue: ThankYouMessage[] = [];
  private activeThankYouMessage: ThankYouMessage | null = null;
  private lastThankYouByUser: Map<string, number> = new Map();

  private liveInfo: LiveInfo = {
    targetUsername: TARGET_TIKTOK_USER,
    status: 'unavailable',
    statusMessage: 'Status da LIVE indisponível pela integração atual.',
    isConfigured: false,
    lastChecked: Date.now(),
  };

  private liveLogsList: LiveLogItem[] = [
    {
      id: 'log_init_1',
      timestamp: Date.now() - 2000,
      type: 'system',
      message: 'Motor autônomo da Snake LIVE ativado.',
    },
    {
      id: 'log_init_2',
      timestamp: Date.now() - 1000,
      type: 'connection',
      message: `Monitoramento ativo para conta @${TARGET_TIKTOK_USER}`,
    },
  ];

  public addLiveLog(
    type: LiveLogItem['type'],
    message: string,
    user?: LiveLogItem['user'],
    gift?: LiveLogItem['gift']
  ): void {
    const logItem: LiveLogItem = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      type,
      message,
      user,
      gift,
    };
    this.liveLogsList = [logItem, ...this.liveLogsList].slice(0, 25);
    this.emit('live_log', logItem);
  }

  private aiDebugInfo: SnakeAIDebugInfo = {
    targetApple: null,
    targetScore: 0,
    pathLength: 0,
    mode: 'safe_wander',
    reachableCells: 0,
    riskFactor: 0,
  };

  // Timing
  private baseSpeed = 100; // ms per tick
  private currentTickInterval = 100;
  private lastTickTime = 0;
  private isRunning = false;
  private animationFrameId: number | null = null;

  constructor() {
    this.snakeAI = new SnakeAI();
    this.resetSnake(false);
    this.ensureMinimumApples();
  }

  public addListener(listener: GameEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(type: string, data: any): void {
    for (const listener of this.listeners) {
      try {
        listener(type, data);
      } catch (err) {
        console.error('Listener error in GameEngine:', err);
      }
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTickTime = performance.now();
    this.loop(this.lastTickTime);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (timestamp: number): void => {
    if (!this.isRunning) return;

    const elapsed = timestamp - this.lastTickTime;
    if (elapsed >= this.currentTickInterval) {
      this.tick();
      this.lastTickTime = timestamp;
    }

    this.updateActiveEvent();
    this.updateThankYouBanner();
    this.checkRandomEventTimer();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Main game physics tick executed by the autonomous AI
   */
  public tick(): void {
    // 1. Let Snake AI calculate optimal safe move towards apples
    const aiResult = this.snakeAI.getNextMove(
      this.head,
      [this.head, ...this.body],
      this.apples,
      this.portals,
      this.growthPending
    );

    this.direction = aiResult.direction;
    this.aiDebugInfo = aiResult.debug;

    // 2. Compute new head coordinate
    let newX = this.head.x + this.direction.x;
    let newY = this.head.y + this.direction.y;

    // Check portal traversal
    for (const portal of this.portals) {
      if (newX === portal.portalA.x && newY === portal.portalA.y) {
        newX = portal.portalB.x;
        newY = portal.portalB.y;
        this.emit('portal_traversed', { from: portal.portalA, to: portal.portalB });
        break;
      } else if (newX === portal.portalB.x && newY === portal.portalB.y) {
        newX = portal.portalA.x;
        newY = portal.portalA.y;
        this.emit('portal_traversed', { from: portal.portalB, to: portal.portalA });
        break;
      }
    }

    // Safety boundary validation
    if (newX < 0 || newX >= GRID_COLS || newY < 0 || newY >= GRID_ROWS) {
      // Wall collision prevention trigger
      this.handleDeath('wall_collision');
      return;
    }

    // Body collision check
    for (let i = 0; i < this.body.length - 1; i++) {
      if (this.body[i].x === newX && this.body[i].y === newY) {
        this.handleDeath('self_collision');
        return;
      }
    }

    // 3. Move snake forward
    const previousHead = { ...this.head };
    this.head = { x: newX, y: newY };
    this.body.unshift(previousHead);

    // Handle growth or tail popping
    if (this.growthPending > 0) {
      this.growthPending--;
      this.emit('snake_growth', { length: this.body.length + 1 });
    } else {
      this.body.pop();
    }

    // 4. Apple collection detection
    const appleIndex = this.apples.findIndex((a) => a.x === newX && a.y === newY);
    if (appleIndex !== -1) {
      const apple = this.apples[appleIndex];
      this.apples.splice(appleIndex, 1);

      // Multipliers from events
      const scoreMul = this.activeEvent?.type === 'double' ? 2 : 1;
      const growthMul = this.activeEvent?.type === 'super_growth' ? 3 : 1;

      const gainedScore = apple.value * scoreMul;
      const growthAmount = Math.max(1, Math.round(apple.value * 0.5 * growthMul));

      this.score += gainedScore;
      this.applesEaten++;
      this.growthPending += growthAmount;

      this.emit('apple_collected', {
        apple,
        gainedScore,
        currentScore: this.score,
        head: this.head,
      });

      // Immediately replenish apples if needed
      this.ensureMinimumApples();
    }
  }

  private handleDeath(reason: string): void {
    this.deaths++;
    this.emit('snake_died', { reason, deaths: this.deaths, score: this.score });
    this.resetSnake(true);
    this.emit('snake_restarted', { head: this.head });
  }

  private resetSnake(keepScore = true): void {
    this.head = { x: Math.floor(GRID_COLS / 2), y: Math.floor(GRID_ROWS / 2) };
    this.body = [
      { x: this.head.x - 1, y: this.head.y },
      { x: this.head.x - 2, y: this.head.y },
      { x: this.head.x - 3, y: this.head.y },
      { x: this.head.x - 4, y: this.head.y },
    ];
    this.direction = { x: 1, y: 0 };
    this.growthPending = 0;
    if (!keepScore) {
      this.applesEaten = 0;
      this.score = 0;
      this.deaths = 0;
    }
  }

  /**
   * Maintains baseline apple count on the arena
   */
  public ensureMinimumApples(): void {
    const targetCount = this.activeEvent?.type === 'rain' ? 24 : 8;
    while (this.apples.length < targetCount) {
      this.spawnRandomApple();
    }
  }

  public spawnRandomApple(preferredType?: AppleType, isSpecial = false): AppleItem | null {
    const occupied = new Set<string>();
    occupied.add(`${this.head.x},${this.head.y}`);
    for (const seg of this.body) {
      occupied.add(`${seg.x},${seg.y}`);
    }
    for (const apple of this.apples) {
      occupied.add(`${apple.x},${apple.y}`);
    }
    for (const portal of this.portals) {
      occupied.add(`${portal.portalA.x},${portal.portalA.y}`);
      occupied.add(`${portal.portalB.x},${portal.portalB.y}`);
    }

    const available: Point[] = [];
    // Leave 1-tile border padding for cleaner navigation when spawning standard apples
    for (let x = 1; x < GRID_COLS - 1; x++) {
      for (let y = 1; y < GRID_ROWS - 1; y++) {
        if (!occupied.has(`${x},${y}`)) {
          available.push({ x, y });
        }
      }
    }

    if (available.length === 0) return null;

    const loc = available[Math.floor(Math.random() * available.length)];
    const type = preferredType || this.pickRandomAppleType();
    const def = APPLE_DEFINITIONS[type];

    const apple: AppleItem = {
      id: `apple_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      x: loc.x,
      y: loc.y,
      type,
      value: def.value,
      createdAt: Date.now(),
      isEventSpecial: isSpecial,
    };

    this.apples.push(apple);
    this.emit('apple_spawned', apple);
    return apple;
  }

  private pickRandomAppleType(): AppleType {
    const roll = Math.random() * 100;
    if (roll < 65) return 'normal';
    if (roll < 85) return 'green';
    if (roll < 94) return 'special';
    if (roll < 98) return 'rare';
    return 'legendary';
  }

  /**
   * Ingest a gift event (from real TikTok LIVE webhook)
   */
  public handleGiftEvent(payload: GiftEventPayload): void {
    const { giftId, giftName, giftIcon, repeatCount, applesAdded, eventTriggered, user } = payload;

    // 1. Update supporter statistics
    const supporter: Supporter = this.supportersMap.get(user.id) || {
      userId: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`,
      totalApples: 0,
      giftCount: 0,
      lastGiftTime: Date.now(),
      lastGiftName: giftName,
      lastGiftIcon: giftIcon,
    };

    supporter.totalApples += applesAdded;
    supporter.giftCount += repeatCount;
    supporter.lastGiftTime = Date.now();
    supporter.lastGiftName = giftName;
    supporter.lastGiftIcon = giftIcon;
    this.supportersMap.set(user.id, supporter);

    // Update recent supporters
    this.lastSupporterItem = { ...supporter };
    this.recentSupportersList = [
      { ...supporter },
      ...this.recentSupportersList.filter((s) => s.userId !== user.id),
    ].slice(0, 10);

    // 2. Spawn apples in arena as reward (distributed neatly without lagging)
    const applesToSpawnCount = Math.min(applesAdded, 30);
    for (let i = 0; i < applesToSpawnCount; i++) {
      const type: AppleType =
        giftId === 'galaxy' && i % 3 === 0
          ? 'rare'
          : giftId === 'crown' && i === 0
          ? 'golden'
          : this.pickRandomAppleType();
      this.spawnRandomApple(type, giftId === 'galaxy' || giftId === 'crown');
    }

    // 3. Trigger Associated Event if configured
    if (eventTriggered) {
      this.triggerEvent(eventTriggered, user);
    }

    // 4. Trigger Smart Thank You message
    this.queueThankYouMessage(user, giftId, giftName, repeatCount, eventTriggered);

    // 5. Add to history
    const historyItem: HistoryEventItem = {
      id: payload.eventId,
      username: user.username,
      avatar: user.avatar,
      giftName,
      giftIcon,
      count: repeatCount,
      apples: applesAdded,
      event: eventTriggered,
      timestamp: Date.now(),
    };
    this.historyList = [historyItem, ...this.historyList].slice(0, 15);

    // 6. Record in LOGS DA LIVE
    this.addLiveLog(
      'gift',
      `@${user.username} enviou ${giftName} x${repeatCount} (+${applesAdded} 🍎)`,
      user,
      {
        name: giftName,
        icon: giftIcon,
        count: repeatCount,
        apples: applesAdded,
      }
    );

    // Emit broadcast
    this.emit('gift_received', payload);
    this.emit('supporter_update', {
      topSupporters: this.getTopSupporters(),
      recentSupporters: this.recentSupportersList,
      lastSupporter: this.lastSupporterItem,
    });
    this.emit('ranking_update', this.getTopSupporters());
  }

  /**
   * Event Management: starts or queues an event
   */
  public triggerEvent(
    type: EventType,
    user?: { username: string; displayName?: string; avatar?: string }
  ): void {
    // If surprise event, choose one randomly
    if (type === 'surprise') {
      const pool: EventType[] = [
        'rain',
        'turbo',
        'double',
        'super_growth',
        'golden_apple',
        'portal',
        'invasion',
        'treasure',
      ];
      type = pool[Math.floor(Math.random() * pool.length)];
    }

    const eventConfig = this.getEventConfig(type);

    const newEvent: ActiveGameEvent = {
      id: `event_${Date.now()}_${type}`,
      type,
      name: eventConfig.name,
      icon: eventConfig.icon,
      description: eventConfig.description,
      durationMs: eventConfig.durationMs,
      startTime: Date.now(),
      endTime: Date.now() + eventConfig.durationMs,
      activatedBy: user
        ? {
            username: user.username,
            displayName: user.displayName || user.username,
            avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`,
          }
        : undefined,
    };

    if (this.activeEvent) {
      // One event at a time rule: queue if event is already running
      this.eventQueue.push(newEvent);
    } else {
      this.startEvent(newEvent);
    }
  }

  private startEvent(event: ActiveGameEvent): void {
    this.activeEvent = event;
    this.applyEventStartEffects(event);
    this.emit('event_started', event);
  }

  private applyEventStartEffects(event: ActiveGameEvent): void {
    switch (event.type) {
      case 'turbo':
        this.currentTickInterval = 60; // Faster ticks for speed boost
        break;
      case 'rain':
        for (let i = 0; i < 20; i++) {
          this.spawnRandomApple(i % 4 === 0 ? 'rare' : undefined, true);
        }
        break;
      case 'golden_apple':
        this.spawnRandomApple('golden', true);
        break;
      case 'invasion':
        for (let i = 0; i < 25; i++) {
          this.spawnRandomApple(undefined, true);
        }
        break;
      case 'treasure':
        this.spawnRandomApple('treasure', true);
        break;
      case 'portal':
        this.createPortals();
        break;
      default:
        break;
    }
  }

  private createPortals(): void {
    // Generate two far-apart portal positions in open space
    const pA = { x: Math.floor(GRID_COLS * 0.2), y: Math.floor(GRID_ROWS * 0.3) };
    const pB = { x: Math.floor(GRID_COLS * 0.8), y: Math.floor(GRID_ROWS * 0.7) };
    this.portals = [
      {
        id: `portal_${Date.now()}`,
        portalA: pA,
        portalB: pB,
        expiresAt: this.activeEvent ? this.activeEvent.endTime : Date.now() + 15000,
      },
    ];
  }

  private updateActiveEvent(): void {
    if (!this.activeEvent) return;

    if (Date.now() >= this.activeEvent.endTime) {
      const finishedEvent = this.activeEvent;
      this.activeEvent = null;
      this.currentTickInterval = this.baseSpeed;
      this.portals = []; // Remove portals when event finishes

      this.eventCooldownUntil = Date.now() + 3000;
      this.emit('event_finished', finishedEvent);

      // Check queue
      if (this.eventQueue.length > 0) {
        const next = this.eventQueue.shift()!;
        next.startTime = Date.now();
        next.endTime = Date.now() + next.durationMs;
        this.startEvent(next);
      }
    }
  }

  /**
   * Automatic random events every 45-60 seconds if no active event (Requirement 26)
   */
  private checkRandomEventTimer(): void {
    const now = Date.now();
    if (
      !this.activeEvent &&
      this.eventQueue.length === 0 &&
      now > this.eventCooldownUntil &&
      now - this.lastRandomEventCheck >= 40000
    ) {
      this.lastRandomEventCheck = now;
      // 35% chance to trigger random arena event automatically
      if (Math.random() < 0.45) {
        const pool: EventType[] = ['rain', 'turbo', 'double', 'super_growth', 'invasion'];
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        this.triggerEvent(chosen, { username: 'Arena LIVE' });
      }
    }
  }

  private getEventConfig(type: EventType): {
    name: string;
    icon: string;
    description: string;
    durationMs: number;
  } {
    switch (type) {
      case 'rain':
        return {
          name: 'Chuva de Maçãs',
          icon: '🌧️',
          description: 'A arena está repleta de maçãs extras e raras!',
          durationMs: 14000,
        };
      case 'turbo':
        return {
          name: 'Modo Turbo',
          icon: '⚡',
          description: 'A cobra acelera sem perder a precisão dos cálculos!',
          durationMs: 12000,
        };
      case 'double':
        return {
          name: 'Dobro de Maçãs',
          icon: '🔥',
          description: 'Todas as maçãs coletadas valem 2x pontos!',
          durationMs: 15000,
        };
      case 'super_growth':
        return {
          name: 'Super Crescimento',
          icon: '💎',
          description: 'A cobra cresce 3x mais rápido a cada maçã!',
          durationMs: 12000,
        };
      case 'golden_apple':
        return {
          name: 'Maçã Dourada Lendária',
          icon: '👑',
          description: 'Uma coroa dourada de +50 maçãs surgiu na arena!',
          durationMs: 18000,
        };
      case 'portal':
        return {
          name: 'Vórtice de Portais',
          icon: '🌀',
          description: 'Dois portais quânticos foram abertos na arena!',
          durationMs: 16000,
        };
      case 'invasion':
        return {
          name: 'Invasão Massiva de Maçãs',
          icon: '💥',
          description: 'Explosão cósmica gerou dezenas de maçãs!',
          durationMs: 12000,
        };
      case 'treasure':
        return {
          name: 'Caça ao Tesouro',
          icon: '💰',
          description: 'Baú lendário aguarda a rota mais segura!',
          durationMs: 16000,
        };
      default:
        return {
          name: 'Evento Surpresa',
          icon: '🎁',
          description: 'Um evento misterioso foi invocado!',
          durationMs: 12000,
        };
    }
  }

  /**
   * Smart Thank You messages with tier logic and anti-spam cooldown (Requirements 14 & 15)
   */
  private queueThankYouMessage(
    user: { username: string; avatar?: string },
    giftId: string,
    giftName: string,
    count: number,
    eventTriggered?: EventType
  ): void {
    const now = Date.now();
    const lastUserThank = this.lastThankYouByUser.get(user.username) || 0;

    // 4 second cooldown per user to avoid text message spam
    if (now - lastUserThank < 4000) return;
    this.lastThankYouByUser.set(user.username, now);

    let text = '';
    let type: ThankYouMessage['type'] = 'small';

    if (giftId === 'galaxy') {
      text = `🌌 UAU! @${user.username} enviou uma GALÁXIA!`;
      type = 'large';
    } else if (eventTriggered) {
      text = `⚡ @${user.username} ativou o evento ${this.getEventConfig(eventTriggered).name}!`;
      type = 'event';
    } else if (count >= 10 || giftId === 'doughnut' || giftId === 'heart_me') {
      text = `🔥 Valeu, @${user.username}! A cobra cresceu com ${giftName}!`;
      type = 'medium';
    } else {
      text = `❤️ Obrigado, @${user.username} pelo presente!`;
      type = 'small';
    }

    const msg: ThankYouMessage = {
      id: `thank_${now}_${Math.random().toString(36).substring(2, 6)}`,
      username: user.username,
      avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`,
      text,
      type,
      createdAt: now,
      expiresAt: now + 4500,
    };

    if (!this.activeThankYouMessage) {
      this.activeThankYouMessage = msg;
      this.emit('thank_you_message', msg);
    } else {
      this.thankYouQueue.push(msg);
    }
  }

  private updateThankYouBanner(): void {
    if (this.activeThankYouMessage && Date.now() >= this.activeThankYouMessage.expiresAt) {
      this.activeThankYouMessage = null;
      if (this.thankYouQueue.length > 0) {
        this.activeThankYouMessage = this.thankYouQueue.shift()!;
        this.activeThankYouMessage.expiresAt = Date.now() + 4500;
        this.emit('thank_you_message', this.activeThankYouMessage);
      }
    }
  }

  public updateLiveStatus(status: LiveInfo): void {
    this.liveInfo = { ...status };
    this.emit('live_status', this.liveInfo);
  }

  public getTopSupporters(): Supporter[] {
    return Array.from(this.supportersMap.values())
      .sort((a, b) => b.totalApples - a.totalApples)
      .slice(0, 10);
  }

  public getState(): GameEngineState {
    return {
      snake: {
        head: this.head,
        body: this.body,
        direction: this.direction,
        applesEaten: this.applesEaten,
        score: this.score,
        length: this.body.length + 1,
        deaths: this.deaths,
        speed: Math.round(1000 / this.currentTickInterval),
      },
      apples: this.apples,
      activeEvent: this.activeEvent,
      eventQueue: this.eventQueue,
      portals: this.portals,
      supporters: this.getTopSupporters(),
      recentSupporters: this.recentSupportersList,
      lastSupporter: this.lastSupporterItem,
      history: this.historyList,
      activeThankYou: this.activeThankYouMessage,
      liveInfo: this.liveInfo,
      aiDebug: this.aiDebugInfo,
      liveLogs: this.liveLogsList,
      growthMultiplier: this.activeEvent?.type === 'super_growth' ? 3 : 1,
      scoreMultiplier: this.activeEvent?.type === 'double' ? 2 : 1,
    };
  }
}
