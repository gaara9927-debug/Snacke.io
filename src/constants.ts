import { AppleType, GiftDefinition } from './types';

export const TARGET_TIKTOK_USER = 'rainz878';

export const GRID_COLS = 44;
export const GRID_ROWS = 32;
export const CELL_SIZE = 22; // Render pixel scale per cell

export const APPLE_DEFINITIONS: Record<AppleType, {
  name: string;
  value: number;
  color: string;
  glowColor: string;
  icon: string;
  spawnWeight: number;
}> = {
  normal: {
    name: 'Maçã Normal',
    value: 1,
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.45)',
    icon: '🍎',
    spawnWeight: 65,
  },
  green: {
    name: 'Maçã Verde',
    value: 2,
    color: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.45)',
    icon: '🍏',
    spawnWeight: 20,
  },
  special: {
    name: 'Maçã Especial',
    value: 5,
    color: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.55)',
    icon: '⭐',
    spawnWeight: 9,
  },
  rare: {
    name: 'Maçã Rara',
    value: 10,
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.65)',
    icon: '💎',
    spawnWeight: 4,
  },
  legendary: {
    name: 'Maçã Lendária',
    value: 25,
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.75)',
    icon: '🌟',
    spawnWeight: 2,
  },
  golden: {
    name: 'Maçã Dourada',
    value: 50,
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.9)',
    icon: '👑',
    spawnWeight: 0, // Event only
  },
  treasure: {
    name: 'Baú do Tesouro',
    value: 35,
    color: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.85)',
    icon: '💰',
    spawnWeight: 0, // Event only
  },
};

export const GIFTS_CATALOG: GiftDefinition[] = [
  {
    id: 'rose',
    name: 'Rosa',
    icon: '🌹',
    apples: 5,
    tier: 'small',
    description: '+5 maçãs na arena',
  },
  {
    id: 'candy',
    name: 'Doce',
    icon: '🍬',
    apples: 3,
    tier: 'small',
    description: '+3 maçãs na arena',
  },
  {
    id: 'cookie',
    name: 'Biscoito',
    icon: '🍪',
    apples: 4,
    tier: 'small',
    description: '+4 maçãs na arena',
  },
  {
    id: 'star',
    name: 'Estrela',
    icon: '⭐',
    apples: 7,
    tier: 'small',
    description: '+7 maçãs na arena',
  },
  {
    id: 'doughnut',
    name: 'Rosquinha',
    icon: '🍩',
    apples: 15,
    tier: 'medium',
    description: '+15 maçãs na arena',
  },
  {
    id: 'heart_me',
    name: 'Heart Me',
    icon: '❤️',
    apples: 30,
    tier: 'medium',
    description: '+30 maçãs na arena',
  },
  {
    id: 'galaxy',
    name: 'Galáxia',
    icon: '🌌',
    apples: 100,
    tier: 'large',
    description: '+100 maçãs + Animação Cósmica',
  },
  {
    id: 'lightning',
    name: 'Raio',
    icon: '⚡',
    apples: 20,
    eventTrigger: 'turbo',
    tier: 'special',
    description: 'Ativa o Modo Turbo',
  },
  {
    id: 'rain',
    name: 'Chuva',
    icon: '🌧️',
    apples: 25,
    eventTrigger: 'rain',
    tier: 'special',
    description: 'Ativa Chuva de Maçãs',
  },
  {
    id: 'fire',
    name: 'Fogo',
    icon: '🔥',
    apples: 25,
    eventTrigger: 'double',
    tier: 'special',
    description: 'Ativa Dobro de Maçãs (2x)',
  },
  {
    id: 'diamond',
    name: 'Diamante',
    icon: '💎',
    apples: 35,
    eventTrigger: 'super_growth',
    tier: 'special',
    description: 'Ativa Super Crescimento',
  },
  {
    id: 'crown',
    name: 'Coroa',
    icon: '👑',
    apples: 50,
    eventTrigger: 'golden_apple',
    tier: 'special',
    description: 'Gera a Maçã Dourada Lendária',
  },
  {
    id: 'portal',
    name: 'Portal',
    icon: '🌀',
    apples: 30,
    eventTrigger: 'portal',
    tier: 'special',
    description: 'Abre 2 Portais de Teleporte',
  },
  {
    id: 'explosion',
    name: 'Explosão',
    icon: '💥',
    apples: 40,
    eventTrigger: 'invasion',
    tier: 'special',
    description: 'Gera Invasão Massiva de Maçãs',
  },
  {
    id: 'chest',
    name: 'Baú',
    icon: '💰',
    apples: 45,
    eventTrigger: 'treasure',
    tier: 'special',
    description: 'Invoca Caça ao Tesouro',
  },
  {
    id: 'surprise',
    name: 'Surpresa',
    icon: '🎁',
    apples: 50,
    eventTrigger: 'surprise',
    tier: 'special',
    description: 'Sorteia um Grande Evento',
  },
];
