import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CelestialBodyMesh } from './CelestialBodyMesh.ts';
import { AudioEngine } from './AudioEngine.ts';

export class CameraDirector {
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;

  // Tracking target
  private trackingTarget: CelestialBodyMesh | null = null;
  private targetOffset = new THREE.Vector3(0, 15, 35);

  // Transition state
  private isTransitioning = false;
  private transitionProgress = 0;
  private transitionDuration = 1.6; // seconds
  private startCameraPos = new THREE.Vector3();
  private startTargetPos = new THREE.Vector3();
  private endCameraPos = new THREE.Vector3();
  private endTargetPos = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera, controls: OrbitControls) {
    this.camera = camera;
    this.controls = controls;

    // Default starting overview position
    this.resetToSolarSystemOverview();
  }

  /**
   * Smoothly fly camera to any celestial body
   */
  public flyToBody(bodyMesh: CelestialBodyMesh, customDistance?: number) {
    AudioEngine.playWhoosh();

    const worldPos = bodyMesh.getWorldPosition();
    const radius = bodyMesh.currentRadius;
    const distance = customDistance || Math.max(12, radius * 3.8);

    // View from the sunlit side (rotated ~30 degrees off the Sun line) so the lit face is visible,
    // instead of looking at the dark side with the Sun glaring from behind the body.
    const toSun = new THREE.Vector3(-worldPos.x, 0, -worldPos.z);
    if (bodyMesh.data.type === 'star' || toSun.lengthSq() < 1e-3) {
      this.targetOffset.set(distance * 0.7, distance * 0.35, distance * 0.7);
    } else {
      toSun.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.55);
      this.targetOffset.set(toSun.x * distance * 0.95, distance * 0.3, toSun.z * distance * 0.95);
    }

    this.startCameraPos.copy(this.camera.position);
    this.startTargetPos.copy(this.controls.target);

    this.endTargetPos.copy(worldPos);
    this.endCameraPos.copy(worldPos).add(this.targetOffset);

    this.trackingTarget = bodyMesh;
    this.isTransitioning = true;
    this.transitionProgress = 0;

    // Adjust control limits
    this.controls.minDistance = radius * 1.3;
    this.controls.maxDistance = distance * 10;
  }

  /**
   * Reset view to full solar system overview
   */
  public resetToSolarSystemOverview() {
    AudioEngine.playWhoosh();
    this.trackingTarget = null;

    this.startCameraPos.copy(this.camera.position);
    this.startTargetPos.copy(this.controls.target);

    this.endTargetPos.set(0, 0, 0);
    this.endCameraPos.set(0, 320, 480);

    this.isTransitioning = true;
    this.transitionProgress = 0;

    this.controls.minDistance = 15;
    this.controls.maxDistance = 2000;
  }

  /**
   * Reset view to top-down 2D map view
   */
  public setTopDownView() {
    AudioEngine.playWhoosh();
    this.trackingTarget = null;

    this.startCameraPos.copy(this.camera.position);
    this.startTargetPos.copy(this.controls.target);

    this.endTargetPos.set(0, 0, 0);
    this.endCameraPos.set(0, 580, 0.001); // slight offset to prevent gimbal lock

    this.isTransitioning = true;
    this.transitionProgress = 0;
  }

  /**
   * Smooth cubic ease-in-out curve
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Update per animation frame
   */
  public update(deltaTimeSeconds: number) {
    if (this.isTransitioning) {
      this.transitionProgress += deltaTimeSeconds / this.transitionDuration;

      if (this.transitionProgress >= 1.0) {
        this.transitionProgress = 1.0;
        this.isTransitioning = false;
      }

      const ease = this.easeInOutCubic(this.transitionProgress);

      // If tracking a moving body during transition, update end positions dynamically
      if (this.trackingTarget) {
        this.trackingTarget.getWorldPosition(this.endTargetPos);
        this.endCameraPos.copy(this.endTargetPos).add(this.targetOffset);
      }

      this.camera.position.lerpVectors(this.startCameraPos, this.endCameraPos, ease);
      this.controls.target.lerpVectors(this.startTargetPos, this.endTargetPos, ease);
    } else if (this.trackingTarget) {
      // Keep tracking target in orbit
      const targetPos = this.trackingTarget.getWorldPosition();
      const currentCameraOffset = this.camera.position.clone().sub(this.controls.target);

      this.controls.target.copy(targetPos);
      this.camera.position.copy(targetPos).add(currentCameraOffset);
    }
  }

  public getTrackingTarget(): CelestialBodyMesh | null {
    return this.trackingTarget;
  }
}
