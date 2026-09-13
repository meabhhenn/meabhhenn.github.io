import * as THREE from "three";
import {
  TILE,
  LANES,
  HALF_LANES,
  SAFE_ROWS_AT_START,
  BAR_LANE,
  BAR_ROW_CHANCE,
  EMPTY_SWING_CHANCE,
  BUSH_ROW_CHANCE,
  SWING,
  SOCCER,
  SOCCER_ROW_CHANCE,
  DIFFICULTY_PER_ROW,
  MAX_DIFFICULTY,
  COLORS,
} from "./config.js";
import { randRange, pick, clamp } from "./utils.js";

const ROW_WIDTH = (LANES + 4) * TILE;   // ground strip is a bit wider than playable lanes
const BAR_X = BAR_LANE * TILE;          // fixed lane of the one continuous bar
const BAR_Y = SWING.chainLength + 1.6;  // constant height of the bar / pivot
const LEG_EVERY = 3;                    // an A-frame leg pair every N corridor rows

// One swing hanging from the fixed bar in a single row.
// It sweeps LEFT-RIGHT across the bar's lane by rotating the whole
// chain+seat+kid group around the Z axis. Nothing is scaled or skewed.
class Swing {
  constructor(npcColor, occupied = true) {
    this.occupied = occupied;
    this.group = new THREE.Group();
    this.group.position.x = BAR_X; // always the bar's fixed lane

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
    return BAR_X + SWING.chainLength * Math.sin(this.angle);
  }
}

// Two kids standing on the ground kicking a ball back and forth between them.
// Lives entirely in the outer lanes, independent of the bar/swing.
class SoccerPair {
  constructor(laneA, laneB) {
    this.group = new THREE.Group();
    this.xA = laneA * TILE;
    this.xB = laneB * TILE;

    this.speed = randRange(SOCCER.minSpeed, SOCCER.maxSpeed);
    this.phase = Math.random() * Math.PI * 2;

    const buildKid = (x, npcColor) => {
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
      // standing legs, planted straight down (no chain/seat, stands on ground)
      const legGeo = new THREE.BoxGeometry(0.15, 0.34, 0.15);
      const legL = new THREE.Mesh(legGeo, darkMat);
      legL.position.set(-0.11, 0.15, 0);
      const legR = legL.clone();
      legR.position.x = 0.11;

      kid.add(torso, head, hair, legL, legR);
      kid.position.set(x, 0, 0);
      torso.castShadow = true;
      head.castShadow = true;
      return kid;
    };

    this.kidA = buildKid(this.xA, pick(COLORS.npc));
    this.kidB = buildKid(this.xB, pick(COLORS.npc));

    this.ball = new THREE.Mesh(
      new THREE.SphereGeometry(SOCCER.ballRadius, 12, 12),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    this.ball.castShadow = true;

    this.group.add(this.kidA, this.kidB, this.ball);

    this.ballX = this.xA;
  }

  update(time, difficulty) {
    const tNorm = (Math.sin(time * this.speed * difficulty + this.phase) + 1) / 2;
    this.ballX = this.xA + (this.xB - this.xA) * tNorm;
    const bounceY =
      Math.abs(Math.sin(time * this.speed * difficulty * 2 + this.phase)) *
      SOCCER.kickHeight;
    this.ball.position.set(this.ballX, SOCCER.ballRadius + bounceY, 0);
  }

  worldBallX() {
    return this.ballX;
  }
}

// A row is one grid step forward. Rows past the intro are corridor rows; each
// corridor row builds a segment of the one continuous bar (and legs at
// intervals), and may or may not carry a swing.
export class Row {
  constructor(index, incomingRunLength = 0) {
    this.index = index;
    this.group = new THREE.Group();
    this.group.position.z = -index * TILE;
    this.swing = null;
    this.hasSwing = false;
    this.isCorridor = false;
    this.bushLane = null;
    this.soccerLeft = null;
    this.soccerRight = null;

    this.buildGround();

    if (index > SAFE_ROWS_AT_START) {
      this.isCorridor = true;

      // A corridor row either has NO bar (plain grass) or a bar WITH a swing.
      // The bar itself is what gets rolled; a bar never hangs empty.
      if (Math.random() < BAR_ROW_CHANCE) {
        const runPosition = incomingRunLength + 1;
        this.buildBarSegment(runPosition);
        const occupied = Math.random() >= EMPTY_SWING_CHANCE;
        this.swing = new Swing(pick(COLORS.npc), occupied);
        this.group.add(this.swing.group);
        this.hasSwing = true;
      }

      // Independently, a corridor row may get exactly one bush, kept in its
      // own lane (-2 or 2) so it never crowds the swing frame's leg footprint.
      // Lanes -1 and 1 stay permanently open as an obstacle-free route.
      if (Math.random() < BUSH_ROW_CHANCE) {
        const innerLanes = [-HALF_LANES + 2, HALF_LANES - 2];
        this.bushLane = pick(innerLanes);
        this.buildBush(this.bushLane);
      }

      // Independently, the outer lanes on either side may have a soccer pair
      // kicking a ball back and forth between them.
      if (Math.random() < SOCCER_ROW_CHANCE) {
        this.soccerLeft = new SoccerPair(-HALF_LANES, -HALF_LANES + 1);
        this.group.add(this.soccerLeft.group);
      }
      if (Math.random() < SOCCER_ROW_CHANCE) {
        this.soccerRight = new SoccerPair(HALF_LANES - 1, HALF_LANES);
        this.group.add(this.soccerRight.group);
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

  // Build this row's slice of the single continuous straight bar, plus an
  // A-frame leg pair at intervals. The bar is one unbroken straight line at
  // constant lane (BAR_X) and constant height (BAR_Y) down the whole corridor.
  buildBarSegment(runPosition) {
    // faint tint on the bar's lane so the corridor reads as a path
    const tint = this.index % 2 === 0 ? COLORS.swingRow[0] : COLORS.swingRow[1];
    const laneStripe = new THREE.Mesh(
      new THREE.BoxGeometry(TILE * 1.1, 0.42, TILE),
      new THREE.MeshLambertMaterial({ color: tint })
    );
    laneStripe.position.set(BAR_X, -0.19, 0);
    laneStripe.receiveShadow = true;
    this.group.add(laneStripe);

    const frameMat = new THREE.MeshLambertMaterial({ color: COLORS.frame });
    const frameDarkMat = new THREE.MeshLambertMaterial({ color: COLORS.frameDark });

    // straight bar segment spanning exactly one row depth, laid end-to-end
    const barSeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.18, TILE + 0.02),
      frameMat
    );
    barSeg.position.set(BAR_X, BAR_Y, 0);
    barSeg.castShadow = true;
    this.group.add(barSeg);

    // A-frame leg pair at intervals: two legs meeting near the top (peaked-tent
    // silhouette end-on), splayed only in X. Z splay kept tiny so the frame
    // never reaches into the neighboring rows. The FIRST row of every bar run
    // always gets legs, guaranteeing the bar is never left floating unsupported.
    if (runPosition === 1 || runPosition % LEG_EVERY === 0) {
      const legLen = BAR_Y + 1.2;
      const legGeo = new THREE.BoxGeometry(0.16, legLen, 0.16);
      const zSplay = TILE * 0.2; // < 1/4 TILE, stays inside this row

      const makeLeg = (side) => {
        const leg = new THREE.Mesh(legGeo, frameDarkMat);
        // feet planted outward in X; tops converge near the bar
        leg.position.set(BAR_X + side * 0.7, legLen / 2 - 0.4, 0);
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
      footL.position.set(BAR_X - 0.9, 0.0, 0);
      const footR = foot.clone();
      footR.position.set(BAR_X + 0.9, 0.0, 0);

      this.group.add(legLeft, legRight, footL, footR);
    }
  }

  update(time, difficulty) {
    if (this.swing) this.swing.update(time, difficulty);
    if (this.soccerLeft) this.soccerLeft.update(time, difficulty);
    if (this.soccerRight) this.soccerRight.update(time, difficulty);
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
    this.barRunLength = 0;
  }

  reset() {
    for (const r of this.rows) this.container.remove(r.group);
    this.rows = [];
    this.nextRowIndex = 0;
    this.time = 0;
    this.barRunLength = 0;
    for (let i = 0; i < 24; i++) this.addRow();
  }

  addRow() {
    const row = new Row(this.nextRowIndex++, this.barRunLength);
    this.barRunLength = row.hasSwing ? this.barRunLength + 1 : 0;
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
      if (r.hasSwing || r.soccerLeft || r.soccerRight) {
        r.update(this.time, difficulty);
      }
    }
  }

  // Collision: the player is hit if they overlap a swing's live sweep X (only
  // possible in the bar's lane, on a row that has a swing), OR they overlap a
  // soccer pair's ball on either side of the corridor.
  checkCollision(playerRow, playerWorldX) {
    const row = this.getRow(playerRow);
    if (!row) return false;

    if (row.hasSwing) {
      const hitRadius = SWING.seatHalfWidth + 0.2; // seat half-width + player half-width (minus forgiveness)
      const dx = Math.abs(row.swing.worldSeatX() - playerWorldX);
      if (dx < hitRadius) return true;
    }

    if (
      row.soccerLeft &&
      Math.abs(row.soccerLeft.worldBallX() - playerWorldX) < SOCCER.hitRadius
    ) {
      return true;
    }

    if (
      row.soccerRight &&
      Math.abs(row.soccerRight.worldBallX() - playerWorldX) < SOCCER.hitRadius
    ) {
      return true;
    }

    return false;
  }
}
