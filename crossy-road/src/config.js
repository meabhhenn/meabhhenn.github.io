// Central tuning knobs for the game. Adjust here to change feel.

export const TILE = 1;            // size of one grid cell in world units
export const LANES = 9;           // number of left/right columns the player can occupy
export const HALF_LANES = Math.floor(LANES / 2); // playable range is [-HALF_LANES, +HALF_LANES]

export const HOP_DURATION = 0.13; // seconds for one hop animation
export const HOP_HEIGHT = 0.55;   // how high the player arcs during a hop

// Rows: forward direction. Row index increases as the player advances.
export const SAFE_ROWS_AT_START = 4; // grass rows before the first swing set

// Swing tuning (randomized per swing within these ranges).
// Swings arc FORWARD/BACKWARD (toward/away from the player) around the X axis.
export const SWING = {
  minSpeed: 1.1,        // radians/sec (angular speed of the arc)
  maxSpeed: 2.4,
  minAmplitude: 0.85,   // radians (how far the swing arcs from vertical)
  maxAmplitude: 1.25,
  chainLength: 2.2,     // length of the swing chains in world units

  // Layout along the single arched bar
  minSwings: 4,         // number of swings hanging from one bar (randomized)
  maxSwings: 6,
  slotSpacing: 1.35,    // world-units between adjacent hanger slots (leaves visible gaps)
  slotHalfWidth: 0.42,  // half-width of a swing's dangerous x-slot (< half of slotSpacing => gaps are safe)

  // Hazard activation: the swing is dangerous while it has arced TOWARD the
  // player far enough that the seat overlaps the player's row. Measured as the
  // seat's forward reach (world units) into the row from directly-below.
  dangerReach: 0.55,    // seat must reach at least this far toward player to hit
};

// Row generation: chance a newly generated row is a swing-set row vs grass.
export const SWING_ROW_CHANCE = 0.62;

// Difficulty ramp: how much swing speed scales as you progress (per row).
export const DIFFICULTY_PER_ROW = 0.004;
export const MAX_DIFFICULTY = 1.8;

// Camera framing (isometric-style follow).
// viewSize sets how zoomed-in the orthographic camera is: smaller => closer,
// showing fewer rows ahead. Tuned so ~3-4 rows ahead are visible.
export const CAMERA = {
  viewSize: 8.5,
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
  swingRow: [0xbfe0a0, 0xb4d894], // slightly different tint under swing sets
  frame: 0xff7a4d,               // swing set metal frame
  frameDark: 0xe45f36,
  chain: 0x556070,
  player: 0xffd24a,
  playerAccent: 0xff8a3d,
  npc: [0xff6b6b, 0x4da3ff, 0x9b6bff, 0x3ecf8e, 0xff9f43, 0xf368e0],
};
