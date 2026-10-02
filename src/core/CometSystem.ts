import * as THREE from 'three';

export interface CometVisual {
  id: string;
  name: string;
  nucleusMesh: THREE.Mesh;
  comaMesh: THREE.Mesh;
  ionTailLine: THREE.Line;
  dustTailMesh: THREE.Mesh;
  orbitRadiusA: number; // Semi-major axis
  eccentricity: number;
  periodDays: number;
  angle: number;
  inclination: number;
}

export class CometSystem {
  public group: THREE.Group;
  private comets: CometVisual[] = [];

  constructor() {
    this.group = new THREE.Group();
    // Eccentricities keep perihelion (a * (1 - e)) well outside the Sun's radius (28)
    this.createComet('halley', 'Halley\'s Comet', 180, 0.78, 27500, 0.3);
    this.createComet('neowise', 'Comet NEOWISE', 260, 0.84, 45000, 0.6);
  }

  private createComet(
    id: string,
    name: string,
    a: number,
    e: number,
    periodDays: number,
    inclination: number
  ) {
    const cometGroup = new THREE.Group();

    // 1. Dark irregular nucleus
    const nucleusGeo = new THREE.DodecahedronGeometry(0.8, 1);
    const nucleusMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.95
    });
    const nucleusMesh = new THREE.Mesh(nucleusGeo, nucleusMat);
    nucleusMesh.userData = { bodyId: id };
    cometGroup.add(nucleusMesh);

    // 2. Glowing coma (fuzzy atmosphere)
    const comaGeo = new THREE.SphereGeometry(2.0, 16, 16);
    const comaMat = new THREE.MeshBasicMaterial({
      color: 0x88eeff,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    const comaMesh = new THREE.Mesh(comaGeo, comaMat);
    cometGroup.add(comaMesh);

    // 3. Ion Tail (electric blue, straight opposite Sun)
    const ionTailPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 35)];
    const ionTailGeo = new THREE.BufferGeometry().setFromPoints(ionTailPoints);
    const ionTailMat = new THREE.LineBasicMaterial({
      color: 0x33ccff,
      transparent: true,
      opacity: 0.8
    });
    const ionTailLine = new THREE.Line(ionTailGeo, ionTailMat);
    cometGroup.add(ionTailLine);

    // 4. Dust Tail (curved golden-white fan)
    const dustTailGeo = new THREE.ConeGeometry(5, 30, 16, 1, true);
    dustTailGeo.rotateX(Math.PI / 2);
    dustTailGeo.translate(0, 0, 15);
    const dustTailMat = new THREE.MeshBasicMaterial({
      color: 0xffeebb,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const dustTailMesh = new THREE.Mesh(dustTailGeo, dustTailMat);
    cometGroup.add(dustTailMesh);

    this.group.add(cometGroup);

    this.comets.push({
      id,
      name,
      nucleusMesh,
      comaMesh,
      ionTailLine,
      dustTailMesh,
      orbitRadiusA: a,
      eccentricity: e,
      periodDays,
      angle: Math.random() * Math.PI * 2,
      inclination
    });
  }

  public update(deltaDays: number) {
    for (const comet of this.comets) {
      // Advance angle (faster when closer to perihelion)
      const a = comet.orbitRadiusA;
      const e = comet.eccentricity;
      const r = a * (1 - e * e) / (1 + e * Math.cos(comet.angle));

      // Kepler's second law: r² dθ/dt = constant
      const meanMotion = (Math.PI * 2) / (comet.periodDays / 30);
      const speedFactor = Math.pow(a / Math.max(20, r), 1.5);
      comet.angle += meanMotion * speedFactor * deltaDays * 0.05;

      const x = Math.cos(comet.angle) * r;
      const z = Math.sin(comet.angle) * r;
      const y = Math.sin(comet.angle) * r * Math.sin(comet.inclination);

      const pos = new THREE.Vector3(x, y, z);
      const cometParent = comet.nucleusMesh.parent as THREE.Group;
      cometParent.position.copy(pos);

      // Tail always points directly AWAY from the Sun (origin 0,0,0)
      const sunDir = pos.clone().normalize();
      const tailDir = sunDir.clone(); // Away from sun

      // Align tail orientation
      const targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tailDir);
      comet.ionTailLine.quaternion.copy(targetQuat);
      comet.dustTailMesh.quaternion.copy(targetQuat);

      // Tail length & brightness grows as comet approaches Sun
      const proximity = Math.max(0, 1.0 - r / 300);
      comet.comaMesh.scale.setScalar(1.0 + proximity * 2.5);
      comet.dustTailMesh.scale.set(1.0 + proximity, 1.0 + proximity, 0.5 + proximity * 3.0);
      (comet.dustTailMesh.material as THREE.MeshBasicMaterial).opacity = 0.15 + proximity * 0.45;
      (comet.ionTailLine.material as THREE.LineBasicMaterial).opacity = 0.2 + proximity * 0.6;
    }
  }

  public setVisibility(visible: boolean) {
    this.group.visible = visible;
  }
}
