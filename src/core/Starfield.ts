import * as THREE from 'three';

export class Starfield {
  public group: THREE.Group;
  private starsPoints: THREE.Points;

  constructor(count = 12000) {
    this.group = new THREE.Group();

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    // Spectral star colors
    const spectralColors = [
      new THREE.Color('#9bb0ff'), // O/B Blue-White
      new THREE.Color('#bbccff'), // A White
      new THREE.Color('#f8f9ff'), // F Yellow-White
      new THREE.Color('#fff4e8'), // G Yellow (Sun-like)
      new THREE.Color('#ffd2a1'), // K Orange
      new THREE.Color('#ffaa88')  // M Red
    ];

    const radius = 2500;

    for (let i = 0; i < count; i++) {
      // Spherical distribution with Milky Way galactic concentration
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);

      // Enhance density around galactic plane
      let lat = phi - Math.PI / 2;
      if (Math.random() < 0.45) {
        lat *= 0.25; // Concentrate near galactic plane
      }
      const adjustedPhi = lat + Math.PI / 2;

      const r = radius * (0.9 + Math.random() * 0.2);
      const x = r * Math.sin(adjustedPhi) * Math.cos(theta);
      const y = r * Math.sin(adjustedPhi) * Math.sin(theta);
      const z = r * Math.cos(adjustedPhi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Pick spectral color
      const color = spectralColors[Math.floor(Math.random() * spectralColors.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Star apparent magnitude / size
      sizes[i] = 1.0 + Math.pow(Math.random(), 4) * 3.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom circular soft particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1.0)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.7)');
    grad.addColorStop(0.8, 'rgba(255,255,255,0.15)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const starTex = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 2.5,
      sizeAttenuation: false,
      vertexColors: true,
      map: starTex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.starsPoints = new THREE.Points(geometry, material);
    this.group.add(this.starsPoints);
  }

  public update(time: number) {
    // Subtle imperceptible galactic drift
    this.starsPoints.rotation.y = time * 0.0003;

    // Gentle atmospheric-style twinkle
    const material = this.starsPoints.material as THREE.PointsMaterial;
    material.opacity = 0.82 + 0.18 * Math.sin(time * 1.3) * Math.sin(time * 0.37 + 1.0);
  }
}
