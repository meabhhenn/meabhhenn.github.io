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
const BAR_Y = SWING.chainLength + 1.6; // height of the top arched bar

// A single swing hanging from one fixed hanger slot on the bar.
// It arcs FORWARD/BACKWARD (toward/away from the player) by rotating the whole
// chain+seat+kid group around the X axis at the pivot. Nothing is scaled/skewed.
// Its left/right (x) position never changes — the hazard lives in a fixed x-slot.
class Swing {
  constructor(slotX, npcColor) {
    this.group = new THREE.Group();
    this.group.position.x = slotX; // fixed x-slot, never moves sideways
    this.slotX = slotX;

    // randomized pendulum behavior
    this.speed = randRange(SWING.minSpeed, SWING.maxSpeed);
    this.amplitude = randRange(SWING.minAmplitude, SWING.maxAmplitude);
    this.phase = Math.random() * Math.PI * 2;

    // Pivot sits at the hanger point on the bar. Rotating pivot.rotation.x
    // swings the arm in the Z (forward/back) plane.
    this.pivot = new THREE.Group();
    this.pivot.position.y = BAR_Y;
    this.group.add(this.pivot);

    const chainMat = new THREE.MeshLambertMaterial({ color: COLORS.chain });
    const chainGeo = new THREE.BoxGeometry(0.06, SWING.chainLength, 0.06);

    // two thin parallel chains (offset along z so they read as front/back of seat)
    const chainFront = new THREE.Mesh(chainGeo, chainMat);
    chainFront.position.set(0, -SWING.chainLength / 2, 0.22);
    const chainBack = new THREE.Mesh(chainGeo, chainMat);
    chainBack.position.set(0, -SWING.chainLength / 2, -0.22);
    this.pivot.add(chainFront, chainBack);

    // flat belt-style seat
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.1, 0.52),
      new THREE.MeshLambertMaterial({ color: 0x2f343b })
    );
    seat.position.y = -SWING.chainLength;
    seat.castShadow = true;
    this.pivot.add(seat);

    // The kid: sits upright as ONE rigid group. Vertical torso, head up,
    // legs extended forward (+z). No independent animation of parts.
    const kid = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color: npcColor });
    const skin = new THREE.MeshLambertMaterial({ color: 0xffe0bd });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x39414d });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.5, 0.4), bodyMat);
    torso.position.set(0, 0.42, 0);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), skin);
    head.position.set(0, 0.92, 0);

    const hair = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.14, 0.44),
      new THREE.MeshLambertMaterial({ color: pick([0x5a3a2a, 0x2b2b2b, 0x8a5a2a, 0xc9a24b]) })
    );
    hair.position.set(0, 1.14, 0);

    // legs extended forward (+z), roughly horizontal
    const legGeo = new THREE.BoxGeometry(0.15, 0.15, 0.5);
    const legL = new THREE.Mesh(legGeo, darkMat);
    legL.position.set(-0.12, 0.14, 0.32);
    const legR = legL.clone();
    legR.position.x = 0.12;

    kid.add(torso, head, hair, legL, legR);
    // seat top is at y = -chainLength + 0.05; place kid so it sits on it
    kid.position.y = -SWING.chainLength + 0.05;

    torso.castShadow = true;
    head.castShadow = true;
    this.pivot.add(kid);

    this.seat = seat;
    this.kid = kid;
    this.angle = 0;
  }

  update(time, difficulty) {
    // Pendulum angle. angle > 0 => swings TOWARD the player (+z).
    this.angle =
      Math.sin(time * this.speed * difficulty + this.phase) * this.amplitude;
    this.pivot.rotation.x = this.angle;
  }

  // Forward reach of the seat toward the player, in world units.
  // The seat's z-offset from the row center after rotating about X by `angle`
  // is -chainLength * sin(angle). Forward (toward the player) is +z, so a
  // positive reach means the seat has arced toward the player's side.
  forwardReach() {
    return -SWING.chainLength * Math.sin(this.angle);
  }

  // Dangerous only when it has swung forward far enough to intrude into the row.
  isDangerous() {
    return this.forwardReach() >= SWING.dangerReach;
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

  // Build one arched bar (bent tube) on two outward-planted A-frame leg pairs,
  // with 4-6 evenly spaced swings hung along it (with visible gaps).
  buildSwingSet() {
    const tint = this.index % 2 === 0 ? COLORS.swingRow[0] : COLORS.swingRow[1];
    this.ground.material.color.setHex(tint);

    const frameMat = new THREE.MeshLambertMaterial({ color: COLORS.frame });
    const frameDarkMat = new THREE.MeshLambertMaterial({ color: COLORS.frameDark });

    // Decide swing count and slot positions (centered, evenly spaced).
    const count = randInt(SWING.minSwings, SWING.maxSwings);
    const spacing = SWING.slotSpacing;
    const slotStart = -((count - 1) * spacing) / 2;
    const slots = [];
    for (let i = 0; i < count; i++) slots.push(slotStart + i * spacing);

    // Bar spans a bit beyond the outermost slots.
    const barHalf = Math.abs(slotStart) + spacing * 0.9;

    // --- One continuous arched top bar built from short segments (a bent tube) ---
    const barGroup = new THREE.Group();
    const segments = 18;
    const archRise = 0.7; // how much the bar arches up in the middle
    const tube = 0.16;
    let prev = null;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments; // 0..1 across the bar
      const x = -barHalf + t * (barHalf * 2);
      // arch profile: a gentle cosine hump, highest in the middle
      const y = BAR_Y + Math.sin(t * Math.PI) * archRise;
      const node = new THREE.Vector3(x, y, 0);
      if (prev) {
        const seg = new THREE.Mesh(
          new THREE.BoxGeometry(1, tube, tube),
          frameMat
        );
        const mid = prev.clone().add(node).multiplyScalar(0.5);
        seg.position.copy(mid);
        const len = prev.distanceTo(node);
        seg.scale.x = len; // BoxGeometry width 1 -> scale to segment length
        // rotate segment to align with the direction between nodes (in XY plane)
        const dir = node.clone().sub(prev);
        seg.rotation.z = Math.atan2(dir.y, dir.x);
        seg.castShadow = true;
        barGroup.add(seg);
      }
      prev = node;
    }
    this.group.add(barGroup);

    // --- Two A-frame leg PAIRS, one at each end, planted outward for stability ---
    const makeLegPair = (baseX) => {
      const pair = new THREE.Group();
      const topY = BAR_Y; // legs meet the bar near its ends
      const legLen = topY + 1.3;
      const legGeo = new THREE.BoxGeometry(0.2, legLen, 0.2);
      const outward = baseX < 0 ? -1 : 1;

      // front and back legs of the A-frame splay outward along x, and along z
      const makeLeg = (zSign) => {
        const leg = new THREE.Mesh(legGeo, frameDarkMat);
        leg.position.set(baseX + outward * 0.35, topY / 2, zSign * 0.6);
        // lean outward on x and splay on z so feet plant wide
        leg.rotation.z = outward * 0.22;
        leg.rotation.x = zSign * 0.28;
        leg.castShadow = true;
        return leg;
      };
      pair.add(makeLeg(1), makeLeg(-1));
      return pair;
    };
    this.group.add(makeLegPair(-barHalf), makeLegPair(barHalf));

    // --- Hang swings at each slot ---
    for (let i = 0; i < count; i++) {
      const swing = new Swing(slots[i], pick(COLORS.npc));
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
    for (let i = 0; i < 24; i++) this.addRow();
  }

  addRow() {
    const row = new Row(this.nextRowIndex++);
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

  // Collision: player is hit if standing in a swing's fixed x-slot while that
  // swing has arced forward into the row. Gaps between slots are always safe.
  checkCollision(playerRow, playerWorldX) {
    const row = this.getRow(playerRow);
    if (!row || !row.isSwingRow) return false;

    for (const s of row.swings) {
      const dx = Math.abs(s.slotX - playerWorldX);
      if (dx <= SWING.slotHalfWidth && s.isDangerous()) return true;
    }
    return false;
  }
}
