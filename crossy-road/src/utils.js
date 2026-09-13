// Small shared helpers.

export function randRange(min, max) {
  return min + Math.random() * (max - min);
}

export function randInt(min, max) {
  return Math.floor(randRange(min, max + 1));
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// Ease-out for hop landing feel
export function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}
