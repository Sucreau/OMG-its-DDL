export enum GamePhase {
  DAY = 'DAY',       // 0-20s
  DUSK = 'DUSK',     // 21-40s
  NIGHT = 'NIGHT'    // 41-60s
}

export enum GameState {
  MENU = 'MENU',
  RULES = 'RULES',
  PLAYING = 'PLAYING',
  GAME_OVER_FAIL = 'GAME_OVER_FAIL', // Vitality 0
  GAME_OVER_SUCCESS = 'GAME_OVER_SUCCESS', // Progress 100
  GAME_OVER_NORMAL = 'GAME_OVER_NORMAL' // Time up, incomplete
}

export enum ItemType {
  PHONE = 'PHONE',
  MATERIAL = 'MATERIAL',
  SNACK = 'SNACK',
  DINNER = 'DINNER',
  SOCIAL_NOTIF = 'SOCIAL_NOTIF',
  COFFEE = 'COFFEE',
  SEARCH = 'SEARCH',
  POPUP_OBSTACLE = 'POPUP_OBSTACLE'
}

export interface GameObject {
  id: string;
  type: ItemType;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  width: number; // Percentage relative to screen width
  height: number; // Percentage relative to screen height
  dx: number; // Velocity X
  dy: number; // Velocity Y
  createdAt: number;
}

export interface ActiveEffect {
  id: string;
  type: 'vitality' | 'progress';
  amount: number; // Total amount to add/subtract
  duration: number; // Duration in seconds
  elapsed: number;
}

export interface PlayerState {
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  vitality: number; // 0-100
  progress: number; // 0-100
  isStunned: boolean;
  stunEndTime: number;
  faceExpression: string; // 'neutral', 'happy', 'excited', 'sleepy', 'panic', 'crying', 'laughing'
  expressionEndTime: number; // When to revert to default
  activeEffects: ActiveEffect[];
}

export interface PopUpMessage {
  id: string;
  text: string;
  x: number;
  y: number;
  type: 'good' | 'bad' | 'neutral';
  createdAt: number;
}