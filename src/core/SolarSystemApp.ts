import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CelestialBodyData, ALL_CELESTIAL_BODIES } from '../data/celestialBodies.ts';
import { CelestialBodyMesh } from './CelestialBodyMesh.ts';
import { InstancedBelts } from './InstancedBelts.ts';
import { CometSystem } from './CometSystem.ts';
import { Starfield } from './Starfield.ts';
import { CameraDirector } from './CameraDirector.ts';
import { AudioEngine } from './AudioEngine.ts';
import { TextureLoaderService } from './TextureLoaderService.ts';
import { SunLightState, SUN_INTENSITY_EXPLORER, SUN_INTENSITY_TRUE } from './constants.ts';

const MAX_FRAME_SECONDS = 0.1;

export class SolarSystemApp {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public composer: EffectComposer;
  public controls: OrbitControls;
  public cameraDirector: CameraDirector;

  // Visual subsystems
  public starfield: Starfield;
  public instancedBelts: InstancedBelts;
  public cometSystem: CometSystem;
  private skybox: THREE.Mesh;
  private sunLight!: THREE.PointLight;

  // Celestial bodies catalog
  public bodyMeshes: Map<string, CelestialBodyMesh> = new Map();
  public interactiveMeshes: THREE.Mesh[] = [];
  public selectedBodyId: string | null = null;

  // Simulation parameters
  public isPaused = false;
  public timeSpeedMultiplier = 1.0; // 1 second real-time = 1 Earth day default
  public simulationDate = new Date();
  public scaleMode: 'explorer' | 'true' = 'explorer';
  public labelsVisible = true;

  // Raycasting & Interaction
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  public onBodySelected?: (body: CelestialBodyData) => void;
  public onBodyHovered?: (body: CelestialBodyData | null, clientX: number, clientY: number) => void;
  private pendingHover: { x: number; y: number } | null = null;
  private hoverFrameScheduled = false;
  private pointerDownPos = new THREE.Vector2();

  private timer = new THREE.Timer();
  private animationFrameId: number | null = null;

  // Bound handlers (kept so they can be removed in destroy)
  private readonly resizeHandler = () => this.onResize();
  private readonly pointerDownHandler = (e: PointerEvent) => this.onPointerDown(e);
  private readonly pointerMoveHandler = (e: PointerEvent) => this.onPointerMove(e);

  constructor(container: HTMLElement) {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x02040a);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 8000);
    this.camera.position.set(0, 320, 480);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: false, // MSAA is provided by the post-processing render target
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    TextureLoaderService.maxAnisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    CelestialBodyMesh.setViewportSize(window.innerWidth, window.innerHeight);

    // 4. Post-processing (HDR render target with MSAA -> bloom -> tone mapping)
    this.composer = this.createComposer();

    // 5. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = true;

    // 6. Camera Director
    this.cameraDirector = new CameraDirector(this.camera, this.controls);

    // 7. Lighting
    this.setupLighting();

    // 8. Skybox + Starfield
    this.skybox = this.createSkybox();
    this.scene.add(this.skybox);
    this.starfield = new Starfield(6000);
    this.scene.add(this.starfield.group);

    // 9. Celestial Bodies
    this.initCelestialBodies();
    this.setSimulationDate(this.simulationDate);

    // 10. Asteroid Belts
    this.instancedBelts = new InstancedBelts();
    this.scene.add(this.instancedBelts.group);

    // 11. Comets
    this.cometSystem = new CometSystem();
    this.scene.add(this.cometSystem.group);

    // 12. Event Listeners
    this.setupEventListeners();

    // 13. Start Render Loop
    this.start();
  }

  private createComposer(): EffectComposer {
    const pixelRatio = this.renderer.getPixelRatio();
    const w = window.innerWidth;
    const h = window.innerHeight;

    const target = new THREE.WebGLRenderTarget(w * pixelRatio, h * pixelRatio, {
      type: THREE.HalfFloatType,
      samples: 4
    });
    const composer = new EffectComposer(this.renderer, target);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(w, h);

    composer.addPass(new RenderPass(this.scene, this.camera));
    // strength, radius, threshold (HDR: only the Sun and the very brightest surfaces glow)
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), 0.5, 0.65, 1.0));
    composer.addPass(new OutputPass());
    return composer;
  }

  private setupLighting() {
    // Very faint ambient so the night sides are not pure black
    const ambientLight = new THREE.AmbientLight(0x8899cc, 0.15);
    this.scene.add(ambientLight);

    // The Sun: inverse-distance falloff keeps the outer planets readable
    this.sunLight = new THREE.PointLight(0xfff4e6, SUN_INTENSITY_EXPLORER, 0, 1);
    this.sunLight.position.set(0, 0, 0);
    this.scene.add(this.sunLight);
  }

  private createSkybox(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(3500, 64, 32);
    const material = new THREE.MeshBasicMaterial({
      map: TextureLoaderService.getMilkyWay(),
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    });
    // HDR multiplier: the Milky Way map is dark, so lift it enough to read as a galactic band
    material.color.setRGB(1.7, 1.7, 1.9);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = -1000;
    mesh.frustumCulled = false;
    return mesh;
  }

  private initCelestialBodies() {
    ALL_CELESTIAL_BODIES.forEach(data => {
      const mesh = new CelestialBodyMesh(data);
      this.bodyMeshes.set(data.id, mesh);
      this.scene.add(mesh.orbitGroup);

      // Register interactive body meshes for raycasting
      this.interactiveMeshes.push(mesh.bodyMesh);

      // Also register child moons
      mesh.moons.forEach(m => {
        this.bodyMeshes.set(m.data.id, m);
        this.interactiveMeshes.push(m.bodyMesh);
      });
    });
  }

  private setupEventListeners() {
    window.addEventListener('resize', this.resizeHandler);

    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.pointerDownHandler);
    dom.addEventListener('pointermove', this.pointerMoveHandler);
  }

  private onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio, 2);

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(w, h);
    this.composer.setPixelRatio(pixelRatio);
    this.composer.setSize(w, h);
    CelestialBodyMesh.setViewportSize(w, h);
  }

  private onPointerDown(e: PointerEvent) {
    this.pointerDownPos.set(e.clientX, e.clientY);
    // Listen for pointerup to differentiate drag vs click
    const onPointerUp = (upEvt: PointerEvent) => {
      window.removeEventListener('pointerup', onPointerUp);
      const dist = Math.hypot(upEvt.clientX - this.pointerDownPos.x, upEvt.clientY - this.pointerDownPos.y);
      if (dist < 6) {
        this.handleClick(upEvt);
      }
    };
    window.addEventListener('pointerup', onPointerUp);
  }

  private pickBody(clientX: number, clientY: number): CelestialBodyData | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveMeshes, false);
    if (intersects.length === 0) return null;

    const hit = intersects[0].object as THREE.Mesh;
    return (hit.userData.bodyData as CelestialBodyData) || null;
  }

  private handleClick(e: PointerEvent) {
    const bodyData = this.pickBody(e.clientX, e.clientY);
    if (bodyData) {
      this.selectBody(bodyData.id);
    }
  }

  /** Hover raycasts are coalesced to at most one per animation frame. */
  private onPointerMove(e: PointerEvent) {
    if (!this.onBodyHovered) return;

    this.pendingHover = { x: e.clientX, y: e.clientY };
    if (this.hoverFrameScheduled) return;
    this.hoverFrameScheduled = true;

    requestAnimationFrame(() => {
      this.hoverFrameScheduled = false;
      const p = this.pendingHover;
      this.pendingHover = null;
      if (!p || !this.onBodyHovered) return;

      const bodyData = this.pickBody(p.x, p.y);
      this.renderer.domElement.style.cursor = bodyData ? 'pointer' : 'default';
      this.onBodyHovered(bodyData, p.x, p.y);
    });
  }

  /**
   * Select and fly to a celestial body by ID
   */
  public selectBody(id: string) {
    const mesh = this.bodyMeshes.get(id);
    if (!mesh) return;

    AudioEngine.playClick();
    AudioEngine.playChime();

    if (this.selectedBodyId) {
      this.bodyMeshes.get(this.selectedBodyId)?.setOrbitHighlighted(false);
    }
    this.selectedBodyId = id;
    mesh.setOrbitHighlighted(true);

    this.cameraDirector.flyToBody(mesh);

    if (this.onBodySelected) {
      this.onBodySelected(mesh.data);
    }
  }

  /** Clear the selection highlight and return to the full overview. */
  public clearSelection() {
    if (this.selectedBodyId) {
      this.bodyMeshes.get(this.selectedBodyId)?.setOrbitHighlighted(false);
      this.selectedBodyId = null;
    }
  }

  /**
   * Switch between Explorer Mode (scaled) and True Scale Mode
   */
  public setScaleMode(mode: 'explorer' | 'true') {
    this.scaleMode = mode;

    SunLightState.intensity = mode === 'true' ? SUN_INTENSITY_TRUE : SUN_INTENSITY_EXPLORER;
    this.sunLight.intensity = SunLightState.intensity;

    this.bodyMeshes.forEach(mesh => {
      // Only root bodies (Sun, planets, dwarf planets) need to trigger setScaleMode
      if (!mesh.isMoon) {
        mesh.setScaleMode(mode);
      }
    });

    this.instancedBelts.setVisibility(mode !== 'true');
    this.cometSystem.setVisibility(mode !== 'true');

    // Re-apply the current selection highlight on the rebuilt orbit lines
    if (this.selectedBodyId) {
      this.bodyMeshes.get(this.selectedBodyId)?.setOrbitHighlighted(true);
    }
  }

  /**
   * Set simulation speed multiplier (e.g. 0.1x to 1000x)
   */
  public setTimeSpeedMultiplier(multiplier: number) {
    this.timeSpeedMultiplier = multiplier;
  }

  /**
   * Jump the simulation to a calendar date; planets move to their real positions for that date.
   */
  public setSimulationDate(date: Date) {
    this.simulationDate = new Date(date.getTime());
    this.bodyMeshes.forEach(mesh => {
      if (!mesh.isMoon) {
        mesh.syncToDate(this.simulationDate);
      }
    });
  }

  /**
   * Toggle pause
   */
  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  /**
   * Toggle orbit lines visibility
   */
  public setOrbitVisibility(visible: boolean) {
    this.bodyMeshes.forEach(mesh => {
      if (!mesh.isMoon) mesh.setOrbitVisibility(visible);
    });
  }

  public setLabelsVisible(visible: boolean) {
    this.labelsVisible = visible;
  }

  /**
   * Main render loop
   */
  private start() {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      this.timer.update();
      const deltaSeconds = Math.min(this.timer.getDelta(), MAX_FRAME_SECONDS);
      const elapsedTime = this.timer.getElapsed();

      // Advance celestial time
      const deltaDays = this.isPaused ? 0 : deltaSeconds * this.timeSpeedMultiplier;

      // Update simulation calendar date
      if (!this.isPaused) {
        this.simulationDate.setTime(this.simulationDate.getTime() + deltaDays * 86400000);
      }

      // Update Celestial bodies
      this.bodyMeshes.forEach(mesh => {
        if (!mesh.isMoon) {
          mesh.update(deltaDays, elapsedTime);
        }
      });

      // Update Asteroid belts
      this.instancedBelts.update(deltaDays);

      // Update Comets
      this.cometSystem.update(deltaDays);

      // Update Starfield + keep the sky dome centered on the camera
      this.starfield.update(elapsedTime);
      this.skybox.position.copy(this.camera.position);

      // Update Camera & Controls
      this.cameraDirector.update(deltaSeconds);
      this.controls.update();

      // Labels and orbit fading depend on the final camera position
      const camPos = this.camera.position;
      this.bodyMeshes.forEach(mesh => {
        mesh.updateLabel(camPos, this.labelsVisible);
        mesh.updateOrbitFade(camPos);
      });

      // Render Scene (HDR -> bloom -> tone mapping)
      this.composer.render();
    };

    animate();
  }

  public destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    window.removeEventListener('resize', this.resizeHandler);
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.pointerDownHandler);
    dom.removeEventListener('pointermove', this.pointerMoveHandler);

    this.bodyMeshes.forEach(mesh => {
      if (!mesh.isMoon) mesh.dispose();
    });
    this.skybox.geometry.dispose();
    (this.skybox.material as THREE.Material).dispose();
    this.controls.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
