import * as THREE from 'three';

interface AsteroidParticle {
  orbitRadius: number;
  orbitSpeed: number;
  angle: number;
  inclination: number;
  rotationSpeed: number;
  rotationAxis: THREE.Vector3;
  scale: number;
}

interface BeltBatch {
  mesh: THREE.InstancedMesh;
  particles: AsteroidParticle[];
}

/** Small seeded PRNG so rock shapes are identical between reloads. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Lumpy rock: an icosphere with noisy radial displacement and per-axis stretching.
 */
function createRockGeometry(seed: number, detail: number, stretch: THREE.Vector3, roughness: number): THREE.BufferGeometry {
  const rand = mulberry32(seed);
  const geo = new THREE.IcosahedronGeometry(1, detail);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  // Displace shared positions consistently so the mesh stays watertight
  const displaced = new Map<string, number>();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const key = `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`;
    let d = displaced.get(key);
    if (d === undefined) {
      d = 1 + (rand() - 0.5) * roughness;
      displaced.set(key, d);
    }
    v.multiplyScalar(d);
    v.multiply(stretch);
    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geo.computeVertexNormals();
  return geo;
}

export class InstancedBelts {
  public group: THREE.Group;
  private asteroidBatches: BeltBatch[] = [];
  private kuiperBatches: BeltBatch[] = [];

  private dummy = new THREE.Object3D();
  private color = new THREE.Color();

  constructor() {
    this.group = new THREE.Group();
    this.initMainAsteroidBelt(9000);
    this.initKuiperBelt(3600);
  }

  /**
   * Main Asteroid Belt between Mars (~118) and Jupiter (~165)
   */
  private initMainAsteroidBelt(count: number) {
    const geometries = [
      createRockGeometry(11, 1, new THREE.Vector3(1.0, 0.8, 0.9), 0.55),
      createRockGeometry(23, 1, new THREE.Vector3(1.3, 0.7, 0.85), 0.6),
      createRockGeometry(37, 0, new THREE.Vector3(0.9, 1.0, 1.2), 0.5)
    ];
    const palette = ['#8a847d', '#6f6a64', '#9c9489', '#7a6f66', '#a39a8c'];

    this.asteroidBatches = this.buildBatches({
      geometries,
      count,
      palette,
      minRadius: 126,
      maxRadius: 154,
      inclinationRange: 0.15,
      baseSpeed: 0.02,
      speedSpread: 0.015,
      speedRef: 150,
      baseScale: 0.12,
      scaleSpread: 0.6,
      roughness: 0.92,
      metalness: 0.05
    });
  }

  /**
   * Kuiper Belt beyond Neptune (~310 to ~430)
   */
  private initKuiperBelt(count: number) {
    const geometries = [
      createRockGeometry(51, 1, new THREE.Vector3(1.0, 0.9, 1.0), 0.45),
      createRockGeometry(67, 0, new THREE.Vector3(1.2, 0.8, 0.9), 0.5)
    ];
    const palette = ['#9fb0bd', '#b9c6d0', '#8795a3', '#a9b7c2'];

    this.kuiperBatches = this.buildBatches({
      geometries,
      count,
      palette,
      minRadius: 330,
      maxRadius: 450,
      inclinationRange: 0.25,
      baseSpeed: 0.008,
      speedSpread: 0.006,
      speedRef: 350,
      baseScale: 0.14,
      scaleSpread: 0.75,
      roughness: 0.75,
      metalness: 0.15
    });
  }

  private buildBatches(opts: {
    geometries: THREE.BufferGeometry[];
    count: number;
    palette: string[];
    minRadius: number;
    maxRadius: number;
    inclinationRange: number;
    baseSpeed: number;
    speedSpread: number;
    speedRef: number;
    baseScale: number;
    scaleSpread: number;
    roughness: number;
    metalness: number;
  }): BeltBatch[] {
    const perBatch = Math.floor(opts.count / opts.geometries.length);
    const batches: BeltBatch[] = [];

    // Per-instance color comes from instanceColor, so the base material color stays white
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: opts.roughness,
      metalness: opts.metalness,
      flatShading: false
    });

    opts.geometries.forEach(geometry => {
      const mesh = new THREE.InstancedMesh(geometry, material, perBatch);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      const particles: AsteroidParticle[] = [];

      for (let i = 0; i < perBatch; i++) {
        const r = opts.minRadius + Math.random() * (opts.maxRadius - opts.minRadius);
        const p: AsteroidParticle = {
          orbitRadius: r,
          orbitSpeed: (opts.baseSpeed + Math.random() * opts.speedSpread) * (opts.speedRef / r),
          angle: Math.random() * Math.PI * 2,
          inclination: (Math.random() - 0.5) * opts.inclinationRange,
          rotationSpeed: (Math.random() - 0.5) * 2.0,
          rotationAxis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
          scale: opts.baseScale + Math.pow(Math.random(), 3) * opts.scaleSpread // mostly tiny, few big ones
        };
        particles.push(p);
        this.updateParticleTransform(mesh, i, p);

        // Tonal variation around a palette color
        this.color.set(opts.palette[Math.floor(Math.random() * opts.palette.length)]);
        this.color.offsetHSL(0, (Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.12);
        mesh.setColorAt(i, this.color);
      }

      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      this.group.add(mesh);
      batches.push({ mesh, particles });
    });

    return batches;
  }

  private updateParticleTransform(mesh: THREE.InstancedMesh, index: number, p: AsteroidParticle) {
    const x = Math.cos(p.angle) * p.orbitRadius;
    const z = Math.sin(p.angle) * p.orbitRadius;
    const y = Math.sin(p.angle) * p.orbitRadius * p.inclination;

    this.dummy.position.set(x, y, z);
    this.dummy.rotation.set(
      p.rotationAxis.x * p.angle * 10,
      p.rotationAxis.y * p.angle * 10,
      p.rotationAxis.z * p.angle * 10
    );
    this.dummy.scale.set(p.scale, p.scale, p.scale);
    this.dummy.updateMatrix();

    mesh.setMatrixAt(index, this.dummy.matrix);
  }

  /**
   * Advance orbital revolution of the belts
   */
  public update(deltaDays: number) {
    if (deltaDays === 0 || !this.group.visible) return;
    const speedFactor = 0.005 * deltaDays;

    const advance = (batches: BeltBatch[]) => {
      batches.forEach(({ mesh, particles }) => {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.angle += p.orbitSpeed * speedFactor;
          this.updateParticleTransform(mesh, i, p);
        }
        mesh.instanceMatrix.needsUpdate = true;
      });
    };

    advance(this.asteroidBatches);
    advance(this.kuiperBatches);
  }

  public setVisibility(visible: boolean) {
    this.group.visible = visible;
  }
}
