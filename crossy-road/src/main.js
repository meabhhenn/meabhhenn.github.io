import * as THREE from "three";
import { CAMERA, COLORS, TILE } from "./config.js";
import { Player } from "./player.js";
import { World } from "./world.js";

// ---- Renderer / scene setup ---------------------------------------------

const canvas = document.getElementById("game-canvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.skyTop);
scene.fog = new THREE.Fog(COLORS.skyTop, 22, 40);

// Orthographic camera gives that clean isometric Crossy Road look.
let camera;
function makeCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  const viewSize = CAMERA.viewSize;
  camera = new THREE.OrthographicCamera(
    -viewSize * aspect,
    viewSize * aspect,
    viewSize,
    -viewSize,
    0.1,
    200
  );
}
makeCamera();

// Lighting: warm key light + soft ambient for the bright Overcooked vibe.
const ambient = new THREE.HemisphereLight(0xffffff, 0x8fae7a, 0.95);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfff2d6, 1.1);
sun.position.set(-8, 18, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 60;
sun.shadow.camera.left = -20;
sun.shadow.camera.right = 20;
sun.shadow.camera.top = 20;
sun.shadow.camera.bottom = -20;
scene.add(sun);
scene.add(sun.target);

// ---- Game objects --------------------------------------------------------

const world = new World(scene);
const player = new Player();
scene.add(player.group);

// ---- Camera follow -------------------------------------------------------

const camOffset = new THREE.Vector3(-CAMERA.distance, CAMERA.height, CAMERA.back);
const camTarget = new THREE.Vector3();
const camLook = new THREE.Vector3();

function updateCamera(dt, immediate = false) {
  // desired camera position trails the player; we follow the player's row (z)
  const px = player.group.position.x * 0.35; // slight horizontal follow only
  const pz = player.group.position.z;

  camTarget.set(px + camOffset.x, camOffset.y, pz + camOffset.z);
  const lerp = immediate ? 1 : 1 - Math.pow(0.001, dt);
  camera.position.lerp(camTarget, lerp);

  camLook.set(px, 0.5, pz - CAMERA.lookAhead);
  camera.lookAt(camLook);
}

// ---- Input ---------------------------------------------------------------

let running = false;

// Death knockdown animation state. When active, tick() keeps running and
// topples the player over before showing the game-over overlay.
const deathAnim = { active: false, t: 0, duration: 0.6 };

function handleMove(dLane, dRow) {
  if (!running) return;
  player.tryMove(dLane, dRow);
}

window.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp": case "w": case "W":
      e.preventDefault(); handleMove(0, 1); break;
    case "ArrowDown": case "s": case "S":
      e.preventDefault(); handleMove(0, -1); break;
    case "ArrowLeft": case "a": case "A":
      e.preventDefault(); handleMove(-1, 0); break;
    case "ArrowRight": case "d": case "D":
      e.preventDefault(); handleMove(1, 0); break;
  }
});

// Touch swipe (and tap = hop forward) for mobile
let touchStart = null;
canvas.addEventListener("touchstart", (e) => {
  const t = e.changedTouches[0];
  touchStart = { x: t.clientX, y: t.clientY };
}, { passive: true });

canvas.addEventListener("touchend", (e) => {
  if (!touchStart) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const THRESH = 24;

  if (absX < THRESH && absY < THRESH) {
    handleMove(0, 1); // tap = forward
  } else if (absX > absY) {
    handleMove(dx > 0 ? 1 : -1, 0);
  } else {
    handleMove(0, dy > 0 ? -1 : 1);
  }
  touchStart = null;
}, { passive: true });

// ---- HUD / overlay -------------------------------------------------------

const scoreEl = document.getElementById("score");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMsg = document.getElementById("overlay-msg");
const startBtn = document.getElementById("start-btn");
const gameRoot = document.getElementById("game-root");

let score = 0;
let best = 0;

function updateScore() {
  const s = player.maxRow;
  if (s !== score) {
    score = s;
    scoreEl.textContent = String(score);
  }
}

// Placeholder for the "humph / kids scream" reaction (audio to be added later).
function playDeathReaction() {
  gameRoot.classList.remove("hit-flash");
  // force reflow so the animation can restart
  void gameRoot.offsetWidth;
  gameRoot.classList.add("hit-flash");
  // body stays visible, fallen over, under the overlay (see deathAnim in tick)
}

function startGame() {
  world.reset();
  player.reset();
  score = 0;
  scoreEl.textContent = "0";
  updateCamera(0, true);
  overlay.classList.add("hidden");
  running = true;
}

function gameOver() {
  running = false;
  best = Math.max(best, score);
  overlayTitle.textContent = "Ouch!";
  overlayMsg.innerHTML = `You got <b>${score}</b> rows in.<br/>Best: <b>${best}</b>`;
  startBtn.textContent = "Play again";
  overlay.classList.remove("hidden");
}

startBtn.addEventListener("click", startGame);

// ---- Main loop -----------------------------------------------------------

const clock = new THREE.Clock();

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05); // clamp big frame gaps

  if (running) {
    player.update(dt);
    world.ensureRows(player.row);
    world.update(dt, player.row);

    // Only check collision when settled into a row (not mid-hop over it),
    // but also check during the hop so fast swings still catch you fairly.
    if (world.checkCollision(player.row, player.worldX) && player.alive) {
      player.alive = false;
      // start the knockdown; keep running so tick() animates the topple
      deathAnim.active = true;
      deathAnim.t = 0;
      playDeathReaction();
    }

    // Advance the death knockdown: topple the body over toward +z, then end.
    if (deathAnim.active) {
      deathAnim.t += dt;
      const k = Math.min(deathAnim.t / deathAnim.duration, 1);
      player.body.rotation.x = k * (Math.PI / 2);
      player.body.visible = true;
      if (deathAnim.t >= deathAnim.duration) {
        deathAnim.active = false;
        running = false;
        gameOver();
      }
    }

    updateScore();
  }

  // keep the sun following so shadows stay near the player
  sun.target.position.set(player.group.position.x, 0, player.group.position.z);
  sun.position.set(player.group.position.x - 8, 18, player.group.position.z + 8);

  updateCamera(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

// ---- Resize --------------------------------------------------------------

function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  const aspect = window.innerWidth / window.innerHeight;
  const viewSize = CAMERA.viewSize;
  camera.left = -viewSize * aspect;
  camera.right = viewSize * aspect;
  camera.top = viewSize;
  camera.bottom = -viewSize;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", onResize);

// ---- Boot ----------------------------------------------------------------

world.reset();
player.reset();
onResize();
updateCamera(0, true);
tick();
