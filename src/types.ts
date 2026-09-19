export type LiveStatus = 'unavailable' | 'live' | 'offline' | 'connecting';

export interface LiveInfo {
  targetUsername: string;
  status: LiveStatus;
  statusMessage: string;
  isConfigured: boolean;
  sessionId?: string;
  roomTitle?: string;
  viewerCount?: number;
  lastChecked: number;
}

export interface TikTokAccountInfo {
  targetUsername: string;
  status: LiveStatus;
  isConfigured: boolean;
  sessionConfigured: boolean;
  apiKeyConfigured: boolean;
  statusMessage: string;
  viewerCount?: number;
  lastChecked: number;
}

export interface LiveLogItem {
  id: string;
  timestamp: number;
  type: 'system' | 'gift' | 'event' | 'connection' | 'join';
  message: string;
  user?: {
    username: string;
    displayName?: string;
    avatar?: string;
  };
  gift?: {
    name: string;
    icon: string;
    count: number;
    apples: number;
  };
}

export type AppleType =
  | 'normal'     // +1 🍎
  | 'green'      // +2 🍏
  | 'special'    // +5 ⭐
  | 'rare'       // +10 💎
  | 'legendary'  // +25 🌟
  | 'golden'     // +50 👑 (Event)
  | 'treasure';  // +35 💰 (Event)

export interface AppleItem {
  id: string;
  x: number;
  y: number;
  type: AppleType;
  value: number;
  createdAt: number;
  expiresAt?: number;
  isEventSpecial?: boolean;
}

export type EventType =
  | 'rain'           // Chuva de Maçãs 🌧️
  | 'turbo'          // Modo Turbo ⚡
  | 'double'         // Dobro de Maçãs 🔥
  | 'super_growth'   // Super Crescimento 💎
  | 'golden_apple'   // Maçã Dourada 👑
  | 'portal'         // Portal 🌀
  | 'invasion'       // Invasão de Maçãs 💥
  | 'treasure'       // Caça ao Tesouro 💰
  | 'surprise';      // Evento Surpresa 🎁

export interface ActiveGameEvent {
  id: string;
  type: EventType;
  name: string;
  icon: string;
  description: string;
  durationMs: number;
  startTime: number;
  endTime: number;
  activatedBy?: {
    username: string;
    displayName: string;
    avatar: string;
  };
  data?: any;
}

export interface PortalPair {
  id: string;
  portalA: { x: number; y: number };
  portalB: { x: number; y: number };
  expiresAt: number;
}

export interface GiftDefinition {
  id: string;
  name: string;
  icon: string;
  apples: number;
  eventTrigger?: EventType;
  tier: 'small' | 'medium' | 'large' | 'special';
  description: string;
}

export interface GiftEventPayload {
  eventId: string;
  giftId: string;
  giftName: string;
  giftIcon: string;
  repeatCount: number;
  applesAdded: number;
  eventTriggered?: EventType;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  timestamp: number;
}

export interface Supporter {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  totalApples: number;
  giftCount: number;
  lastGiftTime: number;
  lastGiftName: string;
  lastGiftIcon: string;
}

export interface ThankYouMessage {
  id: string;
  username: string;
  avatar: string;
  text: string;
  type: 'small' | 'medium' | 'large' | 'event';
  createdAt: number;
  expiresAt: number;
}

export interface HistoryEventItem {
  id: string;
  username: string;
  avatar: string;
  giftName: string;
  giftIcon: string;
  count: number;
  apples: number;
  event?: string;
  timestamp: number;
}

export interface SnakeSegment {
  x: number;
  y: number;
}

export interface SnakeAIDebugInfo {
  targetApple: AppleItem | null;
  targetScore: number;
  pathLength: number;
  mode: 'seeking_apple' | 'safe_wander' | 'tail_following' | 'portal_travel' | 'emergency_evasion';
  reachableCells: number;
  riskFactor: number;
}
