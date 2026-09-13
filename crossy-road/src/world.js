import * as THREE from "three";
import {
  TILE,
  LANES,
  HALF_LANES,
  SAFE_ROWS_AT_START,
  SWING,
  SWING_ROW_CHANCE,
  DIFFICULTY_PER_ROW,
  MAX_DIFFICULTY,
  COLORS,
} from "./config.js";
import { randRange, randInt, pick, clamp } from "./utils.js";

const ROW_WIDTH = (LANES + 4) * TILE; // ground strip is a bit wider than playable lanes

// A single swing: a chain + seat + kid that pivots from a top bar.
// It sweeps left<->right across its row; collision uses the seat's current X.
class Swing {
  constructor(laneX, npcColor) {
    this.group = new THREE.Group();
    this.group.position.x = laneX;

    // randomized behavior
    this.speed = randRange(SWING.minSpeed, SWING.maxSpeed);
    this.amplitude = randRange(SWING.minAmplitude, SWING.maxAmplitude);
    this.phase = Math.random() * Math.PI * 2;
    this.dir = Math.random() < 0.5 ? 1 : -1;

    // pivot lives at the top bar; the arm rotates around it
    this.pivot = new THREE.Group();
    this.pivot.position.y = SWING.chainLength + 1.4; // top bar height
    this.group.add(this.pivot);

    const chainMat = new THREE.MeshLambertMaterial({ color: COLORS.chain });
    const chain = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, SWING.chainLength, 0.08),
      chainMat
    );
    chain.position.y = -SWING.chainLength / 2;
    this.pivot.add(chain);

    // seat
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.12, 0.5),
      new THREE.MeshLambertMaterial({ color: 0x3a3f47 })
    );
    seat.position.y = -SWING.chainLength;
    this.pivot.add(seat);

    // the kid riding it (blocky, colored for variety)
    const kid = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color: npcColor });
    const skin = new THREE.MeshLambertMaterial({ color: 0xffe0bd });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.4), bodyMat);
    torso.position.y = 0.3;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), skin);
    head.position.y = 0.78;
    const legGeo = new THREE.BoxGeometry(0.16, 0.34, 0.16);
    const legL = new THREE.Mesh(legGeo, new THREE.MeshLambertMaterial({ color: 0x333 }));
    legL.position.set(-0.12, -0.05, 0.18);
    const legR = legL.clone();
    legR.position.x = 0.12;
    kid.add(torso, head, legL, legR);
    kid.position.y = -SWING.chainLength + 0.15;
    kid.castShadow = true;
    torso.castShadow = true;
    head.castShadow = true;
    this.pivot.add(kid);

    this.seat = seat;
    this.kid = kid;
  }

  update(time, difficulty) {
    // angle oscillates like a pendulum
    const angle =
      Math.sin(time * this.speed * difficulty + this.phase) *
      this.amplitude *
      this.dir;
    this.pivot.rotation.z = angle;

    // world-space X of the seat relative to its own lane center.
    // seat sits at radius = chainLength below pivot; its horizontal offset is
    // chainLength * sin(angle). Store it for collision.
    this.seatOffsetX = -SWING.chainLength * Math.sin(angle);
    // slight tilt on the kid for life
    this.kid.rotation.z = angle * 0.15;
  }

  // world X of the dangerous seat/kid
  worldSeatX() {
    return this.group.position.x + this.seatOffsetX;
  }
}

// A row is one grid step forward. It's either grass (safe) or a swing set (hazard).
export class Row {
  constructor(index) {
    this.index = index;
    this.group = new THREE.Group();
    this.group.position.z = -index * TILE;
    this.swings = [];
    this.isSwingRow = false;

    this.buildGround();

    // First few rows are always safe grass so the player can get bearings.
    if (index > SAFE_ROWS_AT_START && Math.random() < SWING_ROW_CHANCE) {
      this.buildSwingSet();
      this.isSwingRow = true;
    }
  }

  buildGround() {
    const isSwingTint = false;
    const shade = (this.index % 2 === 0)
      ? COLORS.grass[0]
      : COLORS.grass[1];
    const ground = new THREE.Mesh(
      new THREE.BoxGeometry(ROW_WIDTH, 0.4, TILE),
      new THREE.MeshLambertMaterial({ color: shade })
    );
    ground.position.y = -0.2;
    ground.receiveShadow = true;
    this.group.add(ground);
    this.ground = ground;
  }

  buildSwingSet() {
    // recolor ground slightly so swing rows read as "playground"
    const tint = (this.index % 2 === 0) ? COLORS.swingRow[0] : COLORS.swingRow[1];
    this.ground.material.color.setHex(tint);

    const frameMat = new THREE.MeshLambertMaterial({ color: COLORS.frame });
    const frameDarkMat = new THREE.MeshLambertMaterial({ color: COLORS.frameDark });

    const barY = SWING.chainLength + 1.4;
    const span = (LANES + 1) * TILE;

    // top horizontal bar
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(span, 0.22, 0.22),
      frameMat
    );
    bar.position.y = barY;
    bar.castShadow = true;
    this.group.add(bar);

    // A-frame legs on each end
    const legLen = barY + 0.6;
    const legGeo = new THREE.BoxGeometry(0.2, legLen, 0.2);
    const makeLeg = (x, z) => {
      const leg = new THREE.Mesh(legGeo, frameDarkMat);
      leg.position.set(x, barY / 2, z);
      leg.rotation.x = z > 0 ? -0.25 : 0.25;
      leg.castShadow = true;
      return leg;
    };
    const endX = span / 2;
    this.group.add(
      makeLeg(-endX, 0.5),
      makeLeg(-endX, -0.5),
      makeLeg(endX, 0.5),
      makeLeg(endX, -0.5)
    );

    // Place 1-3 swings across the playable lanes at distinct columns.
    const count = randInt(1, 3);
    const usedLanes = new Set();
    for (let i = 0; i < count; i++) {
      let lane;
      let attempts = 0;
      do {
        lane = randInt(-HALF_LANES + 1, HALF_LANES - 1);
        attempts++;
      } while (usedLanes.has(lane) && attempts < 10);
      usedLanes.add(lane);

      const swing = new Swing(lane * TILE, pick(COLORS.npc));
      this.swings.push(swing);
      this.group.add(swing.group);
    }
  }

  update(time, difficulty) {
    for (const s of this.swings) s.update(time, difficulty);
  }
}

// Manages a rolling window of rows so the world feels endless.
export class World {
  constructor(scene) {
    this.scene = scene;
    this.container = new THREE.Group();
    scene.add(this.container);
    this.rows = [];
    this.nextRowIndex = 0;
    this.time = 0;
  }

  reset() {
    for (const r of this.rows) this.container.remove(r.group);
    this.rows = [];
    this.nextRowIndex = 0;
    this.time = 0;
    // seed initial rows
    for (let i = 0; i < 24; i++) this.addRow();
  }

  addRow() {
    const row = new Row(this.nextRowIndex++);
    this.rows.push(row);
    this.container.add(row.group);
  }

  // Ensure rows exist ahead of the player and recycle old ones behind.
  ensureRows(playerRow) {
    while (this.nextRowIndex < playerRow + 18) this.addRow();

    // remove rows well behind the player to keep the scene light
    const cutoff = playerRow - 6;
    this.rows = this.rows.filter((r) => {
      if (r.index < cutoff) {
        this.container.remove(r.group);
        return false;
      }
      return true;
    });
  }

  getRow(index) {
    return this.rows.find((r) => r.index === index);
  }

  difficultyForRow(row) {
    return clamp(1 + row * DIFFICULTY_PER_ROW, 1, MAX_DIFFICULTY);
  }

  update(dt, playerRow) {
    this.time += dt;
    const difficulty = this.difficultyForRow(playerRow);
    for (const r of this.rows) {
      if (r.isSwingRow) r.update(this.time, difficulty);
    }
  }

  // Collision: is the player (at worldX, in row) overlapping any swing seat?
  checkCollision(playerRow, playerWorldX) {
    const row = this.getRow(playerRow);
    if (!row || !row.isSwingRow) return false;

    const hitRadius = SWING.seatHalfWidth + 0.35; // seat half-width + player half-width
    for (const s of row.swings) {
      const dx = Math.abs(s.worldSeatX() - playerWorldX);
      if (dx < hitRadius) return true;
    }
    return false;
  }
}
