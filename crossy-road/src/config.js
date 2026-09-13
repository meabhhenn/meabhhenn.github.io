// Central tuning knobs for the game. Adjust here to change feel.

export const TILE = 1;            // size of one grid cell in world units
export const LANES = 9;           // number of left/right columns the player can occupy
export const HALF_LANES = Math.floor(LANES / 2); // playable range is [-HALF_LANES, +HALF_LANES]

export const HOP_DURATION = 0.13; // seconds for one hop animation
export const HOP_HEIGHT = 0.55;   // how high the player arcs during a hop

// Rows: forward direction. Row index increases as the player advances.
export const SAFE_ROWS_AT_START = 4; // grass rows before the first swing set

// Swing tuning (randomized per swing within these ranges)
export const SWING = {
  minSpeed: 1.1,        // radians/sec (angular speed of the arc)
  maxSpeed: 2.6,
  minAmplitude: 0.55,   // radians (how far the swing arcs from vertical)
  maxAmplitude: 1.15,
  chainLength: 2.2,     // length of the swing chains in world units
  seatHalfWidth: 0.5,   // half-width of the seat/kid used for collision on X
};

// Row generation: chance a newly generated row is a swing-set row vs grass.
export const SWING_ROW_CHANCE = 0.62;

// Difficulty ramp: how much swing speed scales as you progress (per row).
export const DIFFICULTY_PER_ROW = 0.004;
export const MAX_DIFFICULTY = 1.8;

// Camera framing (isometric-style follow)
export const CAMERA = {
  distance: 11,
  height: 9,
  back: 8,      // how far behind the player (in +row lookback) the camera sits
  lookAhead: 2, // bias the look target a little ahead of the player
};

// Bright, chunky Overcooked-ish palette
export const COLORS = {
  skyTop: 0x8fd3ff,
  grass: [0x86d46b, 0x7ac95f],   // alternating grass shades
  dirt: 0xcaa06a,
  swingRow: [0xbfe0a0, 0xb4d894], // slightly different tint under swing sets
  frame: 0xff7a4d,               // swing set metal frame
  frameDark: 0xe45f36,
  chain: 0x556070,
  player: 0xffd24a,
  playerAccent: 0xff8a3d,
  npc: [0xff6b6b, 0x4da3ff, 0x9b6bff, 0x3ecf8e, 0xff9f43, 0xf368e0],
};
