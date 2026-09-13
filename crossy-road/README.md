# Swing Set Dash

A browser-playable, Crossy-Road-style game built for CMU 15-113 HW2. You hop forward row by row through a playground gauntlet, dodging kids swinging back and forth on three parallel swing sets, timing your crossings, and stepping around static obstacles (empty swings and bushes) along the way.

**Play it live:** https://meabhhenn.github.io/crossy-road/

## How to play

- **Arrow keys / WASD** or **swipe** to move: forward, back, left, right.
- Score = how many rows forward you've reached.
- Get hit by a swinging kid and it's game over — hit "Play again" to restart.

## What's in the level

- Three independent, continuous swing-set bars running the length of the course, each spawning "sets" of 3–6 swings at a time (not one-off individual swings), separated by open grass.
- Swings sweep left-right at varying speeds and arc sizes; some seats are empty (static obstacles you have to step around rather than danger).
- Occasional bushes block a single lane per row as a non-lethal obstacle.
- The level is always guaranteed passable — hazards are spaced so there's never a row where every lane is blocked.
- On collision, the character visibly topples over before the game-over screen appears.

## Tech

Plain HTML/CSS/JavaScript (ES modules, no build step) using [Three.js](https://threejs.org/) via CDN import map, so it runs directly on GitHub Pages with no bundler. Built with an isometric-style orthographic follow camera and a grid-based row/lane movement system.

## Folder structure

```
crossy-road/
├── index.html        # entry point
├── styles.css         # HUD, overlay, and hit-flash styling
├── src/
│   ├── main.js         # renderer, camera, input, game loop
│   ├── world.js         # row/lane generation, swings, bushes, collision
│   ├── player.js        # player movement and hop animation
│   ├── config.js        # all tuning constants (lanes, swing physics, camera, etc.)
│   └── utils.js         # small math/random helpers
├── prompt_log.md       # AI prompt log for this assignment
└── README.md           # this file
```

## AI tools used

- **Kiro** — primary AI IDE; wrote and iterated on all game code based on prompts.
- **Claude** — secondary tool; used to review the actual code for bugs, verify Kiro's fixes actually landed, and translate design feedback into precise prompts for Kiro. See `prompt_log.md` for the full prompt history.
