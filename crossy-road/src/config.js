// Central tuning knobs for the game. Adjust here to change feel.

export const TILE = 1;            // size of one grid cell in world units
export const LANES = 9;           // number of left/right columns the player can occupy
export const HALF_LANES = Math.floor(LANES / 2); // playable range is [-HALF_LANES, +HALF_LANES]

export const HOP_DURATION = 0.13; // seconds for one hop animation
export const HOP_HEIGHT = 0.55;   // how high the player arcs during a hop

// Rows: forward direction. Row index increases as the player advances.
// A short grass intro, then a continuous corridor: ONE straight bar fixed at
// BAR_LANE runs the whole way. Some rows along that lane carry a swing, some
// don't (a mix of danger rows and free-pass rows).
export const SAFE_ROWS_AT_START = 4; // grass rows before the corridor begins

// The single continuous bar lives at this lane for the entire corridor.
export const BAR_LANE = 0;

// Fraction of corridor rows that actually have a swing (rest are free passes).
export const SWING_ROW_CHANCE = 0.55;

// Swing tuning. Swings sweep LEFT-RIGHT across the bar's lane by rotating
// around the Z axis. Amplitude is capped so a swing only threatens ~one lane
// on either side and the kid never tips past ~45 degrees from vertical.
export const SWING = {
  minSpeed: 1.1,        // radians/sec (angular speed of the sweep)
  maxSpeed: 2.4,
  // Reach = chainLength * sin(amp). Longer chains => bigger swept danger zone.
  // With chainLength 3.4, amp 0.6 rad (~34 deg) reaches ~1.9 lanes each side.
  minAmplitude: 0.3,    // radians from vertical at the peak (~24 deg)
  maxAmplitude: 0.9,    // radians from vertical at the peak (~34 deg)
  chainLength: 3.4,     // length of the swing chains in world units (long pendulum)
  seatHalfWidth: 0.45,  // half-width of the seat/kid used for X-overlap collision
};

// Difficulty ramp: how much swing speed scales as you progress (per row).
export const DIFFICULTY_PER_ROW = 0.004;
export const MAX_DIFFICULTY = 1.8;

// Camera framing (isometric-style follow). Only viewSize is meant to be
// tuned here; the follow logic lives in main.js. Small viewSize => zoomed in,
// showing only ~3-4 rows ahead.
export const CAMERA = {
  viewSize: 4.5,
  distance: 11,
  height: 9,
  back: 8,      // how far behind the player (in +row lookback) the camera sits
  lookAhead: 1.5, // bias the look target a little ahead of the player
};

// Bright, chunky Overcooked-ish palette
export const COLORS = {
  skyTop: 0x8fd3ff,
  grass: [0x86d46b, 0x7ac95f],   // alternating grass shades
  dirt: 0xcaa06a,
  swingRow: [0xbfe0a0, 0xb4d894], // slightly different tint under the corridor lane
  frame: 0xff7a4d,               // swing set metal frame
  frameDark: 0xe45f36,
  chain: 0x556070,
  player: 0xffd24a,
  playerAccent: 0xff8a3d,
  npc: [0xff6b6b, 0x4da3ff, 0x9b6bff, 0x3ecf8e, 0xff9f43, 0xf368e0],
};
