// Central tuning knobs for the game. Adjust here to change feel.

export const TILE = 1;            // size of one grid cell in world units
export const LANES = 15;          // number of left/right columns the player can occupy
export const HALF_LANES = Math.floor(LANES / 2); // playable range is [-HALF_LANES, +HALF_LANES]

export const HOP_DURATION = 0.13; // seconds for one hop animation
export const HOP_HEIGHT = 0.55;   // how high the player arcs during a hop

// Rows: forward direction. Row index increases as the player advances.
// A short grass intro, then a continuous corridor: THREE straight bars, each
// fixed at its own lane, run the whole way in parallel. Some rows along each
// bar's lane carry a swing, some don't (a mix of danger rows and free-pass rows).
export const SAFE_ROWS_AT_START = 4; // grass rows before the corridor begins

// Three independent continuous bars, each running the whole corridor on its
// own fixed lane, each rolling its own swings independently. The outer two
// sit at the far edges, giving each bar a 7-unit gap (3.5 half-gap) to its
// neighbor — safely more than the ~2.86 max reach at full amplitude.
export const BAR_LANES = [-7, 0, 7];

// Bars/swings generate as multi-row SETS per lane, not one-off standalone
// rows: a set shares one continuous bar across several consecutive rows.
export const SET_START_CHANCE = 0.35; // chance a lane starts a new set on a given grass row
export const SET_MIN_LENGTH = 3;      // a set spans this many consecutive rows, sharing one bar
export const SET_MAX_LENGTH = 6;

// Of the rows that get a bar, the fraction whose swing is unoccupied (an empty
// seat that hangs straight down and permanently blocks that bar's lane).
export const EMPTY_SWING_CHANCE = 0.25;

// Chance any given corridor row gets exactly one bush: a static, non-lethal
// obstacle in an inner lane that the player must step around.
export const BUSH_ROW_CHANCE = 0.25;

// Swing tuning. Swings sweep LEFT-RIGHT across their bar's lane by rotating
// around the Z axis.
export const SWING = {
  minSpeed: 1.1,        // radians/sec (angular speed of the sweep)
  maxSpeed: 2.4,
  // Reach = chainLength * sin(amp). With BAR_LANES spaced 7 apart (3.5 half-gap
  // between neighbors) and chainLength 3.4, big dramatic arcs (up to amp 1.0,
  // reach ~2.86) still leave a comfortable buffer before reaching a neighbor.
  minAmplitude: 0.5,    // radians from vertical at the peak (~29 deg)
  maxAmplitude: 1.0,    // radians from vertical at the peak (~57 deg)
  chainLength: 3.4,     // length of the swing chains in world units (long pendulum)
  // Hitbox half-widths: an empty swing's widest point is the bare seat; an
  // occupied swing's widest point is the kid sitting on it. Not the same width.
  occupiedHalfWidth: 0.22, // matches the kid's 0.4-wide torso
  emptyHalfWidth: 0.33,    // matches the seat mesh's 0.62 width
};

// Matches the player's 0.62-wide torso.
export const PLAYER_HALF_WIDTH = 0.3;

// Difficulty ramp: how much swing speed scales as you progress (per row).
export const DIFFICULTY_PER_ROW = 0.004;
export const MAX_DIFFICULTY = 1.8;

// Camera framing (isometric-style follow). Only viewSize is meant to be
// tuned here; the follow logic lives in main.js. Small viewSize => zoomed in,
// showing only ~3-4 rows ahead.
export const CAMERA = {
  viewSize: 6.5,
  distance: 5,
  height: 15,
  back: 10,     // how far behind the player (in +row lookback) the camera sits
  lookAhead: 1.5, // bias the look target a little ahead of the player
};

// Bright, chunky Overcooked-ish palette
export const COLORS = {
  skyTop: 0x8fd3ff,
  grass: [0x86d46b, 0x7ac95f],   // alternating grass shades
  dirt: 0xcaa06a,
  swingRow: [0xbfe0a0, 0xb4d894], // slightly different tint under the corridor lanes
  frame: 0xff7a4d,               // swing set metal frame
  frameDark: 0xe45f36,
  chain: 0x556070,
  player: 0xffd24a,
  playerAccent: 0xff8a3d,
  npc: [0xff6b6b, 0x4da3ff, 0x9b6bff, 0x3ecf8e, 0xff9f43, 0xf368e0],
};
