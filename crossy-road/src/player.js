import * as THREE from "three";
import { TILE, HALF_LANES, HOP_DURATION, HOP_HEIGHT, COLORS } from "./config.js";
import { clamp, easeOutQuad } from "./utils.js";

// The player is a chunky little kid made of boxes. It lives on a grid:
//   lane  -> x position (left/right), range [-HALF_LANES, HALF_LANES]
//   row   -> z position (forward = -z so higher rows are "ahead")
// Movement is a discrete hop that animates between grid cells.
export class Player {
  constructor() {
    this.group = new THREE.Group();
    this.buildMesh();

    this.lane = 0;   // current grid column
    this.row = 0;    // current grid row (0 = start)
    this.maxRow = 0; // furthest row reached (for score)

    // Hop animation state
    this.hopping = false;
    this.hopT = 0;
    this.fromX = 0;
    this.fromZ = 0;
    this.toX = 0;
    this.toZ = 0;

    this.setGridPosition(0, 0);
    this.alive = true;
  }

  buildMesh() {
    const body = new THREE.Group();

    const mat = (color) =>
      new THREE.MeshLambertMaterial({ color });

    // torso
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.55, 0.5),
      mat(COLORS.player)
    );
    torso.position.y = 0.45;
    torso.castShadow = true;
    body.add(torso);

    // head
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      mat(0xffe0bd)
    );
    head.position.y = 0.98;
    head.castShadow = true;
    body.add(head);

    // hair cap
    const hair = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.18, 0.54),
      mat(0x5a3a2a)
    );
    hair.position.y = 1.24;
    body.add(hair);

    // little arms
    const armGeo = new THREE.BoxGeometry(0.16, 0.4, 0.16);
    const armL = new THREE.Mesh(armGeo, mat(COLORS.playerAccent));
    armL.position.set(-0.4, 0.48, 0);
    const armR = armL.clone();
    armR.position.x = 0.4;
    body.add(armL, armR);

    // legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.35, 0.2);
    const legL = new THREE.Mesh(legGeo, mat(0x3a5a8a));
    legL.position.set(-0.16, 0.12, 0);
    const legR = legL.clone();
    legR.position.x = 0.16;
    body.add(legL, legR);

    this.body = body;
    this.group.add(body);
  }

  laneToX(lane) {
    return lane * TILE;
  }

  rowToZ(row) {
    return -row * TILE;
  }

  setGridPosition(lane, row) {
    this.lane = lane;
    this.row = row;
    this.group.position.x = this.laneToX(lane);
    this.group.position.z = this.rowToZ(row);
    this.group.position.y = 0;
  }

  // Queue a hop by grid delta. dLane: -1 left / +1 right. dRow: +1 forward / -1 back.
  tryMove(dLane, dRow) {
    if (this.hopping || !this.alive) return;

    let targetLane = clamp(this.lane + dLane, -HALF_LANES, HALF_LANES);
    let targetRow = Math.max(0, this.row + dRow); // cannot go behind the start

    if (targetLane === this.lane && targetRow === this.row) return;

    this.fromX = this.laneToX(this.lane);
    this.fromZ = this.rowToZ(this.row);
    this.toX = this.laneToX(targetLane);
    this.toZ = this.rowToZ(targetRow);

    this.lane = targetLane;
    this.row = targetRow;
    this.maxRow = Math.max(this.maxRow, this.row);

    this.hopping = true;
    this.hopT = 0;

    // face the direction of travel
    if (dRow > 0) this.body.rotation.y = 0;
    else if (dRow < 0) this.body.rotation.y = Math.PI;
    else if (dLane < 0) this.body.rotation.y = -Math.PI / 2;
    else if (dLane > 0) this.body.rotation.y = Math.PI / 2;
  }

  update(dt) {
    if (!this.hopping) return;

    this.hopT += dt / HOP_DURATION;
    if (this.hopT >= 1) {
      this.hopT = 1;
      this.hopping = false;
    }

    const t = easeOutQuad(this.hopT);
    this.group.position.x = this.fromX + (this.toX - this.fromX) * t;
    this.group.position.z = this.fromZ + (this.toZ - this.fromZ) * t;
    // arc up and back down
    this.group.position.y = Math.sin(this.hopT * Math.PI) * HOP_HEIGHT;

    // squash & stretch for juice
    const s = 1 + Math.sin(this.hopT * Math.PI) * 0.12;
    this.body.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s));
  }

  reset() {
    this.hopping = false;
    this.hopT = 0;
    this.alive = true;
    this.maxRow = 0;
    this.body.rotation.y = 0;
    this.body.rotation.x = 0; // reset the death-knockdown topple
    this.body.scale.set(1, 1, 1);
    this.body.visible = true;
    this.setGridPosition(0, 0);
  }

  // For collision we only need the player's world x and current row.
  get worldX() {
    return this.group.position.x;
  }
}
