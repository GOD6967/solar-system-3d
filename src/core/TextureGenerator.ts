import * as THREE from 'three';

/**
 * Procedural texture generator using HTML5 Canvas.
 * Generates photorealistic spherical projection maps for all celestial bodies,
 * ensuring 100% offline availability, zero external asset dependencies, and instant startup.
 */
export class TextureGenerator {
  private static cache = new Map<string, THREE.CanvasTexture>();

  /**
   * Helper to create a 2D canvas of given dimensions
   */
  private static createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    return { canvas, ctx };
  }

  /**
   * Generate Sun Photosphere texture with granulation and glowing limb darkening
   */
  static createSunTexture(width = 1024, height = 512): THREE.CanvasTexture {
    if (this.cache.has('sun')) return this.cache.get('sun')!;

    const { canvas, ctx } = this.createCanvas(width, height);

    // Base fiery gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#ffcc00');
    gradient.addColorStop(0.5, '#ff8800');
    gradient.addColorStop(1, '#ff4400');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Solar granulation cells
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const noise1 = Math.sin(x * 0.08) * Math.cos(y * 0.08);
        const noise2 = Math.sin(x * 0.2 + y * 0.15) * 0.5;
        const noise3 = Math.cos(x * 0.5 - y * 0.4) * 0.25;
        const total = (noise1 + noise2 + noise3 + 1.75) / 3.5;

        data[i] = Math.min(255, Math.floor(255 * (0.9 + total * 0.2))); // R
        data[i + 1] = Math.min(255, Math.floor(180 * (0.6 + total * 0.4))); // G
        data[i + 2] = Math.min(255, Math.floor(40 * (0.4 + total * 0.6))); // B
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Add sunspot clusters
    ctx.fillStyle = 'rgba(80, 20, 0, 0.7)';
    for (let s = 0; s < 12; s++) {
      const sx = (s * 87) % width;
      const sy = height * 0.35 + Math.sin(s) * (height * 0.25);
      const rad = 4 + (s % 5) * 3;
      ctx.beginPath();
      ctx.arc(sx, sy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    this.cache.set('sun', texture);
    return texture;
  }

  /**
   * Mercury texture: heavily cratered gray-brown terrain
   */
  static createMercuryTexture(width = 1024, height = 512): THREE.CanvasTexture {
    if (this.cache.has('mercury')) return this.cache.get('mercury')!;

    const { canvas, ctx } = this.createCanvas(width, height);
    ctx.fillStyle = '#8f8c85';
    ctx.fillRect(0, 0, width, height);

    // Subtle terrain variation
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const noise = (Math.sin(x * 0.05) + Math.cos(y * 0.07)) * 15;
        const fineNoise = (Math.random() - 0.5) * 20;
        const val = Math.min(255, Math.max(0, 140 + noise + fineNoise));
        data[i] = val;
        data[i + 1] = val * 0.96;
        data[i + 2] = val * 0.92;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Draw impact craters with rims and ejecta blankets
    this.drawCraters(ctx, width, height, 150, '#5a5752', '#b3b0a8');

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('mercury', texture);
    return texture;
  }

  /**
   * Venus texture: thick swirling pale gold & amber sulfuric clouds
   */
  static createVenusTexture(width = 1024, height = 512): THREE.CanvasTexture {
    if (this.cache.has('venus')) return this.cache.get('venus')!;

    const { canvas, ctx } = this.createCanvas(width, height);

    for (let y = 0; y < height; y++) {
      const v = y / height;
      const wave = Math.sin(v * Math.PI * 8) * 15;
      const swirl = Math.cos(v * Math.PI * 4) * 20;

      const r = Math.floor(220 + wave * 0.5);
      const g = Math.floor(180 + swirl * 0.8);
      const b = Math.floor(120 + wave);

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, y, width, 1);
    }

    // Atmospheric diagonal chevron clouds
    ctx.fillStyle = 'rgba(255, 235, 180, 0.15)';
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      const startY = (i * 20) % height;
      ctx.ellipse(width * 0.5, startY, width * 0.6, 25, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('venus', texture);
    return texture;
  }

  /**
   * Earth texture: blue oceans, lush green & arid continents, polar ice caps
   */
  static createEarthTexture(width = 1024, height = 512): THREE.CanvasTexture {
    if (this.cache.has('earth')) return this.cache.get('earth')!;

    const { canvas, ctx } = this.createCanvas(width, height);

    // Deep ocean base
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
    oceanGrad.addColorStop(0, '#102e54');
    oceanGrad.addColorStop(0.5, '#124177');
    oceanGrad.addColorStop(1, '#102e54');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, width, height);

    // Stylized continents (Americas, Eurasia, Africa, Australia)
    ctx.fillStyle = '#2f6838'; // Land green

    // North America
    ctx.beginPath();
    ctx.ellipse(width * 0.22, height * 0.32, width * 0.1, height * 0.16, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // South America
    ctx.beginPath();
    ctx.ellipse(width * 0.30, height * 0.65, width * 0.07, height * 0.18, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eurasia
    ctx.beginPath();
    ctx.ellipse(width * 0.65, height * 0.30, width * 0.22, height * 0.15, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Africa
    ctx.fillStyle = '#8b7a42'; // Arid savannah / Sahara
    ctx.beginPath();
    ctx.ellipse(width * 0.54, height * 0.52, width * 0.09, height * 0.18, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Australia
    ctx.fillStyle = '#9b6c38';
    ctx.beginPath();
    ctx.ellipse(width * 0.82, height * 0.70, width * 0.06, height * 0.08, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Polar ice caps (Arctic & Antarctica)
    ctx.fillStyle = '#e8f4f8';
    ctx.fillRect(0, 0, width, height * 0.08); // North Pole
    ctx.fillRect(0, height * 0.90, width, height * 0.10); // Antarctica

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('earth', texture);
    return texture;
  }

  /**
   * Earth Cloud texture: semi-transparent swirling white cloud formations
   */
  static createEarthCloudsTexture(width = 1024, height = 512): THREE.CanvasTexture {
    if (this.cache.has('earth_clouds')) return this.cache.get('earth_clouds')!;

    const { canvas, ctx } = this.createCanvas(width, height);
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';

    // Swirling cloud belts
    for (let i = 0; i < 60; i++) {
      const cx = (i * 53) % width;
      const cy = (height * 0.15) + (i * 17) % (height * 0.7);
      const rx = 30 + (i % 7) * 15;
      const ry = 8 + (i % 4) * 6;

      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, (i * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('earth_clouds', texture);
    return texture;
  }

  /**
   * Mars texture: rust-red deserts, dark volcanic basalt plains, white polar caps
   */
  static createMarsTexture(width = 1024, height = 512): THREE.CanvasTexture {
    if (this.cache.has('mars')) return this.cache.get('mars')!;

    const { canvas, ctx } = this.createCanvas(width, height);
    ctx.fillStyle = '#b74c20';
    ctx.fillRect(0, 0, width, height);

    // Dark volcanic regions (Syrtis Major, Acidalia Planitia)
    ctx.fillStyle = '#6e2b14';
    ctx.beginPath();
    ctx.ellipse(width * 0.45, height * 0.45, width * 0.18, height * 0.15, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(width * 0.75, height * 0.55, width * 0.15, height * 0.12, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Valles Marineris canyon scratch
    ctx.strokeStyle = '#3e170a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(width * 0.2, height * 0.55);
    ctx.lineTo(width * 0.38, height * 0.58);
    ctx.stroke();

    // Olympus Mons caldera ring
    ctx.fillStyle = '#8f3513';
    ctx.beginPath();
    ctx.arc(width * 0.15, height * 0.4, 18, 0, Math.PI * 2);
    ctx.fill();

    // Polar ice caps
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.04, width * 0.12, height * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.96, width * 0.10, height * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('mars', texture);
    return texture;
  }

  /**
   * Jupiter texture: alternating colorful cloud belts, turbulent white spots, and Great Red Spot
   */
  static createJupiterTexture(width = 1024, height = 512): THREE.CanvasTexture {
    if (this.cache.has('jupiter')) return this.cache.get('jupiter')!;

    const { canvas, ctx } = this.createCanvas(width, height);

    // Alternating horizontal cloud belts (zones and belts)
    const bandColors = [
      '#a88864', '#dfc7a2', '#8c5936', '#eedbb8', '#b57b50',
      '#dfc7a2', '#784627', '#e8d2ad', '#a87955', '#dfc7a2'
    ];

    const bandHeight = height / bandColors.length;
    for (let i = 0; i < bandColors.length; i++) {
      ctx.fillStyle = bandColors[i];
      ctx.fillRect(0, i * bandHeight, width, bandHeight);
    }

    // Add sinusoidal wave ripples to represent jet streams
    for (let y = 0; y < height; y += 4) {
      const wave = Math.sin(y * 0.08) * 12;
      ctx.fillStyle = (y % 8 === 0) ? 'rgba(255, 255, 255, 0.08)' : 'rgba(80, 40, 20, 0.08)';
      ctx.fillRect(0, y, width, 2);
    }

    // The Great Red Spot
    ctx.fillStyle = '#b33e21';
    ctx.beginPath();
    ctx.ellipse(width * 0.62, height * 0.65, width * 0.07, height * 0.055, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // Eye of the storm
    ctx.fillStyle = '#8a2811';
    ctx.beginPath();
    ctx.ellipse(width * 0.62, height * 0.65, width * 0.035, height * 0.025, 0, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('jupiter', texture);
    return texture;
  }

  /**
   * Saturn texture: serene golden ochre and butterscotch atmospheric bands
   */
  static createSaturnTexture(width = 1024, height = 512): THREE.CanvasTexture {
    if (this.cache.has('saturn')) return this.cache.get('saturn')!;

    const { canvas, ctx } = this.createCanvas(width, height);

    const bands = [
      '#c2b08a', '#dccca5', '#e9dbb8', '#dbc79b', '#ebdcb9',
      '#d2be92', '#e5d5af', '#cbba8e', '#ebdcb9', '#bfae87'
    ];

    const h = height / bands.length;
    bands.forEach((color, idx) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, idx * h, width, h);
    });

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('saturn', texture);
    return texture;
  }

  /**
   * Saturn Rings Texture: photorealistic concentric rings with Cassini division and Encke gap
   */
  static createSaturnRingsTexture(width = 1024, height = 64): THREE.CanvasTexture {
    if (this.cache.has('saturn_rings')) return this.cache.get('saturn_rings')!;

    const { canvas, ctx } = this.createCanvas(width, height);
    ctx.clearRect(0, 0, width, height);

    // Draw horizontal radial bands from inner to outer radius
    for (let x = 0; x < width; x++) {
      const u = x / width; // 0 = inner edge, 1 = outer edge
      let alpha = 0.8;
      let r = 210, g = 195, b = 160;

      // C Ring (inner transparent)
      if (u < 0.25) {
        alpha = 0.3 + u * 0.4;
      }
      // B Ring (bright dense main ring)
      else if (u >= 0.25 && u < 0.65) {
        alpha = 0.95;
        r = 230; g = 215; b = 180;
      }
      // Cassini Division (dark gap)
      else if (u >= 0.65 && u < 0.72) {
        alpha = 0.05; // Gap
      }
      // A Ring (outer bright ring)
      else if (u >= 0.72 && u < 0.95) {
        alpha = 0.8;
        if (u > 0.87 && u < 0.89) {
          alpha = 0.05; // Encke Gap
        }
      }
      // Outer boundary taper
      else {
        alpha = (1.0 - u) * 10.0 * 0.5;
      }

      ctx.fillStyle = `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
      ctx.fillRect(x, 0, 1, height);
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('saturn_rings', texture);
    return texture;
  }

  /**
   * Uranus texture: pale aquamarine / cyan with faint zonal banding
   */
  static createUranusTexture(width = 512, height = 256): THREE.CanvasTexture {
    if (this.cache.has('uranus')) return this.cache.get('uranus')!;

    const { canvas, ctx } = this.createCanvas(width, height);
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#66cbd6');
    grad.addColorStop(0.3, '#7de0ea');
    grad.addColorStop(0.7, '#88e4ee');
    grad.addColorStop(1, '#66cbd6');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('uranus', texture);
    return texture;
  }

  /**
   * Neptune texture: vivid cobalt blue with white methane cirrus cloud streaks
   */
  static createNeptuneTexture(width = 1024, height = 512): THREE.CanvasTexture {
    if (this.cache.has('neptune')) return this.cache.get('neptune')!;

    const { canvas, ctx } = this.createCanvas(width, height);

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#214ec0');
    grad.addColorStop(0.5, '#2e63dd');
    grad.addColorStop(1, '#214ec0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Great Dark Spot
    ctx.fillStyle = '#163585';
    ctx.beginPath();
    ctx.ellipse(width * 0.45, height * 0.4, width * 0.08, height * 0.05, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // White methane storm cirrus wisps ("Scooter")
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 20; i++) {
      const cx = (i * 71) % width;
      const cy = height * 0.35 + (i * 9) % (height * 0.3);
      ctx.beginPath();
      ctx.ellipse(cx, cy, 35, 3, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('neptune', texture);
    return texture;
  }

  /**
   * Earth's Moon (Luna) texture: gray regolith with dark basaltic Maria and bright rayed craters
   */
  static createMoonTexture(width = 1024, height = 512): THREE.CanvasTexture {
    if (this.cache.has('moon')) return this.cache.get('moon')!;

    const { canvas, ctx } = this.createCanvas(width, height);
    ctx.fillStyle = '#9b9893';
    ctx.fillRect(0, 0, width, height);

    // Dark lunar maria (Sea of Tranquility, Ocean of Storms)
    ctx.fillStyle = '#67645f';
    ctx.beginPath();
    ctx.ellipse(width * 0.35, height * 0.4, width * 0.16, height * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(width * 0.55, height * 0.48, width * 0.12, height * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Impact craters with Tycho ray systems
    this.drawCraters(ctx, width, height, 180, '#53504c', '#d5d2cc');

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('moon', texture);
    return texture;
  }

  /**
   * Europa texture: smooth bright ice shell crisscrossed by reddish-brown lineae fractures
   */
  static createEuropaTexture(width = 1024, height = 512): THREE.CanvasTexture {
    if (this.cache.has('europa')) return this.cache.get('europa')!;

    const { canvas, ctx } = this.createCanvas(width, height);
    ctx.fillStyle = '#e5ded5';
    ctx.fillRect(0, 0, width, height);

    // Reddish-brown mineral fracture lines (lineae)
    ctx.strokeStyle = '#a66a4a';
    ctx.lineWidth = 2;
    for (let i = 0; i < 45; i++) {
      ctx.beginPath();
      const x1 = (i * 37) % width;
      const y1 = (i * 23) % height;
      const x2 = (x1 + (i % 5) * 80 - 150 + width) % width;
      const y2 = (y1 + (i % 7) * 70 - 120 + height) % height;
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo((x1 + x2) / 2 + 20, (y1 + y2) / 2 - 20, x2, y2);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('europa', texture);
    return texture;
  }

  /**
   * Pluto texture: reddish-tan terrain featuring the bright nitrogen heart glacier (Tombaugh Regio)
   */
  static createPlutoTexture(width = 1024, height = 512): THREE.CanvasTexture {
    if (this.cache.has('pluto')) return this.cache.get('pluto')!;

    const { canvas, ctx } = this.createCanvas(width, height);
    ctx.fillStyle = '#b38260';
    ctx.fillRect(0, 0, width, height);

    // Cthulhu Macula (dark equatorial tholin belt)
    ctx.fillStyle = '#583623';
    ctx.beginPath();
    ctx.ellipse(width * 0.35, height * 0.55, width * 0.25, height * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tombaugh Regio (The bright nitrogen ice heart)
    ctx.fillStyle = '#f0e6dc';
    ctx.beginPath();
    // Left lobe (Sputnik Planitia)
    ctx.ellipse(width * 0.58, height * 0.52, width * 0.09, height * 0.12, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Right lobe
    ctx.beginPath();
    ctx.ellipse(width * 0.69, height * 0.50, width * 0.07, height * 0.09, 0.2, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('pluto', texture);
    return texture;
  }

  /**
   * Generic rocky / icy asteroid and moon texture
   */
  static createRockyTexture(baseColor = '#807a73', craterCount = 100): THREE.CanvasTexture {
    const key = `rock_${baseColor}_${craterCount}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const { canvas, ctx } = this.createCanvas(512, 256);
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 256);

    this.drawCraters(ctx, 512, 256, craterCount, '#47433e', '#b8b3ab');

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Helper to draw realistic impact craters with shadow and bright rims
   */
  private static drawCraters(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    count: number,
    shadowColor: string,
    rimColor: string
  ) {
    for (let c = 0; c < count; c++) {
      const cx = Math.random() * width;
      const cy = Math.random() * height;
      const radius = 2 + Math.pow(Math.random(), 3) * 20;

      // Bright outer rim
      ctx.fillStyle = rimColor;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Dark interior depression
      ctx.fillStyle = shadowColor;
      ctx.beginPath();
      ctx.arc(cx + radius * 0.15, cy + radius * 0.15, radius * 0.85, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Retrieve texture appropriate for any given celestial body ID
   */
  static getTextureForBody(id: string): THREE.CanvasTexture {
    switch (id) {
      case 'sun': return this.createSunTexture();
      case 'mercury': return this.createMercuryTexture();
      case 'venus': return this.createVenusTexture();
      case 'earth': return this.createEarthTexture();
      case 'mars': return this.createMarsTexture();
      case 'jupiter': return this.createJupiterTexture();
      case 'saturn': return this.createSaturnTexture();
      case 'uranus': return this.createUranusTexture();
      case 'neptune': return this.createNeptuneTexture();
      case 'moon': return this.createMoonTexture();
      case 'europa': return this.createEuropaTexture();
      case 'pluto': return this.createPlutoTexture();
      case 'io': return this.createRockyTexture('#e5be30', 80);
      case 'ganymede': return this.createRockyTexture('#8a8279', 140);
      case 'callisto': return this.createRockyTexture('#655e56', 220);
      case 'titan': return this.createRockyTexture('#e6a84e', 20); // Thick smog cover
      case 'enceladus': return this.createRockyTexture('#f0f4f8', 40);
      case 'mimas': return this.createRockyTexture('#9a9792', 160);
      case 'ceres': return this.createRockyTexture('#777470', 120);
      default: return this.createRockyTexture('#7c7974', 80);
    }
  }
}
