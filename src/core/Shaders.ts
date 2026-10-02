import * as THREE from 'three';

/**
 * GLSL shaders and material patches for the Sun, planetary atmospheres, rings, and Earth.
 * All shaders output linear color; the post-processing OutputPass handles tone mapping.
 */

// ---------------------------------------------------------------------------
// Shared GLSL snippets
// ---------------------------------------------------------------------------
const NOISE_GLSL = `
  float hash31(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise3(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
      f.z);
  }

  float fbm(vec3 p) {
    float a = 0.5;
    float s = 0.0;
    for (int i = 0; i < 5; i++) {
      s += a * noise3(p);
      p = p * 2.02 + vec3(1.7, 9.2, 3.1);
      a *= 0.5;
    }
    return s;
  }
`;

// ---------------------------------------------------------------------------
// Sun photosphere: animated plasma granulation, sunspots, limb darkening
// ---------------------------------------------------------------------------
export function createSunSurfaceMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec3 vPos;
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        vPos = position;
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vPos;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      ${NOISE_GLSL}

      void main() {
        vec3 dir = normalize(vPos);
        float t = uTime * 0.05;

        float gran = fbm(dir * 16.0 + vec3(0.0, t * 2.0, 0.0));
        float cells = fbm(dir * 5.0 + vec3(t, 0.0, -t));
        float v = gran * 0.6 + cells * 0.4;

        float spots = smoothstep(0.64, 0.74, fbm(dir * 2.4 + vec3(11.0, 3.0, 7.0) + t * 0.3));

        vec3 cool = vec3(0.80, 0.20, 0.02);
        vec3 mid = vec3(1.00, 0.58, 0.12);
        vec3 hot = vec3(1.00, 0.92, 0.60);

        vec3 col = mix(cool, mid, smoothstep(0.28, 0.55, v));
        col = mix(col, hot, smoothstep(0.50, 0.80, v));
        col = mix(col, col * 0.12, spots * 0.85);

        float mu = clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0);
        col *= 0.30 + 0.70 * pow(mu, 0.55);

        gl_FragColor = vec4(col * 1.9, 1.0);
      }
    `
  });
}

// ---------------------------------------------------------------------------
// Sun corona shell (plasma flare turbulence + fresnel rim)
// ---------------------------------------------------------------------------
export const SunCoronaShader = {
  uniforms: {
    uTime: { value: 0 },
    uColorInner: { value: new THREE.Color(0xfff0aa) },
    uColorOuter: { value: new THREE.Color(0xff4500) }
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColorInner;
    uniform vec3 uColorOuter;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      // Back faces: |n.v| is 0 at the outer silhouette and grows toward the Sun's limb
      float c = abs(dot(viewDir, normal));
      float glow = pow(clamp(c / 0.60, 0.0, 1.0), 1.6);

      vec2 uvNoise = vUv * vec2(24.0, 12.0) + vec2(uTime * 0.15, uTime * 0.08);
      float n1 = noise(uvNoise);
      float n2 = noise(uvNoise * 2.0 - vec2(uTime * 0.2));
      float plasma = (n1 * 0.65 + n2 * 0.35);

      vec3 color = mix(uColorOuter, uColorInner, glow * 0.8 + plasma * 0.2);
      float alpha = clamp(glow * (0.55 + plasma * 0.6), 0.0, 1.0);

      gl_FragColor = vec4(color * 1.4, alpha);
    }
  `
};

export function createSunAtmosphereMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(SunCoronaShader.uniforms),
    vertexShader: SunCoronaShader.vertexShader,
    fragmentShader: SunCoronaShader.fragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false
  });
}

/** Soft radial glow texture for the Sun's billboard corona */
export function createSunGlowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0.0, 'rgba(255, 235, 190, 1.0)');
  grad.addColorStop(0.22, 'rgba(255, 190, 100, 0.95)');
  grad.addColorStop(0.32, 'rgba(255, 150, 60, 0.55)');
  grad.addColorStop(0.5, 'rgba(255, 110, 30, 0.2)');
  grad.addColorStop(0.75, 'rgba(255, 80, 10, 0.06)');
  grad.addColorStop(1.0, 'rgba(255, 60, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// Planetary atmosphere: glow that hugs the limb and fades outward, strongest on the sunlit side
// ---------------------------------------------------------------------------
export const AtmosphereFresnelShader = {
  uniforms: {
    uAtmosphereColor: { value: new THREE.Color(0x4ca3ff) },
    uCoreC: { value: 0.3 },
    uPower: { value: 2.2 },
    uIntensity: { value: 1.2 }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vSunDir;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      vec3 sunView = (viewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      vSunDir = normalize(sunView - mvPosition.xyz);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uAtmosphereColor;
    uniform float uCoreC;
    uniform float uPower;
    uniform float uIntensity;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vSunDir;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      // Back faces of the shell: |n.v| = uCoreC at the planet limb, 0 at the shell silhouette
      float c = abs(dot(viewDir, normal));
      float glow = pow(clamp(c / uCoreC, 0.0, 1.0), uPower);

      // Daylight mask so the night side does not glow
      float lit = smoothstep(-0.35, 0.45, dot(normal, normalize(vSunDir)));

      gl_FragColor = vec4(uAtmosphereColor, glow * uIntensity * (0.12 + 0.88 * lit));
    }
  `
};

export function createPlanetaryAtmosphereMaterial(
  colorHex: string | number = 0x4ca3ff,
  intensity = 1.3,
  scale = 1.05
): THREE.ShaderMaterial {
  const uniforms = THREE.UniformsUtils.clone(AtmosphereFresnelShader.uniforms);
  uniforms.uAtmosphereColor.value = new THREE.Color(colorHex);
  uniforms.uIntensity.value = intensity;
  uniforms.uCoreC.value = Math.sqrt(Math.max(0.001, 1 - 1 / (scale * scale)));

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: AtmosphereFresnelShader.vertexShader,
    fragmentShader: AtmosphereFresnelShader.fragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false
  });
}

// ---------------------------------------------------------------------------
// Rings: radial texture, sun-lit, with the planet's shadow cast across them
// ---------------------------------------------------------------------------
export interface RingMaterialUniforms {
  uPlanetPos: { value: THREE.Vector3 };
  uPlanetRadius: { value: number };
  uLight: { value: number };
}

export function createRingMaterial(
  map: THREE.Texture,
  tint: THREE.ColorRepresentation,
  opacity: number
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: map },
      uTint: { value: new THREE.Color(tint) },
      uOpacity: { value: opacity },
      uPlanetPos: { value: new THREE.Vector3() },
      uPlanetRadius: { value: 1 },
      uSunPos: { value: new THREE.Vector3(0, 0, 0) },
      uLight: { value: 0.7 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorld;

      void main() {
        vUv = uv;
        vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform vec3 uTint;
      uniform float uOpacity;
      uniform vec3 uPlanetPos;
      uniform float uPlanetRadius;
      uniform vec3 uSunPos;
      uniform float uLight;

      varying vec2 vUv;
      varying vec3 vWorld;

      void main() {
        vec4 tex = texture2D(uMap, vUv);

        // Planet shadow: distance from the planet center to the ray ring-point -> sun
        vec3 toSun = normalize(uSunPos - vWorld);
        vec3 oc = uPlanetPos - vWorld;
        float proj = dot(oc, toSun);
        float shadow = 1.0;
        if (proj > 0.0) {
          float d = length(oc - toSun * proj);
          // Soft penumbra; the shadowed ring keeps some brightness from scattered light
          shadow = mix(0.14, 1.0, smoothstep(uPlanetRadius * 0.88, uPlanetRadius * 1.12, d));
        }

        gl_FragColor = vec4(tex.rgb * uTint * uLight * shadow, tex.a * uOpacity);
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false
  });
}

// ---------------------------------------------------------------------------
// Material patches (MeshStandardMaterial.onBeforeCompile)
// ---------------------------------------------------------------------------

/** Ring shadow cast onto a planet's surface (Saturn). Updated every frame by the caller. */
export interface RingShadowUniforms {
  uRingTex: { value: THREE.Texture | null };
  uRingCenter: { value: THREE.Vector3 };
  uRingNormal: { value: THREE.Vector3 };
  uRingInner: { value: number };
  uRingOuter: { value: number };
  uSunPos: { value: THREE.Vector3 };
}

/**
 * Chain a shader patch onto a material (several patches can be stacked on one material).
 * Each patch needs a unique key so three.js caches distinct programs correctly.
 */
function patchMaterial(
  material: THREE.Material,
  key: string,
  patch: (shader: { uniforms: Record<string, THREE.IUniform>; vertexShader: string; fragmentShader: string }) => void
) {
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    prev.call(material, shader, renderer);
    patch(shader);
  };
  material.userData.patchKey = `${material.userData.patchKey ?? ''}|${key}`;
  material.customProgramCacheKey = () => material.userData.patchKey as string;
}

export function createRingShadowUniforms(tex: THREE.Texture): RingShadowUniforms {
  return {
    uRingTex: { value: tex },
    uRingCenter: { value: new THREE.Vector3() },
    uRingNormal: { value: new THREE.Vector3(0, 1, 0) },
    uRingInner: { value: 1 },
    uRingOuter: { value: 2 },
    uSunPos: { value: new THREE.Vector3(0, 0, 0) }
  };
}

export function applyRingShadow(material: THREE.MeshStandardMaterial, u: RingShadowUniforms) {
  patchMaterial(material, 'ring-shadow', shader => {
    Object.assign(shader.uniforms, u);

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRingWorldPos;')
      .replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nvRingWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;'
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vRingWorldPos;
        uniform sampler2D uRingTex;
        uniform vec3 uRingCenter;
        uniform vec3 uRingNormal;
        uniform float uRingInner;
        uniform float uRingOuter;
        uniform vec3 uSunPos;`
      )
      .replace(
        '#include <opaque_fragment>',
        `
        {
          vec3 rsToSun = normalize(uSunPos - vRingWorldPos);
          float rsDenom = dot(rsToSun, uRingNormal);
          float ringShade = 1.0;
          if (abs(rsDenom) > 1e-4) {
            float rsT = dot(uRingCenter - vRingWorldPos, uRingNormal) / rsDenom;
            if (rsT > 0.0) {
              vec3 rsHit = vRingWorldPos + rsToSun * rsT;
              float rsU = (length(rsHit - uRingCenter) - uRingInner) / (uRingOuter - uRingInner);
              if (rsU > 0.0 && rsU < 1.0) {
                ringShade = 1.0 - texture2D(uRingTex, vec2(rsU, 0.5)).a * 0.88;
              }
            }
          }
          outgoingLight *= ringShade;
        }
        #include <opaque_fragment>`
      );
  });
}

/** Earth: ocean specular map, night-side city lights blended by sun direction. */
export interface EarthUniforms {
  uSpecMap: { value: THREE.Texture };
  uNightMap: { value: THREE.Texture };
  uSunViewPos: { value: THREE.Vector3 };
}

export function applyEarthShading(material: THREE.MeshStandardMaterial, u: EarthUniforms) {
  patchMaterial(material, 'earth', shader => {
    Object.assign(shader.uniforms, u);

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform sampler2D uSpecMap;
        uniform sampler2D uNightMap;
        uniform vec3 uSunViewPos;`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `float roughnessFactor = mix(0.92, 0.28, texture2D(uSpecMap, vMapUv).r);`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        {
          vec3 earthSunDir = normalize(uSunViewPos + vViewPosition);
          float earthNight = smoothstep(0.08, -0.18, dot(normal, earthSunDir));
          totalEmissiveRadiance += texture2D(uNightMap, vMapUv).rgb * earthNight * 2.2;
        }`
      );
  });
}

/** Gas giants: subtle shimmering of the cloud bands (differential jet-stream drift). */
export function applyBandWobble(material: THREE.MeshStandardMaterial, timeUniform: { value: number }) {
  patchMaterial(material, 'band-wobble', shader => {
    shader.uniforms.uBandTime = timeUniform;

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uBandTime;')
      .replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
          vec2 bandUv = vMapUv;
          bandUv.x += 0.0035 * sin(bandUv.y * 70.0 + uBandTime * 0.35)
                    + 0.0020 * sin(bandUv.y * 131.0 - uBandTime * 0.21);
          vec4 sampledDiffuseColor = texture2D(map, bandUv);
          diffuseColor *= sampledDiffuseColor;
        #endif`
      );
  });
}
