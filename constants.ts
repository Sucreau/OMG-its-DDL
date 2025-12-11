import { GamePhase } from "./types";

export const TOTAL_TIME = 60;
export const PHASE_THRESHOLDS = {
  [GamePhase.DAY]: 0,
  [GamePhase.DUSK]: 20,
  [GamePhase.NIGHT]: 40
};

export const PLAYER_SIZE = 6; // vw
export const ITEM_SIZE = 4; // vw

// Vitality Decay per second (Tuned for 60s game)
export const VITALITY_DECAY = {
  [GamePhase.DAY]: 1.5,    // Reduced from 2
  [GamePhase.DUSK]: 3.0,   // Reduced from 4
  [GamePhase.NIGHT]: 4.5   // Reduced from 6
};

export const MOVEMENT_SMOOTHING = 0.1; // Lower is smoother/slower

export const DEFAULT_EXPRESSIONS = {
  [GamePhase.DAY]: '🙂', // Calm
  [GamePhase.DUSK]: '🥱', // Sleepy
  [GamePhase.NIGHT]: '😱' // Panic
};