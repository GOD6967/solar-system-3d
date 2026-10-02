import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { CelestialBodyData, MoonInfo } from '../data/celestialBodies.ts';
import { TextureLoaderService } from './TextureLoaderService.ts';
import {
  createPlanetaryAtmosphereMaterial,
  createSunAtmosphereMaterial,
  createSunSurfaceMaterial,
  createSunGlowTexture,
  createRingMaterial,
  createRingShadowUniforms,
  applyRingShadow,
  applyEarthShading,
  applyBandWobble,
  RingShadowUniforms,
  EarthUniforms
} from './Shaders.ts';
import {
  OrbitOrientation,
  getPlanetOrientation,
  getSyntheticOrientation,
  hasRealElements,
  solveKepler,
  trueAnomalyFromEccentric,
  orbitRadius,
  orbitPoint
} from './OrbitalMechanics.ts';
import { SunLightState, AU_TRUE_SCALE_UNITS } from './constants.ts';

const GAS_GIANTS = new Set(['jupiter', 'saturn', 'uranus', 'neptune']);

const ORBIT_COLOR_PLANET = 0x3f5878;
const ORBIT_COLOR_MOON = 0x5b7fa8;
const ORBIT_COLOR_HIGHLIGHT = 0x7dd9f5;

const _tmpVec = new THREE.Vector3();
const _tmpVec2 = new THREE.Vector3();
const _tmpMat = new THREE.Matrix4();

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export class CelestialBodyMesh {
  /** All fat-line orbit materials, so the app can keep their pixel resolution in sync. */
  private static orbitMaterials = new Set<LineMaterial>();
  private static viewportWidth = window.innerWidth;
  private static viewportHeight = window.innerHeight;

  public static setViewportSize(width: number, height: number) {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.orbitMaterials.forEach(m => m.resolution.set(width, height));
  }

  public data: CelestialBodyData;
  public isMoon: boolean = false;
  public parentMesh?: CelestialBodyMesh;
  public moons: CelestialBodyMesh[] = [];

  // Hierarchy nodes
  public orbitGroup: THREE.Group; // Rotates around parent
  public positionGroup: THREE.Group; // Offset by orbit radius
  public tiltGroup: THREE.Group; // Axial tilt
  public bodyMesh: THREE.Mesh; // Spinning body
  public cloudMesh?: THREE.Mesh; // Independent rotating cloud layer
  public atmosphereMesh?: THREE.Mesh; // Glowing Fresnel rim
  public ringMesh?: THREE.Mesh; // Planetary rings
  public orbitLine?: Line2; // Orbit path visualizer
  public labelSprite?: THREE.Sprite; // Screen-space name label
  private glowSprite?: THREE.Sprite; // Sun billboard corona

  // Scale tracking
  public currentOrbitRadius: number;
  public currentRadius: number;

  // Orbit state
  private orientation: OrbitOrientation;
  private meanAnomaly: number;

  // Shader state
  private sunSurfaceMaterial?: THREE.ShaderMaterial;
  private ringShadowUniforms?: RingShadowUniforms;
  private bandTime = { value: 0 };
  private hasBandAnimation = false;

  // Visibility state
  private orbitUserVisible = true;
  private orbitHighlighted = false;
  private orbitBaseOpacity: number;

  constructor(data: CelestialBodyData, isMoon = false, parentMesh?: CelestialBodyMesh) {
    this.data = data;
    this.isMoon = isMoon;
    this.parentMesh = parentMesh;
    this.orbitBaseOpacity = isMoon ? 0.42 : 0.38;

    // Hierarchy groups
    this.orbitGroup = new THREE.Group();
    this.positionGroup = new THREE.Group();
    this.tiltGroup = new THREE.Group();

    this.orbitGroup.add(this.positionGroup);
    this.positionGroup.add(this.tiltGroup);

    // Initial scale parameters (Explorer Mode by default)
    this.currentOrbitRadius = this.getExplorerOrbitRadius();
    this.currentRadius = this.getExplorerRadius();

    // Orbit orientation and phase for the current date
    this.orientation = this.computeOrientation(new Date());
    this.meanAnomaly = this.orientation.meanAnomaly;
    this.updatePosition();

    // Axial tilt
    this.tiltGroup.rotation.z = THREE.MathUtils.degToRad(data.axialTiltDeg || 0);

    // Main body
    const geometry = new THREE.SphereGeometry(this.currentRadius, 96, 96);
    const material = this.createBodyMaterial();
    this.bodyMesh = new THREE.Mesh(geometry, material);
    this.bodyMesh.userData = { bodyId: data.id, bodyData: data };
    if (this.pendingBeforeRender) {
      this.bodyMesh.onBeforeRender = this.pendingBeforeRender;
    }
    this.tiltGroup.add(this.bodyMesh);

    // Sun glow, or planetary atmosphere
    if (data.type === 'star') {
      const sunAtmoGeo = new THREE.SphereGeometry(this.currentRadius * 1.25, 64, 64);
      this.atmosphereMesh = new THREE.Mesh(sunAtmoGeo, createSunAtmosphereMaterial());
      this.tiltGroup.add(this.atmosphereMesh);

      const glowMat = new THREE.SpriteMaterial({
        map: createSunGlowTexture(),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        opacity: 0.9
      });
      this.glowSprite = new THREE.Sprite(glowMat);
      this.glowSprite.scale.setScalar(this.currentRadius * 8.5);
      this.tiltGroup.add(this.glowSprite);
    } else if (data.hasAtmosphere) {
      const atmoScale = data.atmosphereScale || 1.05;
      const atmoGeo = new THREE.SphereGeometry(this.currentRadius * atmoScale, 64, 64);
      const atmoMat = createPlanetaryAtmosphereMaterial(data.atmosphereColor || 0x4ca3ff, 1.25, atmoScale);
      this.atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
      this.tiltGroup.add(this.atmosphereMesh);
    }

    // Clouds for Earth
    if (data.hasClouds && data.id === 'earth') {
      const maps = TextureLoaderService.getEarthMaps();
      const cloudGeo = new THREE.SphereGeometry(this.currentRadius * 1.012, 72, 72);
      const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        alphaMap: maps.clouds,
        transparent: true,
        opacity: 0.92,
        roughness: 1.0,
        metalness: 0,
        depthWrite: false
      });
      this.cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      this.tiltGroup.add(this.cloudMesh);
    }

    // Rings (Saturn, Uranus, Neptune, Haumea)
    if (data.hasRings) {
      this.createRings();
    }

    // Orbit line
    if (this.currentOrbitRadius > 0) {
      this.createOrbitLine();
    }

    // Name label
    this.createLabel();

    // Major moons
    if (data.majorMoons && data.majorMoons.length > 0 && !isMoon) {
      this.createMajorMoons(data.majorMoons);
    }
  }

  // -------------------------------------------------------------------------
  // Materials
  // -------------------------------------------------------------------------

  private createBodyMaterial(): THREE.Material {
    const id = this.data.id;

    if (this.data.type === 'star') {
      this.sunSurfaceMaterial = createSunSurfaceMaterial();
      return this.sunSurfaceMaterial;
    }

    if (id === 'earth') {
      const maps = TextureLoaderService.getEarthMaps();
      const mat = new THREE.MeshStandardMaterial({
        map: maps.day,
        normalMap: maps.normal,
        normalScale: new THREE.Vector2(0.9, 0.9),
        roughness: 0.8,
        metalness: 0.0
      });

      const earthUniforms: EarthUniforms = {
        uSpecMap: { value: maps.specular },
        uNightMap: { value: maps.night },
        uSunViewPos: { value: new THREE.Vector3() }
      };
      applyEarthShading(mat, earthUniforms);

      // Sun sits at the world origin; express it in view space for the shader
      this.pendingBeforeRender = (_r, _s, camera) => {
        earthUniforms.uSunViewPos.value.set(0, 0, 0).applyMatrix4(camera.matrixWorldInverse);
      };
      return mat;
    }

    const map = TextureLoaderService.getBodyTexture(id);
    const hasRealMap = TextureLoaderService.hasRealMap(id);
    const isGas = GAS_GIANTS.has(id);
    const isCloudy = id === 'venus' || id === 'titan';

    const mat = new THREE.MeshStandardMaterial({
      map,
      roughness: isGas || isCloudy ? 0.95 : 0.92,
      metalness: 0.0
    });

    // Surface relief from the color map (craters, ridges) on solid bodies
    if (!isGas && !isCloudy) {
      mat.bumpMap = map;
      mat.bumpScale = hasRealMap ? 1.4 : 1.0;
    }

    if (isGas) {
      applyBandWobble(mat, this.bandTime);
      this.hasBandAnimation = true;
    }

    if (id === 'saturn') {
      this.ringShadowUniforms = createRingShadowUniforms(TextureLoaderService.getSaturnRings());
      applyRingShadow(mat, this.ringShadowUniforms);
    }

    return mat;
  }

  // onBeforeRender hook created with the material, assigned to the mesh once it exists
  private pendingBeforeRender?: THREE.Mesh['onBeforeRender'];

  // -------------------------------------------------------------------------
  // Scale + orbit helpers
  // -------------------------------------------------------------------------

  private getExplorerRadius(): number {
    return this.data.explorerRadius || 5.0;
  }

  private getExplorerOrbitRadius(): number {
    return this.data.explorerOrbitRadius || 0;
  }

  private computeOrientation(date: Date): OrbitOrientation {
    const d = this.data;
    if (!this.isMoon && hasRealElements(d.id)) {
      return getPlanetOrientation(d.id, date)!;
    }
    return getSyntheticOrientation(
      d.id,
      d.eccentricity || 0,
      d.orbitalInclinationDeg || 0,
      d.orbitalPeriodDays,
      date,
      true
    );
  }

  /** Place the body on its orbit from the current mean anomaly (Kepler's equation). */
  private updatePosition() {
    const a = this.currentOrbitRadius;
    if (a <= 0) {
      this.positionGroup.position.set(0, 0, 0);
      return;
    }
    const e = this.orientation.e;
    const E = solveKepler(this.meanAnomaly, e);
    const nu = trueAnomalyFromEccentric(E, e);
    const r = orbitRadius(a, e, nu);
    orbitPoint(r, nu, this.orientation, _tmpVec);
    this.positionGroup.position.copy(_tmpVec);
  }

  /** Jump orbital phase (and the real orbit orientation for planets) to a calendar date. */
  public syncToDate(date: Date) {
    this.orientation = this.computeOrientation(date);
    this.meanAnomaly = this.orientation.meanAnomaly;
    this.updatePosition();

    if (this.orbitLine) {
      this.rebuildOrbitLine();
    }
    this.moons.forEach(m => m.syncToDate(date));
  }

  // -------------------------------------------------------------------------
  // Rings
  // -------------------------------------------------------------------------

  private createRings() {
    const ratio = this.currentRadius / this.getExplorerRadius();
    const inner = (this.data.ringInnerRadius || 1.3) * ratio;
    const outer = (this.data.ringOuterRadius || 2.4) * ratio;

    const ringGeo = new THREE.RingGeometry(inner, outer, 160, 1);

    // RingGeometry UVs are planar. Remap so U runs along the radius (inner -> outer).
    const pos = ringGeo.attributes.position;
    const uv = ringGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const r = Math.hypot(pos.getX(i), pos.getY(i));
      uv.setXY(i, (r - inner) / (outer - inner), 0.5);
    }
    uv.needsUpdate = true;

    // Align ring to equator (XY -> XZ)
    ringGeo.rotateX(-Math.PI / 2);

    const isSaturn = this.data.id === 'saturn';
    const ringTex = TextureLoaderService.getSaturnRings();
    const ringMat = isSaturn
      ? createRingMaterial(ringTex, 0xffffff, 1.0)
      : createRingMaterial(ringTex, this.data.ringColor || '#a8bcc6', 0.32);

    this.ringMesh = new THREE.Mesh(ringGeo, ringMat);
    this.ringMesh.renderOrder = 2;
    this.tiltGroup.add(this.ringMesh);

    if (this.ringShadowUniforms) {
      this.ringShadowUniforms.uRingInner.value = inner;
      this.ringShadowUniforms.uRingOuter.value = outer;
    }
  }

  private updateRingUniforms() {
    if (!this.ringMesh) return;

    this.tiltGroup.updateWorldMatrix(true, false);
    _tmpMat.copy(this.tiltGroup.matrixWorld);
    const center = _tmpVec.setFromMatrixPosition(_tmpMat);
    const scale = this.tiltGroup.scale.x;
    const planetRadius = this.getExplorerRadius() * scale;

    const ringMat = this.ringMesh.material as THREE.ShaderMaterial;
    ringMat.uniforms.uPlanetPos.value.copy(center);
    ringMat.uniforms.uPlanetRadius.value = planetRadius;

    // Brightness follows the 1/d falloff of the sun light
    const irradiance = SunLightState.intensity / Math.max(1, center.length());
    ringMat.uniforms.uLight.value = THREE.MathUtils.clamp((irradiance / Math.PI) * 0.95, 0.12, 1.2);

    if (this.ringShadowUniforms) {
      const u = this.ringShadowUniforms;
      u.uRingCenter.value.copy(center);
      u.uRingNormal.value.set(0, 1, 0).transformDirection(this.tiltGroup.matrixWorld);
      // Ring geometry is built at explorer scale; tiltGroup scale carries it to the current mode
      u.uRingInner.value = (this.data.ringInnerRadius || 1.3) * scale;
      u.uRingOuter.value = (this.data.ringOuterRadius || 2.4) * scale;
    }
  }

  // -------------------------------------------------------------------------
  // Orbit line (fat lines so width stays constant in pixels at any zoom)
  // -------------------------------------------------------------------------

  private createOrbitLine() {
    const segments = 256;
    const a = this.currentOrbitRadius;
    const e = this.orientation.e;
    const positions: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const nu = (i / segments) * Math.PI * 2;
      const r = orbitRadius(a, e, nu);
      orbitPoint(r, nu, this.orientation, _tmpVec2);
      positions.push(_tmpVec2.x, _tmpVec2.y, _tmpVec2.z);
    }

    const geometry = new LineGeometry();
    geometry.setPositions(positions);

    const material = new LineMaterial({
      color: this.isMoon ? ORBIT_COLOR_MOON : ORBIT_COLOR_PLANET,
      linewidth: this.isMoon ? 1.0 : 1.2,
      transparent: true,
      opacity: this.orbitBaseOpacity,
      depthWrite: false,
      worldUnits: false
    });
    material.resolution.set(CelestialBodyMesh.viewportWidth, CelestialBodyMesh.viewportHeight);
    CelestialBodyMesh.orbitMaterials.add(material);

    this.orbitLine = new Line2(geometry, material);
    this.orbitLine.frustumCulled = false;
    this.orbitLine.renderOrder = 1;
    this.orbitLine.visible = this.orbitUserVisible;
    this.orbitGroup.add(this.orbitLine);
    this.applyOrbitHighlight();
  }

  private disposeOrbitLine() {
    if (!this.orbitLine) return;
    this.orbitGroup.remove(this.orbitLine);
    this.orbitLine.geometry.dispose();
    const mat = this.orbitLine.material as LineMaterial;
    CelestialBodyMesh.orbitMaterials.delete(mat);
    mat.dispose();
    this.orbitLine = undefined;
  }

  private rebuildOrbitLine() {
    this.disposeOrbitLine();
    if (this.currentOrbitRadius > 0) {
      this.createOrbitLine();
    }
  }

  private applyOrbitHighlight() {
    if (!this.orbitLine) return;
    const mat = this.orbitLine.material as LineMaterial;
    mat.color.set(this.orbitHighlighted ? ORBIT_COLOR_HIGHLIGHT : this.isMoon ? ORBIT_COLOR_MOON : ORBIT_COLOR_PLANET);
    mat.linewidth = this.orbitHighlighted ? 2.2 : this.isMoon ? 1.0 : 1.2;
    mat.opacity = this.orbitHighlighted ? 0.95 : this.orbitBaseOpacity;
  }

  /** Brighten this body's orbit path (used for the selected body). */
  public setOrbitHighlighted(highlighted: boolean) {
    this.orbitHighlighted = highlighted;
    this.applyOrbitHighlight();
  }

  // -------------------------------------------------------------------------
  // Labels
  // -------------------------------------------------------------------------

  private createLabel() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 96;
    const ctx = canvas.getContext('2d')!;
    ctx.font = '600 44px "Space Grotesk Variable", Inter, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = this.isMoon ? 'rgba(190, 205, 225, 0.95)' : 'rgba(255, 255, 255, 0.98)';
    ctx.fillText(this.data.name.replace(/^The /, ''), 256, 48);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      sizeAttenuation: false,
      opacity: 0
    });

    const sprite = new THREE.Sprite(mat);
    const h = this.isMoon ? 0.02 : 0.026;
    sprite.scale.set(h * (512 / 96), h, 1);
    sprite.center.set(0.5, 0);
    sprite.renderOrder = 20;
    sprite.visible = false;
    this.labelSprite = sprite;
    this.positionGroup.add(sprite);
    this.updateLabelOffset();
  }

  private updateLabelOffset() {
    if (!this.labelSprite) return;
    const extra = this.data.type === 'star' ? 0.3 : 0.15;
    this.labelSprite.position.set(0, this.currentRadius * (1 + extra) + 1.2, 0);
  }

  /** Fade the label out as the camera approaches (and hide moon labels unless near their planet). */
  public updateLabel(cameraPos: THREE.Vector3, labelsEnabled: boolean) {
    this.updateGlow(cameraPos);

    const sprite = this.labelSprite;
    if (!sprite) return;

    if (!labelsEnabled) {
      sprite.visible = false;
      return;
    }

    this.positionGroup.getWorldPosition(_tmpVec);
    const d = cameraPos.distanceTo(_tmpVec);
    let alpha = smoothstep(this.currentRadius * 3.5, this.currentRadius * 9, d);

    if (this.isMoon && this.parentMesh) {
      this.parentMesh.positionGroup.getWorldPosition(_tmpVec2);
      const dp = cameraPos.distanceTo(_tmpVec2);
      const pr = this.parentMesh.currentRadius;
      alpha *= 1 - smoothstep(pr * 12, pr * 22, dp);
    }

    (sprite.material as THREE.SpriteMaterial).opacity = alpha * 0.9;
    sprite.visible = alpha > 0.02;
  }

  /** The Sun's billboard glow washes out the whole screen up close, so fade it with distance. */
  private updateGlow(cameraPos: THREE.Vector3) {
    if (!this.glowSprite) return;
    this.positionGroup.getWorldPosition(_tmpVec);
    const d = cameraPos.distanceTo(_tmpVec);
    const r = this.currentRadius;
    (this.glowSprite.material as THREE.SpriteMaterial).opacity = 0.18 + 0.72 * smoothstep(r * 2.5, r * 10, d);
  }

  /** Dim orbit lines when the camera is close to the body so close-ups stay uncluttered. */
  public updateOrbitFade(cameraPos: THREE.Vector3) {
    if (!this.orbitLine || this.orbitHighlighted) return;

    this.positionGroup.getWorldPosition(_tmpVec);
    const d = cameraPos.distanceTo(_tmpVec);
    let f = 0.2 + 0.8 * smoothstep(this.currentRadius * 4, this.currentRadius * 14, d);

    if (this.isMoon && this.parentMesh) {
      this.parentMesh.positionGroup.getWorldPosition(_tmpVec2);
      const dp = cameraPos.distanceTo(_tmpVec2);
      const pr = this.parentMesh.currentRadius;
      f *= 1 - smoothstep(pr * 14, pr * 26, dp);
    }

    (this.orbitLine.material as LineMaterial).opacity = this.orbitBaseOpacity * f;
    this.orbitLine.visible = this.orbitUserVisible && f > 0.01;
  }

  // -------------------------------------------------------------------------
  // Moons
  // -------------------------------------------------------------------------

  private createMajorMoons(majorMoons: MoonInfo[]) {
    majorMoons.forEach((moon, index) => {
      // Calculate scaled moon distance and radius relative to parent
      const moonScaleRadius = Math.max(0.6, (moon.diameterKm / 12000) * this.currentRadius * 0.5);
      const moonOrbitDist = this.currentRadius * (2.4 + index * 1.6);

      const moonData: CelestialBodyData = {
        id: moon.id,
        name: moon.name,
        type: 'moon',
        parentBodyId: this.data.id,
        wikipediaTitle: moon.wikipediaTitle,
        tagline: moon.brief,
        color: moon.color || '#a09d98',
        radiusKm: moon.diameterKm / 2,
        explorerRadius: moonScaleRadius,
        semiMajorAxisAU: moon.orbitDistanceKm / 149597870,
        explorerOrbitRadius: moonOrbitDist,
        orbitalPeriodDays: moon.orbitalPeriodDays,
        rotationPeriodHours: moon.orbitalPeriodDays * 24, // Tidally locked
        axialTiltDeg: 1.5,
        eccentricity: 0.01,
        orbitalInclinationDeg: 2.0,
        massKg: 'Scaled Moon Mass',
        densityGcm3: 3.0,
        surfaceGravityMs2: 1.6,
        escapeVelocityKms: 2.4,
        meanTempC: -150,
        atmosphereComposition: ['None detected or tenuous exosphere'],
        moonsCount: 0,
        discovery: { year: moon.discoveredYear, discoverer: moon.discoverer },
        quickFacts: [
          moon.brief,
          `Diameter: ${moon.diameterKm.toLocaleString()} km`,
          `Discovered by ${moon.discoverer} in ${moon.discoveredYear}`
        ]
      };

      const moonMesh = new CelestialBodyMesh(moonData, true, this);
      this.moons.push(moonMesh);
      this.positionGroup.add(moonMesh.orbitGroup);
    });
  }

  // -------------------------------------------------------------------------
  // Per-frame update
  // -------------------------------------------------------------------------

  /**
   * Tick simulation time and advance orbital revolution + axial rotation
   */
  public update(deltaDays: number, totalTimeSeconds: number) {
    // 1. Orbital revolution (mean anomaly advances linearly, Kepler's equation gives position)
    if (this.data.orbitalPeriodDays !== 0 && this.currentOrbitRadius > 0) {
      const meanMotion = (Math.PI * 2) / this.data.orbitalPeriodDays;
      this.meanAnomaly = (this.meanAnomaly + meanMotion * deltaDays) % (Math.PI * 2);
      this.updatePosition();
    }

    // 2. Axial rotation
    if (this.data.rotationPeriodHours !== 0) {
      const rotSpeed = ((Math.PI * 2) / (this.data.rotationPeriodHours / 24)) * deltaDays;
      this.bodyMesh.rotation.y += rotSpeed;

      // Independent Earth cloud drift
      if (this.cloudMesh) {
        this.cloudMesh.rotation.y += rotSpeed * 1.15;
      }
    }

    // 3. Shader time uniforms
    if (this.sunSurfaceMaterial) {
      this.sunSurfaceMaterial.uniforms.uTime.value = totalTimeSeconds;
    }
    if (this.atmosphereMesh && this.data.type === 'star') {
      const mat = this.atmosphereMesh.material as THREE.ShaderMaterial;
      if (mat.uniforms && mat.uniforms.uTime) {
        mat.uniforms.uTime.value = totalTimeSeconds;
      }
    }
    if (this.hasBandAnimation) {
      this.bandTime.value = totalTimeSeconds;
    }

    // 4. Rings (shadow + brightness)
    this.updateRingUniforms();

    // 5. Child moons
    this.moons.forEach(m => m.update(deltaDays, totalTimeSeconds));
  }

  /**
   * Seamlessly switch scale between Explorer Mode and True Astronomical Scale Mode
   */
  public setScaleMode(mode: 'explorer' | 'true') {
    if (mode === 'explorer') {
      this.currentRadius = this.getExplorerRadius();
      this.currentOrbitRadius = this.getExplorerOrbitRadius();
    } else {
      // True scale proportional (1 AU = 180 units, Sun scaled reasonably to avoid total clipping)
      if (this.data.type === 'star') {
        this.currentRadius = 14;
      } else {
        this.currentRadius = Math.max(0.4, (this.data.radiusKm / 6371.0) * 1.0);
      }
      this.currentOrbitRadius = Math.max(0, this.data.semiMajorAxisAU * AU_TRUE_SCALE_UNITS);
    }

    // Update body mesh scale
    const baseRadius = this.getExplorerRadius();
    const factor = this.currentRadius / baseRadius;
    this.tiltGroup.scale.set(factor, factor, factor);

    this.updatePosition();
    this.updateLabelOffset();

    // Rebuild orbit line at the new scale
    if (this.orbitLine || this.currentOrbitRadius > 0) {
      this.rebuildOrbitLine();
    }

    // Update moons
    this.moons.forEach(m => m.setScaleMode(mode));
  }

  /**
   * Get world position for camera fly-to tracking
   */
  public getWorldPosition(target = new THREE.Vector3()): THREE.Vector3 {
    return this.positionGroup.getWorldPosition(target);
  }

  /**
   * Toggle visibility of orbit paths
   */
  public setOrbitVisibility(visible: boolean) {
    this.orbitUserVisible = visible;
    if (this.orbitLine) {
      this.orbitLine.visible = visible;
    }
    this.moons.forEach(m => m.setOrbitVisibility(visible));
  }

  /** Release GPU resources owned by this body. */
  public dispose() {
    this.disposeOrbitLine();
    this.orbitGroup.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach(m => m.dispose());
      else if (mat) mat.dispose();
    });
  }
}
