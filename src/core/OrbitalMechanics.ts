import * as THREE from 'three';

/**
 * Keplerian orbital mechanics: real planet positions for any date, Kepler equation solver,
 * and conversion from orbital elements to scene coordinates.
 *
 * Elements: JPL "Keplerian Elements for Approximate Positions of the Major Planets"
 * (valid 1800 AD - 2050 AD). Each value is [value at J2000, rate per Julian century].
 */

type Rate = [number, number];

interface PlanetElements {
  e: Rate; // eccentricity
  I: Rate; // inclination (deg)
  L: Rate; // mean longitude (deg)
  varpi: Rate; // longitude of perihelion (deg)
  Omega: Rate; // longitude of ascending node (deg)
}

const PLANET_ELEMENTS: Record<string, PlanetElements> = {
  mercury: { e: [0.20563593, 0.00001906], I: [7.00497902, -0.00594749], L: [252.2503235, 149472.67411175], varpi: [77.45779628, 0.16047689], Omega: [48.33076593, -0.12534081] },
  venus: { e: [0.00677672, -0.00004107], I: [3.39467605, -0.0007889], L: [181.9790995, 58517.81538729], varpi: [131.60246718, 0.00268329], Omega: [76.67984255, -0.27769418] },
  earth: { e: [0.01671123, -0.00004392], I: [-0.00001531, -0.01294668], L: [100.46457166, 35999.37244981], varpi: [102.93768193, 0.32327364], Omega: [0.0, 0.0] },
  mars: { e: [0.0933941, 0.00007882], I: [1.84969142, -0.00813131], L: [-4.55343205, 19140.30268499], varpi: [-23.94362959, 0.44441088], Omega: [49.55953891, -0.29257343] },
  jupiter: { e: [0.04838624, -0.00013253], I: [1.30439695, -0.00183714], L: [34.39644051, 3034.74612775], varpi: [14.72847983, 0.21252668], Omega: [100.47390909, 0.20469106] },
  saturn: { e: [0.05386179, -0.00050991], I: [2.48599187, 0.00193609], L: [49.95424423, 1222.49362201], varpi: [92.59887831, -0.41897216], Omega: [113.66242448, -0.28867794] },
  uranus: { e: [0.04725744, -0.00004397], I: [0.77263783, -0.00242939], L: [313.23810451, 428.48202785], varpi: [170.9542763, 0.40805281], Omega: [74.01692503, 0.04240589] },
  neptune: { e: [0.00859048, 0.00005105], I: [1.77004347, 0.00035372], L: [-55.12002969, 218.45945325], varpi: [44.96476227, -0.32241464], Omega: [131.78422574, -0.00508664] },
  pluto: { e: [0.2488273, 0.0000517], I: [17.14001206, 0.00004818], L: [238.92903833, 145.20780515], varpi: [224.06891629, -0.04062942], Omega: [110.30393684, -0.01183482] }
};

/** Orbital elements for one body, all angles in radians. */
export interface OrbitOrientation {
  e: number;
  inclination: number;
  node: number; // longitude of ascending node
  argPeri: number; // argument of perihelion
  meanAnomaly: number; // at the requested date
}

const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
const MS_PER_DAY = 86400000;

export function daysSinceJ2000(date: Date): number {
  return (date.getTime() - J2000_MS) / MS_PER_DAY;
}

function wrapRad(a: number): number {
  const twoPi = Math.PI * 2;
  a = a % twoPi;
  if (a > Math.PI) a -= twoPi;
  if (a < -Math.PI) a += twoPi;
  return a;
}

/** Deterministic pseudo random value in [0, 1) from a string key (stable between reloads). */
export function hashUnit(key: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  return ((h >>> 0) % 100000) / 100000;
}

export function hasRealElements(id: string): boolean {
  return id in PLANET_ELEMENTS;
}

/** Real orientation and phase of a major planet at the given date. */
export function getPlanetOrientation(id: string, date: Date): OrbitOrientation | null {
  const el = PLANET_ELEMENTS[id];
  if (!el) return null;

  const T = daysSinceJ2000(date) / 36525;
  const at = (r: Rate) => r[0] + r[1] * T;
  const deg = THREE.MathUtils.degToRad;

  const varpi = deg(at(el.varpi));
  const node = deg(at(el.Omega));
  const L = deg(at(el.L));

  return {
    e: at(el.e),
    inclination: deg(at(el.I)),
    node,
    argPeri: varpi - node,
    meanAnomaly: wrapRad(L - varpi)
  };
}

/**
 * Orientation for bodies without a published element set (dwarf planets, moons, comets):
 * uses the catalog eccentricity and inclination with a stable pseudo-random node, perihelion and phase.
 */
export function getSyntheticOrientation(
  id: string,
  eccentricity: number,
  inclinationDeg: number,
  periodDays: number,
  date: Date,
  randomizeAngles = true
): OrbitOrientation {
  const node = randomizeAngles ? hashUnit(id, 1) * Math.PI * 2 : 0;
  const argPeri = randomizeAngles ? hashUnit(id, 2) * Math.PI * 2 : 0;
  const M0 = hashUnit(id, 3) * Math.PI * 2;
  const n = periodDays !== 0 ? (Math.PI * 2) / periodDays : 0;

  return {
    e: eccentricity,
    inclination: THREE.MathUtils.degToRad(inclinationDeg),
    node,
    argPeri,
    meanAnomaly: wrapRad(M0 + n * daysSinceJ2000(date))
  };
}

/** Solve Kepler's equation M = E - e sin E (Newton-Raphson). */
export function solveKepler(M: number, e: number): number {
  let E = e < 0.8 ? M : Math.PI;
  for (let i = 0; i < 12; i++) {
    const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= d;
    if (Math.abs(d) < 1e-9) break;
  }
  return E;
}

export function trueAnomalyFromEccentric(E: number, e: number): number {
  return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
}

/**
 * Convert a point on an orbit (radius r, true anomaly nu) to scene coordinates.
 * Ecliptic frame (x, y, north z) is mapped to three.js (x, y = north, z = -y) so that
 * planets orbit counter-clockwise when viewed from above the north pole.
 */
export function orbitPoint(
  r: number,
  nu: number,
  o: Pick<OrbitOrientation, 'inclination' | 'node' | 'argPeri'>,
  out: THREE.Vector3
): THREE.Vector3 {
  const u = nu + o.argPeri;
  const cosU = Math.cos(u);
  const sinU = Math.sin(u);
  const cosO = Math.cos(o.node);
  const sinO = Math.sin(o.node);
  const cosI = Math.cos(o.inclination);
  const sinI = Math.sin(o.inclination);

  const x = r * (cosO * cosU - sinO * sinU * cosI);
  const y = r * (sinO * cosU + cosO * sinU * cosI);
  const z = r * (sinU * sinI);

  return out.set(x, z, -y);
}

/** Heliocentric distance for an ellipse with semi-major axis a. */
export function orbitRadius(a: number, e: number, nu: number): number {
  return (a * (1 - e * e)) / (1 + e * Math.cos(nu));
}
