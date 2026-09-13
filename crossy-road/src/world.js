import * as THREE from "three";
import {
  TILE,
  LANES,
  HALF_LANES,
  SAFE_ROWS_AT_START,
  BAR_LANES,
  SET_START_CHANCE,
  SET_MIN_LENGTH,
  SET_MAX_LENGTH,
  EMPTY_SWING_CHANCE,
  BUSH_ROW_CHANCE,
  SWING,
  PLAYER_HALF_WIDTH,
  DIFFICULTY_PER_ROW,
  MAX_DIFFICULTY,
  COLORS,
} from "./config.js";
import { randRange, pick, clamp } from "./utils.js";

const ROW_WIDTH = (LANES + 4) * TILE;   // ground strip is a bit wider than playable lanes
const BAR_Y = SWING.chainLength + 1.6;  // constant height of every bar / pivot

// One swing hanging from a fixed bar lane in a single row.
// It sweeps LEFT-RIGHT across its bar's lane by rotating the whole
// chain+seat+kid group around the Z axis. Nothing is scaled or skewed.
class Swing {
  constructor(npcColor, occupied = true, laneX) {
    this.occupied = occupied;
    this.laneX = laneX;
    this.group = new THREE.Group();
    this.group.position.x = laneX; // always this bar's fixed lane

    this.speed = randRange(SWING.minSpeed, SWING.maxSpeed);
    this.amplitude = randRange(SWING.minAmplitude, SWING.maxAmplitude);
    this.phase = Math.random() * Math.PI * 2;

    // Pivot sits on the bar. Rotating pivot.rotation.z sweeps left-right (in XY).
    this.pivot = new THREE.Group();
    this.pivot.position.y = BAR_Y;
    this.group.add(this.pivot);

    const chainMat = new THREE.MeshLambertMaterial({ color: COLORS.chain });
    const chainGeo = new THREE.BoxGeometry(0.06, SWING.chainLength, 0.06);
    // two thin parallel chains, offset along Z (the bar's own axis) so they sit
    // close together like real chains attaching to two nearby points on the bar.
    const chainL = new THREE.Mesh(chainGeo, chainMat);
    chainL.position.set(0, -SWING.chainLength / 2, -0.18);
    const chainR = new THREE.Mesh(chainGeo, chainMat);
    chainR.position.set(0, -SWING.chainLength / 2, 0.18);
    this.pivot.add(chainL, chainR);

    // flat belt-style seat. The sweep is left-right (along X, parallel to the
    // bar), so the seat's long/sit axis runs along X.
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.1, 0.42),
      new THREE.MeshLambertMaterial({ color: 0x2f343b })
    );
    seat.position.y = -SWING.chainLength;
    seat.castShadow = true;
    this.pivot.add(seat);

    // The kid: ONE rigid upright group, oriented ALONG the sweep (facing +X).
    // Vertical torso, head up, legs extended along +X (parallel to the bar).
    // An unoccupied swing has NO kid mesh at all (empty seat only).
    if (occupied) {
      const kid = new THREE.Group();
      const bodyMat = new THREE.MeshLambertMaterial({ color: npcColor });
      const skin = new THREE.MeshLambertMaterial({ color: 0xffe0bd });
      const darkMat = new THREE.MeshLambertMaterial({ color: 0x39414d });

      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.44), bodyMat);
      torso.position.set(0, 0.42, 0);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), skin);
      head.position.set(0, 0.92, 0);
      const hair = new THREE.Mesh(
        new THREE.BoxGeometry(0.44, 0.14, 0.44),
        new THREE.MeshLambertMaterial({
          color: pick([0x5a3a2a, 0x2b2b2b, 0x8a5a2a, 0xc9a24b]),
        })
      );
      hair.position.set(0, 1.14, 0);
      // legs extended forward along +X (the direction the kid faces / swings),
      // the two legs sitting side-by-side across the body along Z.
      const legGeo = new THREE.BoxGeometry(0.5, 0.15, 0.15);
      const legFront = new THREE.Mesh(legGeo, darkMat);
      legFront.position.set(0.3, 0.14, -0.11);
      const legBack = legFront.clone();
      legBack.position.z = 0.11;

      kid.add(torso, head, hair, legFront, legBack);
      kid.position.y = -SWING.chainLength + 0.05;
      torso.castShadow = true;
      head.castShadow = true;
      this.pivot.add(kid);
    }

    this.angle = 0;
  }

  update(time, difficulty) {
    // An empty swing never moves: leave angle pinned at 0 (hangs straight down).
    if (!this.occupied) return;
    // sweep left-right around Z
    this.angle =
      Math.sin(time * this.speed * difficulty + this.phase) * this.amplitude;
    this.pivot.rotation.z = this.angle;
  }

  // Live world X of the seat/kid. Seat local (0,-L,0) rotated about Z gives
  // x-offset = -L*sin(angle).
  worldSeatX() {
    return this.laneX + SWING.chainLength * Math.sin(this.angle);
  }
}

// A row is one grid step forward. Rows past the intro are corridor rows; each
// corridor row builds a segment of each active bar SET (a run of consecutive
// rows sharing one continuous bar on a lane), and each bar lane may or may not
// be mid-set on this row.
export class Row {
  constructor(index, laneRunState = {}) {
    this.index = index;
    this.group = new THREE.Group();
    this.group.position.z = -index * TILE;
    this.bars = [];
    this.isCorridor = false;
    this.bushLane = null;
    this.laneRunStateOut = {};

    this.buildGround();

    if (index > SAFE_ROWS_AT_START) {
      this.isCorridor = true;

      // Each bar lane independently continues an in-progress set, or rolls to
      // start a new one, or stays plain grass on this lane this row.
      for (const lane of BAR_LANES) {
        let state = laneRunState[lane] || { remaining: 0, total: 0 };

        if (state.remaining <= 0) {
          if (Math.random() < SET_START_CHANCE) {
            const length =
              SET_MIN_LENGTH +
              Math.floor(Math.random() * (SET_MAX_LENGTH - SET_MIN_LENGTH + 1));
            state = { remaining: length, total: length };
          } else {
            state = { remaining: 0, total: 0 };
          }
        }

        if (state.remaining > 0) {
          // This row is part of an active set: legs only at the very first
          // and very last row of the set — a real shared bar with end
          // supports, not one every N rows.
          const isFirst = state.remaining === state.total;
          const isLast = state.remaining === 1;
          this.buildBarSegment(lane, isFirst || isLast);

          const occupied = Math.random() >= EMPTY_SWING_CHANCE;
          const swing = new Swing(pick(COLORS.npc), occupied, lane * TILE);
          this.group.add(swing.group);
          this.bars.push(swing);

          state = { remaining: state.remaining - 1, total: state.total };
        }

        this.laneRunStateOut[lane] = state;
      }

      // Independently, a corridor row may get exactly one bush, kept out of
      // every bar lane so it never crowds a swing frame's leg footprint.
      if (Math.random() < BUSH_ROW_CHANCE) {
        const innerLanes = [];
        for (let l = -HALF_LANES; l <= HALF_LANES; l++) {
          if (!BAR_LANES.includes(l)) innerLanes.push(l);
        }
        this.bushLane = pick(innerLanes);
        this.buildBush(this.bushLane);
      }
    }
  }

  // A simple squat bush: clustered green boxes, distinct from the grass color,
  // sitting on the ground in the given lane.
  buildBush(lane) {
    const bush = new THREE.Group();
    const bushMat = new THREE.MeshLambertMaterial({ color: 0x2f7d3a });
    const blob = (w, h, d, x, y, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bushMat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      bush.add(m);
    };
    blob(0.7, 0.5, 0.7, 0, 0.25, 0);
    blob(0.4, 0.35, 0.4, 0.25, 0.5, 0.1);
    blob(0.4, 0.35, 0.4, -0.2, 0.48, -0.15);
    bush.position.set(lane * TILE, 0, 0);
    this.group.add(bush);
  }

  buildGround() {
    const shade = this.index % 2 === 0 ? COLORS.grass[0] : COLORS.grass[1];
    const ground = new THREE.Mesh(
      new THREE.BoxGeometry(ROW_WIDTH, 0.4, TILE),
      new THREE.MeshLambertMaterial({ color: shade })
    );
    ground.position.y = -0.2;
    ground.receiveShadow = true;
    this.group.add(ground);
    this.ground = ground;
  }

  // Build this row's slice of one continuous straight bar on the given lane,
  // plus an A-frame leg pair at the ends of a set. Each bar is one unbroken
  // straight line at constant lane (laneX) and constant height (BAR_Y) for the
  // length of its set.
  buildBarSegment(lane, needsLegs) {
    const laneX = lane * TILE;

    // faint tint on the bar's lane so the corridor reads as a path
    const tint = this.index % 2 === 0 ? COLORS.swingRow[0] : COLORS.swingRow[1];
    const laneStripe = new THREE.Mesh(
      new THREE.BoxGeometry(TILE * 1.1, 0.42, TILE),
      new THREE.MeshLambertMaterial({ color: tint })
    );
    laneStripe.position.set(laneX, -0.19, 0);
    laneStripe.receiveShadow = true;
    this.group.add(laneStripe);

    const frameMat = new THREE.MeshLambertMaterial({ color: COLORS.frame });
    const frameDarkMat = new THREE.MeshLambertMaterial({ color: COLORS.frameDark });

    // straight bar segment spanning exactly one row depth, laid end-to-end
    const barSeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.18, TILE + 0.02),
      frameMat
    );
    barSeg.position.set(laneX, BAR_Y, 0);
    barSeg.castShadow = true;
    this.group.add(barSeg);

    // A-frame leg pair at the ends of a set: two legs meeting near the top
    // (peaked-tent silhouette end-on), splayed only in X. Z splay kept tiny so
    // the frame never reaches into the neighboring rows. Only the first and
    // last row of a set get legs — a real shared bar with end supports.
    if (needsLegs) {
      const legLen = BAR_Y + 1.2;
      const legGeo = new THREE.BoxGeometry(0.16, legLen, 0.16);
      const zSplay = TILE * 0.2; // < 1/4 TILE, stays inside this row

      const makeLeg = (side) => {
        const leg = new THREE.Mesh(legGeo, frameDarkMat);
        // feet planted outward in X; tops converge near the bar
        leg.position.set(laneX + side * 0.7, legLen / 2 - 0.4, 0);
        leg.rotation.z = side * 0.32; // lean inward at the top -> peaked tent
        leg.castShadow = true;
        return leg;
      };
      const legLeft = makeLeg(-1);
      const legRight = makeLeg(1);

      // a small foot crossbar in z (within zSplay) for a stable stance read
      const foot = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.14, zSplay * 2),
        frameDarkMat
      );
      const footL = foot.clone();
      footL.position.set(laneX - 0.9, 0.0, 0);
      const footR = foot.clone();
      footR.position.set(laneX + 0.9, 0.0, 0);

      this.group.add(legLeft, legRight, footL, footR);
    }
  }

  update(time, difficulty) {
    for (const bar of this.bars) bar.update(time, difficulty);
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
    this.laneRunState = {};
    BAR_LANES.forEach((l) => (this.laneRunState[l] = { remaining: 0, total: 0 }));
  }

  reset() {
    for (const r of this.rows) this.container.remove(r.group);
    this.rows = [];
    this.nextRowIndex = 0;
    this.time = 0;
    this.laneRunState = {};
    BAR_LANES.forEach((l) => (this.laneRunState[l] = { remaining: 0, total: 0 }));
    for (let i = 0; i < 24; i++) this.addRow();
  }

  addRow() {
    const row = new Row(this.nextRowIndex++, this.laneRunState);
    BAR_LANES.forEach((l) => {
      this.laneRunState[l] = row.laneRunStateOut[l];
    });
    this.rows.push(row);
    this.container.add(row.group);
  }

  ensureRows(playerRow) {
    while (this.nextRowIndex < playerRow + 18) this.addRow();
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

  // A cell is blocked (non-lethal) if a bush occupies that lane in that row.
  isBlocked(row, lane) {
    const r = this.getRow(row);
    return !!r && r.bushLane === lane;
  }

  difficultyForRow(row) {
    return clamp(1 + row * DIFFICULTY_PER_ROW, 1, MAX_DIFFICULTY);
  }

  update(dt, playerRow) {
    this.time += dt;
    const difficulty = this.difficultyForRow(playerRow);
    for (const r of this.rows) {
      if (r.bars.length) r.update(this.time, difficulty);
    }
  }

  // Collision: the player is hit if they overlap any bar's swing's live sweep
  // X in this row (only possible on a bar's fixed lane, on a row that has a
  // swing there). Every other lane is always safe.
  checkCollision(playerRow, playerWorldX) {
    const row = this.getRow(playerRow);
    if (!row) return false;

    for (const bar of row.bars) {
      const halfWidth = bar.occupied ? SWING.occupiedHalfWidth : SWING.emptyHalfWidth;
      const hitRadius = halfWidth + PLAYER_HALF_WIDTH;
      if (Math.abs(bar.worldSeatX() - playerWorldX) < hitRadius) return true;
    }
    return false;
  }
}
