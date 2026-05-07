"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, ToneMapping, wrapEffect } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef } from "react";
import { BlendFunction, Effect, ToneMappingMode } from "postprocessing";
import * as THREE from "three";

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec2  uResolution;
varying vec2  vUv;

uniform float uDrag;
uniform float uFreqScl;
uniform float uWeightScl;
uniform float uFreq;
uniform float uHeightDiv;
uniform float uHorScale;
uniform float uOccSpeed;
uniform float uDxDet;
uniform float uTimeScl;
uniform float uWavRot;
uniform float uScrlSpeed;

uniform float uShininess;
uniform float uSpecStrength;
uniform float uDiffuseStr;
uniform float uAmbientStr;
uniform float uScatterStr;
uniform float uScatterPower;
uniform float uScatterScale;
uniform float uScatterDistort;
uniform float uFresnelF0;
uniform float uReflStrength;

uniform vec2  uSunRot;
uniform float uCamHeight;
uniform float uCamZ;
uniform float uLookY;
uniform float uLookZ;
uniform float uFov;

uniform vec3 uSunCol;
uniform vec3 uColDeep;
uniform vec3 uColMid;
uniform vec3 uColCrest;
uniform vec3 uScatterCol;
uniform vec3 uSkyBlue;
uniform vec3 uSkyHorizon;
uniform vec3 uSkyZenith;
uniform vec3 uHorizonHaze;
uniform vec3 uCloudCol;
uniform float uVibrancy;
uniform float uSpecTint;

#define STEPS 72.0
#define MDIST 42.0
#define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))
#define sat(a) clamp(a,0.0,1.0)

#define ITERS_TRACE 7
#define ITERS_NORM 16

vec2 scrollDir = vec2(-1.0, -1.0);

vec2 wavedx(vec2 wavPos, int iters, float t) {
    vec2 dx = vec2(0.0);
    vec2 wavDir = vec2(1.0, 0.0);
    float wavWeight = 1.0;
    wavPos += t * uScrlSpeed * scrollDir;
    wavPos *= uHorScale;
    float wavFreq = uFreq;
    float wavTime = uOccSpeed * t;
    for (int i = 0; i < ITERS_NORM; i++) {
        if (i >= iters) break;
        wavDir *= rot(uWavRot);
        float phase = fract(sin(float(i) * 127.1) * 43758.5453) * 6.2831;
        float x = dot(wavDir, wavPos) * wavFreq + wavTime + phase;
        float result = exp(sin(x) - 1.0) * cos(x);
        result *= wavWeight;
        dx += result * wavDir / pow(wavWeight, uDxDet);
        wavFreq *= uFreqScl;
        wavTime *= uTimeScl;
        wavPos -= wavDir * result * uDrag;
        wavWeight *= uWeightScl;
    }
    float wavSum = -(pow(uWeightScl, float(iters)) - 1.0) * uHeightDiv;
    return dx / pow(wavSum, 1.0 - uDxDet);
}

float wave(vec2 wavPos, int iters, float t) {
    float wav = 0.0;
    vec2 wavDir = vec2(1.0, 0.0);
    float wavWeight = 1.0;
    wavPos += t * uScrlSpeed * scrollDir;
    wavPos *= uHorScale;
    float wavFreq = uFreq;
    float wavTime = uOccSpeed * t;
    for (int i = 0; i < ITERS_NORM; i++) {
        if (i >= iters) break;
        wavDir *= rot(uWavRot);
        float phase = fract(sin(float(i) * 127.1) * 43758.5453) * 6.2831;
        float x = dot(wavDir, wavPos) * wavFreq + wavTime + phase;
        float w = exp(sin(x) - 1.0) * wavWeight;
        wav += w;
        wavFreq *= uFreqScl;
        wavTime *= uTimeScl;
        wavPos -= wavDir * w * uDrag * cos(x);
        wavWeight *= uWeightScl;
    }
    float wavSum = -(pow(uWeightScl, float(iters)) - 1.0) * uHeightDiv;
    return wav / wavSum;
}

vec3 getNorm(vec3 p) {
    vec2 wav = -wavedx(p.xz, ITERS_NORM, uTime);
    return normalize(vec3(wav.x, 1.0, wav.y));
}

float map(vec3 p) {
    p.y -= wave(p.xz, ITERS_TRACE, uTime);
    return p.y;
}

vec3 sky(vec3 rd) {
    vec3 rdo = rd;
    float up = max(rdo.y, 0.0);

    vec3 col = mix(uSkyHorizon, uSkyZenith, pow(up, 0.45));
    col += uHorizonHaze * pow(max(1.0 - up, 0.0), 8.0) * 0.45;
    col = mix(vec3(1.0), col, smoothstep(-0.5, 0.25, rdo.y));

    rd.yz *= rot(uSunRot.y);
    rd.xz *= rot(uSunRot.x);
    float px = 1.5 / min(uResolution.x, uResolution.y);
    float sFade = 2.5 / min(uResolution.x, uResolution.y);
    float zFade = rd.z * 0.5 + 0.5;
    float a = length(rd.xy);
    float rad = 0.055;

    vec3 sun = smoothstep(a - px - sFade, a + px + sFade, rad) * uSunCol * zFade * 4.0;
    col += sun;
    col += rad / (rad + pow(a, 1.5)) * uSunCol * zFade * 0.45;

    return col;
}

float fresnelSchlick(vec3 viewDir, vec3 normal) {
    float cosTheta = max(dot(normal, viewDir), 0.0);
    return uFresnelF0 + (1.0 - uFresnelF0) * pow(1.0 - cosTheta, 5.0);
}

void main() {
    vec2 fragCoord = vUv * uResolution;
    vec2 uv = (fragCoord - 0.5 * uResolution.xy) / min(uResolution.y, uResolution.x);
    vec3 col = vec3(0.0);

    vec3 ro = vec3(0.0, uCamHeight, uCamZ);
    vec3 lk = vec3(0.0, uLookY, uLookZ);
    vec3 f = normalize(lk - ro);
    vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
    vec3 rd = normalize(f * uFov + uv.x * r + uv.y * cross(f, r));

    float dO = 0.0;
    bool hit = false;
    float d = 0.0;
    vec3 p = ro;

    float tPln = -(ro.y - 2.0) / rd.y;
    if (tPln > 0.0) {
        dO += tPln;
        for (float i = 0.0; i < STEPS; i++) {
            p = ro + rd * dO;
            d = map(p);
            dO += d;
            if (abs(d) < 0.01 || i > STEPS - 2.0) {
                hit = true;
                break;
            }
            if (dO > MDIST) {
                dO = MDIST;
                break;
            }
        }
    }

    vec3 skyrd = sky(rd);

    if (hit) {
        vec3 n = getNorm(p);
        vec3 viewDir = normalize(ro - p);

        vec3 sunDir = vec3(0.0, 1.0, 0.7);
        sunDir.xz *= rot(-uSunRot.x);
        sunDir = normalize(sunDir);

        float waveH = wave(p.xz, ITERS_TRACE, uTime);
        float heightFrac = sat(waveH);

        vec3 halfV = normalize(sunDir + viewDir);
        float spec = pow(max(dot(n, halfV), 0.0), uShininess);
        vec3 specTintCol = mix(uSunCol, normalize(uColCrest + 0.01) * length(uSunCol), uSpecTint);
        vec3 specular = spec * specTintCol;

        float sunDot = max(dot(n, sunDir), 0.0);
        vec3 sunLight = sunDot * uSunCol;
        float skyDot = max(dot(n, vec3(0.0, 1.0, 0.0)), 0.0);
        vec3 skyLight = skyDot * uSkyBlue;
        vec3 lighting = 0.15 * sunLight + 0.12 * skyLight;

        vec3 diffuseCol = uDiffuseStr * mix(uColMid, uColCrest, heightFrac);
        vec3 ambientCol = 0.5 * diffuseCol;
        vec3 ambMix = mix(ambientCol, 0.5 * uScatterCol, pow(0.5 + 0.5 * rd.y, 2.0));
        ambMix = max(ambMix, uColMid * 0.15);

        vec3 result = lighting * diffuseCol;
        result += uAmbientStr * ambMix + uSpecStrength * specular;

        vec3 sssH = normalize(-sunDir + n * uScatterDistort);
        float vDotH = pow(sat(dot(rd, -sssH)), uScatterPower) * uScatterScale;
        float distFade = pow(1.0 - sat(dO / MDIST), 4.0);
        result += uScatterStr * distFade * heightFrac * vDotH * uScatterCol;

        vec3 rfl = reflect(rd, n);
        rfl.y = abs(rfl.y);
        vec3 reflCol = sky(rfl);
        float fres = sat(fresnelSchlick(viewDir, n));
        result = mix(result, uReflStrength * reflCol, fres);

        float lum = dot(result, vec3(0.2126, 0.7152, 0.0722));
        result = max(mix(vec3(lum), result, 1.0 + uVibrancy), 0.0);
        col = result;
    } else {
        col = skyrd;
    }

    gl_FragColor = vec4(col, 1.0);
}
`;

const starburstVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const starburstBrightFragmentShader = `
uniform sampler2D inputTexture;
uniform float threshold;
uniform float knee;
varying vec2 vUv;

void main() {
  vec4 c = texture2D(inputTexture, vUv);
  float lum = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
  float mask = smoothstep(threshold - knee, threshold + knee, lum);
  gl_FragColor = vec4(c.rgb * mask, 1.0);
}
`;

const starburstStreakFragmentShader = `
uniform sampler2D inputTexture;
uniform vec2 direction;
uniform float stride;
uniform float attenuation;
uniform float spokeFalloff;
varying vec2 vUv;

#define NUM_TAPS 12

void main() {
  vec4 color = vec4(0.0);

  for (int i = 1; i <= NUM_TAPS; i++) {
    float fi = float(i);
    float weight = pow(attenuation, fi * spokeFalloff);
    vec2 offset = direction * fi * stride;
    color += texture2D(inputTexture, vUv + offset) * weight;
    color += texture2D(inputTexture, vUv - offset) * weight;
  }

  gl_FragColor = color;
}
`;

const starburstCopyFragmentShader = `
uniform sampler2D inputTexture;
uniform float weight;
varying vec2 vUv;

void main() {
  gl_FragColor = texture2D(inputTexture, vUv) * weight;
}
`;

const starburstEffectShader = `
uniform sampler2D streakMap;
uniform float intensity;
uniform float chromaticOffset;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float r = texture2D(streakMap, uv + vec2(chromaticOffset, chromaticOffset * 0.5)).r;
  float g = texture2D(streakMap, uv).g;
  float b = texture2D(streakMap, uv - vec2(chromaticOffset, chromaticOffset * 0.5)).b;
  vec3 col = vec3(r, g, b) * vec3(1.18, 1.06, 0.82);
  outputColor = vec4(col * intensity, 1.0);
}
`;

const grainEffectShader = `
uniform float intensity;
uniform float speed;
uniform float mean;
uniform float variance;
uniform float time;
uniform int grainBlend;

vec3 channel_mix(vec3 a, vec3 b, vec3 w) {
  return vec3(mix(a.r, b.r, w.r), mix(a.g, b.g, w.g), mix(a.b, b.b, w.b));
}

float gaussian(float z, float u, float o) {
  return (1.0 / (o * sqrt(2.0 * 3.1415))) * exp(-(((z - u) * (z - u)) / (2.0 * (o * o))));
}

vec3 screen(vec3 a, vec3 b, float w) {
  return mix(a, vec3(1.0) - (vec3(1.0) - a) * (vec3(1.0) - b), w);
}

vec3 overlay(vec3 a, vec3 b, float w) {
  return mix(a, channel_mix(
    2.0 * a * b,
    vec3(1.0) - 2.0 * (vec3(1.0) - a) * (vec3(1.0) - b),
    step(vec3(0.5), a)
  ), w);
}

vec3 soft_light(vec3 a, vec3 b, float w) {
  return mix(a, pow(a, pow(vec3(2.0), 2.0 * (vec3(0.5) - b))), w);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float t = time * speed;
  float seed = dot(uv, vec2(12.9898, 78.233));
  float noise = fract(sin(seed) * 43758.5453 + t);
  noise = gaussian(noise, mean, variance * variance);

  vec3 grain = vec3(noise) * (1.0 - inputColor.rgb);
  float w = intensity;
  vec3 col = inputColor.rgb;

  if (grainBlend == 0) {
    col += grain * w;
  } else if (grainBlend == 1) {
    col = screen(col, grain, w);
  } else if (grainBlend == 2) {
    col = overlay(col, grain, w);
  } else if (grainBlend == 3) {
    col = soft_light(col, grain, w);
  } else if (grainBlend == 4) {
    col = max(col, grain * w);
  }

  outputColor = vec4(col, inputColor.a);
}
`;

function createHalfFloatTarget(width: number, height: number) {
  return new THREE.WebGLRenderTarget(width, height, {
    depthBuffer: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    type: THREE.HalfFloatType,
  });
}

class StarburstEffectImpl extends Effect {
  intensity: number;
  threshold: number;
  attenuation: number;
  spokeAngle: number;
  chromaticOffset: number;
  rotationSpeed: number;
  wobbleAmount: number;
  coreBoost: number;
  streakStride: number;
  private elapsedTime = 0;
  private directions = Array.from({ length: 4 }, () => new THREE.Vector2());
  private brightRT = createHalfFloatTarget(1, 1);
  private streakRT = createHalfFloatTarget(1, 1);
  private accumRT = createHalfFloatTarget(1, 1);
  private brightMaterial = new THREE.ShaderMaterial({
    vertexShader: starburstVertexShader,
    fragmentShader: starburstBrightFragmentShader,
    uniforms: {
      inputTexture: { value: null },
      threshold: { value: 1 },
      knee: { value: 0.05 },
    },
    depthTest: false,
    depthWrite: false,
  });
  private streakMaterial = new THREE.ShaderMaterial({
    vertexShader: starburstVertexShader,
    fragmentShader: starburstStreakFragmentShader,
    uniforms: {
      inputTexture: { value: null },
      direction: { value: new THREE.Vector2() },
      stride: { value: 1.8 },
      attenuation: { value: 0.7 },
      spokeFalloff: { value: 1 },
    },
    depthTest: false,
    depthWrite: false,
  });
  private copyMaterial = new THREE.ShaderMaterial({
    vertexShader: starburstVertexShader,
    fragmentShader: starburstCopyFragmentShader,
    uniforms: {
      inputTexture: { value: null },
      weight: { value: 1 },
    },
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    transparent: true,
  });
  private quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.brightMaterial);
  private fsScene = new THREE.Scene();
  private fsCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private texelSize = new THREE.Vector2(1, 1);
  private readonly spokeWeights = [0.4, 0.25, 0.35, 0.2];
  private readonly spokeFalloffs = [1, 1.4, 1.15, 1.6];

  constructor({
    intensity = 1.5,
    threshold = 1,
    attenuation = 0.7,
    spokeAngle = 0,
    chromaticOffset = 0.001,
    rotationSpeed = 0.15,
    wobbleAmount = 2,
    coreBoost = 3.5,
    streakStride = 1.8,
  } = {}) {
    super("StarburstEffect", starburstEffectShader, {
      blendFunction: BlendFunction.SCREEN,
      uniforms: new Map<string, THREE.Uniform<unknown>>([
        ["streakMap", new THREE.Uniform(null)],
        ["intensity", new THREE.Uniform(intensity)],
        ["chromaticOffset", new THREE.Uniform(chromaticOffset)],
      ]),
    });

    this.intensity = intensity;
    this.threshold = threshold;
    this.attenuation = attenuation;
    this.spokeAngle = spokeAngle;
    this.chromaticOffset = chromaticOffset;
    this.rotationSpeed = rotationSpeed;
    this.wobbleAmount = wobbleAmount;
    this.coreBoost = coreBoost;
    this.streakStride = streakStride;

    this.uniforms.get("streakMap")!.value = this.accumRT.texture;
    this.quad.frustumCulled = false;
    this.fsScene.add(this.quad);
  }

  private updateDirections() {
    const wobble = (this.wobbleAmount * Math.PI) / 180;
    const wobbleOffset = Math.sin(this.elapsedTime * this.rotationSpeed) * wobble;
    const angle = (this.spokeAngle * Math.PI) / 180;
    const spacing = Math.PI / 4;

    for (let i = 0; i < 4; i += 1) {
      const theta = angle + i * spacing + wobbleOffset;
      this.directions[i].set(Math.cos(theta), Math.sin(theta));
    }
  }

  private renderQuad(
    renderer: THREE.WebGLRenderer,
    material: THREE.ShaderMaterial,
    target: THREE.WebGLRenderTarget,
    clear = true,
  ) {
    const previousAutoClear = renderer.autoClear;
    renderer.autoClear = false;
    this.quad.material = material;
    renderer.setRenderTarget(target);
    if (clear) renderer.clear();
    renderer.render(this.fsScene, this.fsCamera);
    renderer.autoClear = previousAutoClear;
  }

  override update(renderer: THREE.WebGLRenderer, inputBuffer: THREE.WebGLRenderTarget, deltaTime?: number) {
    const currentTarget = renderer.getRenderTarget();
    const currentAutoClear = renderer.autoClear;

    this.elapsedTime += deltaTime ?? 0;
    this.updateDirections();

    this.brightMaterial.uniforms.inputTexture.value = inputBuffer.texture;
    this.brightMaterial.uniforms.threshold.value = this.threshold;
    this.renderQuad(renderer, this.brightMaterial, this.brightRT, true);

    this.copyMaterial.uniforms.inputTexture.value = this.brightRT.texture;
    this.copyMaterial.uniforms.weight.value = this.coreBoost;
    this.renderQuad(renderer, this.copyMaterial, this.accumRT, true);

    for (let i = 0; i < 4; i += 1) {
      this.streakMaterial.uniforms.inputTexture.value = this.brightRT.texture;
      this.streakMaterial.uniforms.direction.value.copy(this.directions[i]).multiply(this.texelSize);
      this.streakMaterial.uniforms.stride.value = this.streakStride;
      this.streakMaterial.uniforms.attenuation.value = this.attenuation;
      this.streakMaterial.uniforms.spokeFalloff.value = this.spokeFalloffs[i];
      this.renderQuad(renderer, this.streakMaterial, this.streakRT, true);

      this.copyMaterial.uniforms.inputTexture.value = this.streakRT.texture;
      this.copyMaterial.uniforms.weight.value = this.spokeWeights[i];
      this.renderQuad(renderer, this.copyMaterial, this.accumRT, false);
    }

    this.uniforms.get("intensity")!.value = this.intensity;
    this.uniforms.get("chromaticOffset")!.value = this.chromaticOffset;

    renderer.setRenderTarget(currentTarget);
    renderer.autoClear = currentAutoClear;
  }

  override setSize(width: number, height: number) {
    this.brightRT.setSize(width, height);
    const halfWidth = Math.max(1, Math.floor(width / 2));
    const halfHeight = Math.max(1, Math.floor(height / 2));
    this.streakRT.setSize(halfWidth, halfHeight);
    this.accumRT.setSize(halfWidth, halfHeight);
    this.texelSize.set(1 / halfWidth, 1 / halfHeight);
  }

  override initialize(_renderer: THREE.WebGLRenderer, _alpha: boolean, frameBufferType: number) {
    if (frameBufferType === undefined) return;
    const textureType = frameBufferType as THREE.TextureDataType;
    this.brightRT.texture.type = textureType;
    this.streakRT.texture.type = textureType;
    this.accumRT.texture.type = textureType;
  }

  override dispose() {
    this.brightRT.dispose();
    this.streakRT.dispose();
    this.accumRT.dispose();
    this.brightMaterial.dispose();
    this.streakMaterial.dispose();
    this.copyMaterial.dispose();
    this.quad.geometry.dispose();
    super.dispose();
  }
}

class GrainEffectImpl extends Effect {
  intensity: number;
  speed: number;
  mean: number;
  variance: number;
  grainBlend: number;
  private elapsedTime = 0;

  constructor({ grainBlend = 2, intensity = 0.3, speed = 2, mean = 0, variance = 0.4 } = {}) {
    super("GrainEffect", grainEffectShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform<unknown>>([
        ["intensity", new THREE.Uniform(intensity)],
        ["speed", new THREE.Uniform(speed)],
        ["mean", new THREE.Uniform(mean)],
        ["variance", new THREE.Uniform(variance)],
        ["time", new THREE.Uniform(0)],
        ["grainBlend", new THREE.Uniform(grainBlend)],
      ]),
    });

    this.intensity = intensity;
    this.speed = speed;
    this.mean = mean;
    this.variance = variance;
    this.grainBlend = grainBlend;
  }

  override update(_renderer: THREE.WebGLRenderer, _inputBuffer: THREE.WebGLRenderTarget, deltaTime?: number) {
    this.elapsedTime += deltaTime ?? 0;
    this.uniforms.get("time")!.value = this.elapsedTime;
    this.uniforms.get("intensity")!.value = this.intensity;
    this.uniforms.get("speed")!.value = this.speed;
    this.uniforms.get("mean")!.value = this.mean;
    this.uniforms.get("variance")!.value = this.variance;
    this.uniforms.get("grainBlend")!.value = this.grainBlend;
  }
}

const Starburst = wrapEffect(StarburstEffectImpl);
const Grain = wrapEffect(GrainEffectImpl);

function HeroWaterPlane({ isActive, onReady }: { isActive: boolean; onReady?: () => void }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const readyRef = useRef(false);

  const uniforms = useMemo<{ [uniform: string]: THREE.IUniform }>(() => {
    return {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uDrag: { value: 0.98 },
      uFreq: { value: 0.6 },
      uFreqScl: { value: 1.28 },
      uWeightScl: { value: 0.83 },
      uHeightDiv: { value: 2.5 },
      uHorScale: { value: 0.79 },
      uOccSpeed: { value: 1.48 },
      uDxDet: { value: 0 },
      uTimeScl: { value: 1.09 },
      uWavRot: { value: 2.48 },
      uScrlSpeed: { value: 1.58 },
      uShininess: { value: 1839 },
      uSpecStrength: { value: 1.53 },
      uDiffuseStr: { value: 0.45 },
      uAmbientStr: { value: 0.48 },
      uScatterStr: { value: 3 },
      uScatterPower: { value: 5.1 },
      uScatterScale: { value: 2 },
      uScatterDistort: { value: 0.94 },
      uFresnelF0: { value: 0.05 },
      uReflStrength: { value: 1.14 },
      uSunRot: { value: new THREE.Vector2(-3.14, 0.11) },
      uCamHeight: { value: 15 },
      uCamZ: { value: 3.9 },
      uLookY: { value: 0.9 },
      uLookZ: { value: -6 },
      uFov: { value: 0.8 },
      uSunCol: { value: new THREE.Vector3(242 / 255, 235 / 255, 204 / 255) },
      uColDeep: { value: new THREE.Vector3(0.008, 0.065, 0.085) },
      uColMid: { value: new THREE.Vector3(9 / 255, 31 / 255, 36 / 255) },
      uColCrest: { value: new THREE.Vector3(36 / 255, 69 / 255, 69 / 255) },
      uScatterCol: { value: new THREE.Vector3(18 / 255, 107 / 255, 97 / 255) },
      uSkyBlue: { value: new THREE.Vector3(26 / 255, 89 / 255, 199 / 255) },
      uSkyHorizon: { value: new THREE.Vector3(0.52, 0.68, 0.88) },
      uSkyZenith: { value: new THREE.Vector3(0.2, 0.38, 0.75) },
      uHorizonHaze: { value: new THREE.Vector3(0.28, 0.2, 0.08) },
      uCloudCol: { value: new THREE.Vector3(0.9, 0.88, 0.82) },
      uVibrancy: { value: 0.7 },
      uSpecTint: { value: 0 },
    };
  }, []);

  const { size } = useThree();

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;

    material.uniforms.uResolution.value.set(size.width, size.height);

    const mobile = window.innerWidth <= 768;
    const tablet = window.innerWidth <= 1200 && window.innerWidth > 768;

    material.uniforms.uCamHeight.value = mobile ? 10.5 : tablet ? 12 : 15;
    material.uniforms.uCamZ.value = 3.9;
    material.uniforms.uLookY.value = mobile || tablet ? -5.6 : 0.9;
    material.uniforms.uLookZ.value = -6;
    material.uniforms.uFov.value = 0.8;
  }, [size]);

  useEffect(() => {
    if (readyRef.current) return;
    readyRef.current = true;

    const timeoutId = window.setTimeout(() => {
      onReady?.();
    }, 100);

    return () => window.clearTimeout(timeoutId);
  }, [onReady]);

  useFrame((state) => {
    if (!isActive || !materialRef.current) return;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    materialRef.current.uniforms.uResolution.value.set(size.width, size.height);
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

function InvalidateLoop({ fps = 60, active = true }: { fps?: number; active?: boolean }) {
  const { invalidate } = useThree();

  useEffect(() => {
    if (!active) return;

    const interval = 1000 / fps;
    let rafId = 0;
    let lastFrame = 0;

    const loop = (time: number) => {
      if (time - lastFrame >= interval) {
        lastFrame = time;
        invalidate();
      }

      rafId = window.requestAnimationFrame(loop);
    };

    rafId = window.requestAnimationFrame(loop);

    return () => window.cancelAnimationFrame(rafId);
  }, [active, fps, invalidate]);

  return null;
}

export function DreamlikeHeroCanvas({ isInView = true, onShaderReady }: { isInView?: boolean; onShaderReady?: () => void }) {
  const dpr = typeof window === "undefined" ? 1.5 : Math.max(1.5, Math.min(window.devicePixelRatio, 2));

  return (
    <div style={{ width: "100%", height: "100%", willChange: "transform", contain: "paint layout" }}>
      <Canvas
        gl={{ antialias: false, toneMapping: THREE.NoToneMapping, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 1], fov: 70 }}
        dpr={dpr}
        frameloop="demand"
        events={undefined}
        style={{ width: "100%", height: "100%", pointerEvents: "none", touchAction: "pan-y" }}
      >
        <InvalidateLoop fps={60} active={isInView} />
        <HeroWaterPlane isActive={isInView} onReady={onShaderReady} />
        <EffectComposer multisampling={0} autoClear={false} enableNormalPass={false} frameBufferType={THREE.HalfFloatType}>
          <Starburst intensity={1.5} threshold={1} attenuation={0.7} spokeAngle={0} chromaticOffset={0.001} coreBoost={3.5} streakStride={1.8} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Grain intensity={0.3} speed={2} mean={0} variance={0.4} grainBlend={2} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
