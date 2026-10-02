import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.ts';

/**
 * Central texture loader. Loads real planetary maps from /textures and, if a file
 * is missing or fails to load, swaps in the procedural canvas texture instead.
 */
export class TextureLoaderService {
  public static manager = new THREE.LoadingManager();
  private static loader = new THREE.TextureLoader(TextureLoaderService.manager);
  private static cache = new Map<string, THREE.Texture>();
  public static maxAnisotropy = 8;
  /** Number of texture files requested so far (0 means no loading screen is needed). */
  public static requested = 0;

  /** Real map file for each body that has one. */
  private static readonly BODY_MAPS: Record<string, string> = {
    mercury: '2k_mercury.jpg',
    venus: '2k_venus_atmosphere.jpg',
    earth: '2k_earth_daymap.jpg',
    moon: '2k_moon.jpg',
    mars: '2k_mars.jpg',
    jupiter: '2k_jupiter.jpg',
    saturn: '2k_saturn.jpg',
    uranus: '2k_uranus.jpg',
    neptune: '2k_neptune.jpg',
    ceres: '2k_ceres_fictional.jpg'
  };

  private static url(file: string): string {
    return `${import.meta.env.BASE_URL}textures/${file}`;
  }

  /**
   * Load a texture file. The returned texture is usable immediately and fills in when loaded.
   * @param srgb true for color maps, false for data maps (normal, specular, alpha)
   */
  static load(file: string, srgb = true, fallback?: () => THREE.Texture): THREE.Texture {
    const key = `${file}|${srgb}`;
    const cached = this.cache.get(key);
    if (cached) return cached;
    this.requested++;

    const texture = this.loader.load(
      this.url(file),
      tex => {
        tex.needsUpdate = true;
      },
      undefined,
      () => {
        console.warn(`[textures] Failed to load ${file}${fallback ? ', using procedural fallback' : ''}`);
        if (fallback) {
          const fb = fallback();
          texture.image = fb.image as HTMLImageElement;
          texture.needsUpdate = true;
        }
      }
    );

    texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.anisotropy = this.maxAnisotropy;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.cache.set(key, texture);
    return texture;
  }

  /** Surface color map for any body: real texture if available, procedural otherwise. */
  static getBodyTexture(id: string): THREE.Texture {
    const file = this.BODY_MAPS[id];
    if (!file) {
      const proc = TextureGenerator.getTextureForBody(id);
      proc.colorSpace = THREE.SRGBColorSpace;
      proc.anisotropy = this.maxAnisotropy;
      return proc;
    }
    return this.load(file, true, () => TextureGenerator.getTextureForBody(id));
  }

  static hasRealMap(id: string): boolean {
    return id in this.BODY_MAPS;
  }

  static getEarthMaps() {
    return {
      day: this.load('2k_earth_daymap.jpg', true, () => TextureGenerator.createEarthTexture()),
      night: this.load('2k_earth_nightmap.jpg', true),
      normal: this.load('earth_normal_2048.jpg', false),
      specular: this.load('earth_specular_2048.jpg', false),
      clouds: this.load('2k_earth_clouds.jpg', false, () => this.createCloudAlphaFallback())
    };
  }

  /** Grayscale cloud mask used as alphaMap if the cloud file is unavailable. */
  private static createCloudAlphaFallback(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 1024, 512);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    for (let i = 0; i < 90; i++) {
      ctx.beginPath();
      ctx.ellipse((i * 53) % 1024, 70 + ((i * 17) % 370), 30 + (i % 7) * 15, 8 + (i % 4) * 6, i * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
  }

  static getSaturnRings(): THREE.Texture {
    const tex = this.load('2k_saturn_ring_alpha.png', true, () => TextureGenerator.createSaturnRingsTexture());
    tex.wrapS = THREE.ClampToEdgeWrapping;
    return tex;
  }

  static getMilkyWay(): THREE.Texture {
    return this.load('2k_stars_milky_way.jpg', true);
  }
}
