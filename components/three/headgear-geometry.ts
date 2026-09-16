import {
  CatmullRomCurve3,
  ExtrudeGeometry,
  Shape,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from "three";

/*
 * Procedural geometry for a competition Arnis headgear.
 *
 * Units are inches, taken from the manufacturer's dimension sheet: 12" tall,
 * 9.5" wide across the crown, 10" deep. The flaps are shortened from the
 * sheet's 7" so they read as tucked against the neck when worn. The scene
 * scales the whole group to fit the portrait.
 *
 * Coordinate frame: +Y up, +Z out of the face, +X to the wearer's left.
 */

/** Half-extents of the padded shell ellipsoid. */
export const SHELL = { x: 4.9, y: 6.2, z: 5.4 } as const;

/** Angular extent of the face opening that the cage fills. */
const OPENING = {
  /** Half-width around the face, in radians either side of +Z. */
  halfPhi: 1.08,
  /** Top edge (brow), as a polar angle from the crown. */
  thetaTop: 0.34 * Math.PI,
  /** Bottom edge (chin). */
  thetaBottom: 0.8 * Math.PI,
} as const;

/** How far the cage bulges forward of the shell at the center of the face. */
const CAGE_BULGE = 1.35;

const FRONT = Math.PI / 2;

/**
 * A point on the cage surface. `u` runs across the face (-1 right edge, 1 left
 * edge) and `w` runs down it (-1 forehead, 1 chin). At |u| = 1 or |w| = 1 the
 * point lies exactly on the shell's opening edge, so bars meet the shell.
 */
function cagePoint(u: number, w: number) {
  const phi = FRONT + u * OPENING.halfPhi;
  const theta =
    OPENING.thetaTop + ((w + 1) / 2) * (OPENING.thetaBottom - OPENING.thetaTop);
  const bulge = CAGE_BULGE * (1 - u * u) * (1 - w * w);
  const rz = SHELL.z + bulge;
  const rx = SHELL.x + bulge * 0.35;

  return new Vector3(
    -rx * Math.cos(phi) * Math.sin(theta),
    SHELL.y * Math.cos(theta),
    rz * Math.sin(phi) * Math.sin(theta),
  );
}

function tubeThrough(points: Vector3[], radius: number, closed = false) {
  const curve = new CatmullRomCurve3(points, closed, "centripetal");
  return new TubeGeometry(curve, points.length * 6, radius, 10, closed);
}

function sample(count: number, fn: (t: number) => Vector3) {
  return Array.from({ length: count }, (_, i) => fn(-1 + (2 * i) / (count - 1)));
}

/** Full crown cap: covers the top of the head including above the face. */
export function createCrownGeometry() {
  return new SphereGeometry(1, 64, 24, 0, Math.PI * 2, 0, OPENING.thetaTop + 0.06);
}

/** Side and back shell, leaving the face open. */
export function createShellGeometry() {
  const phiStart = FRONT + OPENING.halfPhi;
  const phiLength = Math.PI * 2 - OPENING.halfPhi * 2;
  return new SphereGeometry(
    1,
    64,
    48,
    phiStart,
    phiLength,
    OPENING.thetaTop,
    OPENING.thetaBottom - OPENING.thetaTop,
  );
}

/** Vertical and horizontal cage bars, plus a heavier outer frame. */
export function createCageGeometries() {
  const bars: TubeGeometry[] = [];
  const columns = 7;
  const rows = 7;

  for (let i = 1; i < columns - 1; i++) {
    const u = -1 + (2 * i) / (columns - 1);
    bars.push(tubeThrough(sample(24, (w) => cagePoint(u, w)), 0.11));
  }

  for (let j = 1; j < rows - 1; j++) {
    const w = -1 + (2 * j) / (rows - 1);
    bars.push(tubeThrough(sample(24, (u) => cagePoint(u, w)), 0.11));
  }

  const frame = [
    ...sample(16, (w) => cagePoint(-1, w)),
    ...sample(16, (u) => cagePoint(u, 1)).slice(1),
    ...sample(16, (w) => cagePoint(1, -w)).slice(1),
    ...sample(16, (u) => cagePoint(-u, -1)).slice(1, -1),
  ];

  // The frame runs along the opening edge where the bulge is zero, so it lies
  // on the shell. Red face padding follows the same loop, pulled slightly in.
  const padding = frame.map((point) => point.clone().multiplyScalar(0.97));

  return {
    bars,
    frame: tubeThrough(frame, 0.2, true),
    padding: tubeThrough(padding, 0.45, true),
  };
}

/** Raised seams that give the shell its padded, stitched look. */
export function createSeamGeometries() {
  // Horizontal band around the sides and back, level with the brow.
  const band = sample(40, (t) => {
    const phi = FRONT + OPENING.halfPhi + ((t + 1) / 2) * (Math.PI * 2 - OPENING.halfPhi * 2);
    const theta = 0.42 * Math.PI;
    return new Vector3(
      -SHELL.x * 1.01 * Math.cos(phi) * Math.sin(theta),
      SHELL.y * Math.cos(theta),
      SHELL.z * 1.01 * Math.sin(phi) * Math.sin(theta),
    );
  });

  // Center seam from the forehead, over the crown, down the back. `angle` is
  // measured from the crown in the YZ plane: positive toward the face,
  // negative toward the back of the head.
  const crown = sample(32, (t) => {
    const angle = OPENING.thetaTop - ((t + 1) / 2) * (OPENING.thetaTop + 0.76 * Math.PI);
    return new Vector3(
      0,
      SHELL.y * 1.01 * Math.cos(angle),
      SHELL.z * 1.01 * Math.sin(angle),
    );
  });

  return [tubeThrough(band, 0.16), tubeThrough(crown, 0.16)];
}

function roundedFlapShape(topWidth: number, bottomWidth: number, height: number) {
  const shape = new Shape();
  const t = topWidth / 2;
  const b = bottomWidth / 2;
  shape.moveTo(-t, 0);
  shape.lineTo(t, 0);
  shape.lineTo(b, -height + b * 0.6);
  shape.quadraticCurveTo(b * 0.9, -height, 0, -height);
  shape.quadraticCurveTo(-b * 0.9, -height, -b, -height + b * 0.6);
  shape.closePath();
  return shape;
}

const FLAP_EXTRUDE = {
  depth: 0.5,
  bevelEnabled: true,
  bevelThickness: 0.2,
  bevelSize: 0.2,
  bevelSegments: 3,
  curveSegments: 16,
} as const;

/** Throat flap hanging below the chin, trimmed so it tucks against the neck. */
export function createThroatFlapGeometry() {
  return new ExtrudeGeometry(roundedFlapShape(6, 4.6, 5), FLAP_EXTRUDE);
}

/** Pointed side flaps either side of the throat flap. */
export function createSideFlapGeometry() {
  const shape = new Shape();
  shape.moveTo(-1.3, 0);
  shape.lineTo(1.3, 0);
  shape.lineTo(0.25, -4);
  shape.quadraticCurveTo(0, -4.3, -0.25, -4);
  shape.closePath();
  return new ExtrudeGeometry(shape, FLAP_EXTRUDE);
}

/** The chin edge of the cage, where the flaps attach. */
export const CHIN = cagePoint(0, 1);
