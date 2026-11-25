// The hero stage: a wall of code with a person behind it. Every character is a particle.
// Scrolling flips the characters, top to bottom, into a portrait drawn in code, and then
// the photograph itself comes through from the face outwards. The pointer pushes the
// characters apart, the way a hand parts a curtain, and a click sends a ripple through them.
// Plain WebGL: one pass for the backdrop and the photograph, one for the characters.

import { CODE_LINES, tokens } from './code-lines.js';

const FIGURE_URL = 'assets/img/hero-figure.webp';
const FIGURE_ASPECT = 896 / 850; // the texture is square; this is the shape it is shown at
const FACE = [0.49, 0.41]; // centre of the face inside the figure image
const ATLAS_COLS = 16;
const ATLAS_ROWS = 8;
const ATLAS_CELL = 64;
const GLYPHS = 94; // printable ASCII, 33 to 126; glyph 0 is a blank
const BAND = 0.17; // how much of the stage is mid-flip at once
const TOKEN_WEIGHT = { comment: 0.22, string: 0.8, keyword: 1, number: 0.85, punctuation: 0.42, plain: 0.6 };

const BACKDROP_VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const BACKDROP_FRAGMENT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uFigure;
uniform vec2 uRes;
uniform vec4 uBox;
uniform vec2 uFocus;
uniform vec3 uPointer;
uniform vec4 uWave;
uniform float uReveal;
uniform float uScan;
uniform float uBand;
uniform float uTime;
uniform float uReady;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  float unit = uRes.y;

  // Near-black indigo, a little lighter behind the figure.
  float fromFocus = length((p - uFocus) / unit);
  vec3 color = mix(vec3(0.046, 0.054, 0.190), vec3(0.016, 0.018, 0.062), smoothstep(0.0, 1.05, fromFocus));

  vec2 fuv = (p - uBox.xy) / uBox.zw;
  float inside = step(0.0, fuv.x) * step(fuv.x, 1.0) * step(0.0, fuv.y) * step(fuv.y, 1.0);
  vec4 figure = texture2D(uFigure, clamp(fuv, 0.0, 1.0)) * inside * uReady;
  float matte = smoothstep(0.5, 0.97, figure.a);
  float lum = figure.r;
  // A soft copy of the figure's outline: the glow of someone standing behind the code.
  float halo = texture2D(uFigure, clamp(fuv, 0.0, 1.0), 4.6).a * inside * uReady;

  float grain = noise(p / unit * 5.0 + uTime * 0.25);

  // The opening the pointer makes in the code.
  float away = length(p - uPointer.xy);
  float radius = max(uPointer.z, 0.001);
  float open = smoothstep(6.0, 34.0, uPointer.z);
  float opening = smoothstep(radius, radius * 0.72, away + (grain - 0.5) * radius * 0.25) * step(1.0, uPointer.z);

  // The photograph arriving, from the face outwards.
  float arrived = smoothstep(0.0, 0.22, uReveal * 1.9 - fromFocus + (grain - 0.5) * 0.14);

  vec3 xray = mix(vec3(0.03, 0.04, 0.22), vec3(0.40, 0.47, 1.0), smoothstep(0.02, 0.62, lum));
  xray = mix(xray, vec3(0.93, 0.95, 1.0), smoothstep(0.55, 0.95, lum));
  vec3 natural = vec3(pow(lum, 0.92)) * vec3(0.97, 0.98, 1.03);
  vec3 photo = mix(xray, natural, arrived);

  color += vec3(0.11, 0.14, 0.60) * halo * (0.42 + 0.4 * arrived);
  color = mix(color, photo, max(opening, arrived) * matte);

  // Light: around the pointer, along a ripple, and where the characters are flipping.
  float bloom = exp(-pow(away / (radius * 2.4), 2.0)) * open;
  float rim = exp(-pow((away - radius) / (radius * 0.3), 2.0)) * open;
  color += vec3(0.30, 0.36, 1.0) * bloom * 0.2 + vec3(0.62, 0.68, 1.0) * rim * 0.2;
  float ring = exp(-pow((length(p - uWave.xy) - uWave.z) / (unit * 0.045), 2.0)) * uWave.w;
  color += vec3(0.45, 0.52, 1.0) * ring * 0.3;
  float along = (p.y + p.x * 0.16) / (uRes.y + uRes.x * 0.16);
  float flipping = exp(-pow((along * 0.84 + 0.08 - (uScan - uBand * 0.5)) / (uBand * 0.42), 2.0));
  flipping *= smoothstep(0.0, 0.06, uScan) * (1.0 - smoothstep(1.0, 1.0 + uBand, uScan));
  color += vec3(0.20, 0.25, 0.9) * flipping * 0.15;

  vec2 c = vUv - 0.5;
  color *= 1.0 - dot(c, c) * 0.5;
  color += (hash(p + fract(uTime) * 100.0) - 0.5) * 0.022;
  gl_FragColor = vec4(color, 1.0);
}`;

const GLYPH_VERTEX = `
attribute vec2 aHome;
attribute vec3 aMove;
attribute vec4 aInfo;
attribute vec3 aTone;
uniform vec2 uRes;
uniform vec2 uFocus;
uniform float uRatio;
uniform float uCell;
uniform float uScan;
uniform float uBand;
uniform float uReveal;
uniform float uIntro;
uniform float uTime;
uniform float uMaxPoint;
varying vec2 vCell;
varying vec4 vColor;
varying vec3 vShape;

const float PI = 3.14159265;
const float TURNS = 3.0;

void main() {
  float seed = aInfo.x;
  float weight = aInfo.w;
  float tone = aTone.x;
  float matte = aTone.y;
  float heat = aMove.z;

  // The flip travels down the stage on a slight slant, ragged at its edge, a word at a time.
  // Each character turns over three times: its code face, two passing faces, then its place
  // in the portrait.
  float along = (aHome.y + aHome.x * 0.16) / (uRes.y + uRes.x * 0.16);
  float f = clamp((uScan - along * 0.84 - aTone.z * 0.16) / uBand, 0.0, 1.0);
  float eased = f * f * (3.0 - 2.0 * f);
  float face = floor(eased * TURNS + 0.5);
  float glyph = aInfo.y;
  if (face > TURNS - 0.5) glyph = aInfo.z;
  else if (face > 0.5) glyph = 1.0 + floor(fract(seed * 91.7 + face * 0.37) * 93.99);
  vCell = vec2(mod(glyph, 16.0), floor(glyph / 16.0));
  float side = step(TURNS - 0.5, face);
  float mid = sin(f * PI);

  // Where the photograph has come through, the characters over the figure drift off.
  vec2 fromFace = aHome - uFocus;
  float reach = length(fromFace) / uRes.y;
  float gone = smoothstep(0.0, 0.22, uReveal * 1.9 - reach - seed * 0.18) * smoothstep(0.2, 0.6, matte);

  // As code: one blue, brighter for keywords, a touch brighter where someone stands behind it.
  float twinkle = 0.86 + 0.14 * sin(uTime * 1.7 + seed * 50.0);
  vec3 codeColor = mix(vec3(0.36, 0.42, 1.0), vec3(0.72, 0.77, 1.0), weight);
  float codeAlpha = mix(0.4, 0.92, weight) * twinkle * mix(0.74, 1.25, matte);

  // As portrait: the tone of the photograph decides the colour and the strength. Each
  // character also lights the square behind it, so the tones join up into a picture.
  vec3 ink = mix(vec3(0.20, 0.24, 0.74), vec3(0.50, 0.57, 1.0), smoothstep(0.0, 0.5, tone));
  ink = mix(ink, vec3(0.97, 0.98, 1.0), smoothstep(0.42, 0.95, tone));
  vec3 portraitColor = mix(codeColor, ink, matte);
  float portraitAlpha = mix(codeAlpha * 0.45, mix(0.42, 1.0, tone), matte);

  vec3 color = mix(codeColor, portraitColor, side);
  float alpha = mix(codeAlpha, portraitAlpha, side);
  float backing = side * matte * pow(tone, 1.5) * 0.9;

  // Characters that are turning, or being pushed, burn bright. Edge-on, a turning
  // character fades instead of collapsing into a line.
  float squash = abs(cos(eased * TURNS * PI));
  float hot = clamp(mid * 0.7 + heat, 0.0, 1.0);
  color = mix(color, mix(vec3(0.80, 0.84, 1.0), vec3(1.0), heat), clamp(mid * 0.6 + heat, 0.0, 1.0) * 0.85);
  alpha = mix(alpha, 1.0, hot * 0.9) * smoothstep(0.04, 0.45, squash);

  // On arrival the code writes itself down the stage.
  float written = smoothstep(0.0, 0.25, uIntro * 1.45 - along - seed * 0.2);
  alpha *= (1.0 - gone) * written;
  backing *= (1.0 - gone) * written;

  vColor = vec4(color, alpha);
  vShape = vec3(max(squash, 0.05), backing, hot);

  vec2 drift = normalize(fromFace + 0.001) * gone * gone * uCell * (1.5 + seed * 5.0);
  vec2 p = aHome + aMove.xy + drift;
  gl_Position = vec4(p.x / uRes.x * 2.0 - 1.0, 1.0 - p.y / uRes.y * 2.0, 0.0, 1.0);
  float size = uCell * (1.0 + mid * 0.4 + heat * 0.55) * (1.0 - gone * 0.4);
  gl_PointSize = min(size * uRatio, uMaxPoint);
}`;

const GLYPH_FRAGMENT = `
precision mediump float;
uniform sampler2D uAtlas;
varying vec2 vCell;
varying vec4 vColor;
varying vec3 vShape;

void main() {
  vec2 q = gl_PointCoord - 0.5;
  q.y /= vShape.x;
  if (abs(q.y) > 0.5) discard;
  float ink = texture2D(uAtlas, (vCell + q + 0.5) / vec2(${ATLAS_COLS}.0, ${ATLAS_ROWS}.0)).r;
  float box = step(abs(q.x), 0.26) * step(abs(q.y), 0.46) * vShape.y;
  float a = max(ink * vColor.a, box);
  if (a < 0.004) discard;
  // The character sits brighter on its lit square.
  vec3 rgb = mix(vColor.rgb * 0.82, mix(vColor.rgb, vec3(1.0), 0.45 * step(0.01, vShape.y)), ink);
  gl_FragColor = vec4(rgb * a * (1.0 + vShape.z * 0.6), a);
}`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || 'shader failed to compile');
  }
  return shader;
}

function createProgram(gl, vertex, fragment) {
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || 'program failed to link');
  }
  const uniforms = {};
  for (let i = 0, n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i < n; i++) {
    const { name } = gl.getActiveUniform(program, i);
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  const attributes = {};
  for (let i = 0, n = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES); i < n; i++) {
    const { name } = gl.getActiveAttrib(program, i);
    attributes[name] = gl.getAttribLocation(program, name);
  }
  return { program, uniforms, attributes };
}

// Every printable character, one per square. Also returns the characters ordered from the
// lightest to the heaviest, measured from the drawing itself, so the portrait can pick a
// character by how much ink a spot needs.
function drawAtlas() {
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_COLS * ATLAS_CELL;
  canvas.height = ATLAS_ROWS * ATLAS_CELL;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = `600 ${ATLAS_CELL * 0.75}px ui-monospace, "Cascadia Mono", Consolas, Menlo, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (let glyph = 1; glyph <= GLYPHS; glyph++) {
    const x = (glyph % ATLAS_COLS) * ATLAS_CELL + ATLAS_CELL / 2;
    const y = Math.floor(glyph / ATLAS_COLS) * ATLAS_CELL + ATLAS_CELL * 0.76;
    ctx.fillText(String.fromCharCode(32 + glyph), x, y);
  }
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const weights = [];
  for (let glyph = 1; glyph <= GLYPHS; glyph++) {
    const left = (glyph % ATLAS_COLS) * ATLAS_CELL;
    const top = Math.floor(glyph / ATLAS_COLS) * ATLAS_CELL;
    let sum = 0;
    for (let y = top; y < top + ATLAS_CELL; y += 2) {
      for (let x = left; x < left + ATLAS_CELL; x += 2) sum += pixels[(y * canvas.width + x) * 4];
    }
    weights.push({ glyph, sum });
  }
  weights.sort((a, b) => a.sum - b.sum);
  return { canvas, ramp: weights.map((entry) => entry.glyph) };
}

// A steady random number for a grid position, so a resize does not reshuffle the stage.
function random(col, row, salt) {
  const value = Math.sin(col * 127.1 + row * 311.7 + salt * 74.7) * 43758.5453;
  return value - Math.floor(value);
}

export function createHero(container, { reducedMotion = false } = {}) {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) return null;

  const atlas = drawAtlas();
  let backdrop;
  let glyphs;
  let quad;
  let staticBuffer;
  let moveBuffer;
  let atlasTexture;
  let figureTexture;
  let figureImage = null;
  let maxPoint = 64;

  function createTexture(mipmap) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
  }
  function loadFigure() {
    if (figureTexture) gl.deleteTexture(figureTexture);
    if (figureImage) {
      figureTexture = createTexture(true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, figureImage);
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // One clear pixel until the real picture arrives.
      figureTexture = createTexture(false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    }
  }
  // Everything that lives on the graphics card. Run again if the browser takes the context away.
  function setup() {
    backdrop = createProgram(gl, BACKDROP_VERTEX, BACKDROP_FRAGMENT);
    glyphs = createProgram(gl, GLYPH_VERTEX, GLYPH_FRAGMENT);
    quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    staticBuffer = gl.createBuffer();
    moveBuffer = gl.createBuffer();
    maxPoint = (gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) || [1, 64])[1];
    atlasTexture = createTexture(true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas.canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    figureTexture = null;
    loadFigure();
  }
  try {
    setup();
  } catch (error) {
    console.error(error);
    return null;
  }
  container.appendChild(canvas);

  const image = new Image();
  image.decoding = 'async';
  image.onload = () => {
    figureImage = image;
    if (gl.isContextLost()) return;
    loadFigure();
    build();
    if (!running) render();
  };
  image.src = FIGURE_URL;

  // The listing, as characters and weights, ready to be laid over the grid.
  const lines = CODE_LINES.map((line) => {
    const weights = [];
    tokens(line).forEach(({ text, kind }) => {
      for (let i = 0; i < text.length; i++) weights.push(TOKEN_WEIGHT[kind]);
    });
    // Which word each character belongs to, so a word can turn over as one.
    const words = [];
    let word = 0;
    for (let i = 0; i < line.length; i++) {
      if (line[i] !== ' ' && (i === 0 || line[i - 1] === ' ')) word += 1;
      words.push(word);
    }
    return { text: line, weights, words };
  });
  const COLUMN = 48; // characters given to each column of code
  const FIELDS = 9; // numbers stored for each character: place, seed, two glyphs, weight, tone, matte, turn

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const maxRatio = Math.min(window.devicePixelRatio || 1, coarse ? 2 : 1.75);
  let ratio = maxRatio;
  let width = 1;
  let height = 1;
  let cell = 15;
  let count = 0;
  const box = { x: 0, y: 0, w: 1, h: 1 };
  const focus = { x: 0, y: 0 };
  let home = new Float32Array(0);
  let seeds = new Float32Array(0);
  let move = new Float32Array(0);
  let velocity = new Float32Array(0);
  const sampler = document.createElement('canvas');
  const samplerContext = sampler.getContext('2d', { willReadFrequently: true });

  // Lays the characters out over the stage and reads the photograph's tone under each one.
  function build() {
    cell = width < 600 ? 12 : Math.max(13, Math.min(16, Math.round(height / 46)));
    const step = cell / 2;
    const cols = Math.ceil(width / step) + 1;
    const rows = Math.ceil(height / cell) + 1;
    const left = (width - cols * step) / 2;
    const top = (height - rows * cell) / 2;

    // The figure stands on the bottom edge: right of centre on wide stages, centred on tall ones.
    const aspect = width / height;
    if (aspect >= 1) {
      box.h = height;
      box.w = box.h * FIGURE_ASPECT;
      box.x = width * (0.5 + 0.15 * Math.min(1, (aspect - 1) / 0.8)) - box.w * FACE[0];
    } else {
      box.w = width * 1.34;
      box.h = box.w / FIGURE_ASPECT;
      box.x = width * 0.53 - box.w * FACE[0];
    }
    box.y = height - box.h;
    focus.x = box.x + box.w * FACE[0];
    focus.y = box.y + box.h * FACE[1];

    // Two samples each way per character, averaged, so thin features are not skipped over.
    let tones = null;
    if (figureImage) {
      sampler.width = cols * 2;
      sampler.height = rows * 2;
      samplerContext.clearRect(0, 0, sampler.width, sampler.height);
      samplerContext.imageSmoothingQuality = 'high';
      samplerContext.drawImage(figureImage, ((box.x - left) / step) * 2, ((box.y - top) / cell) * 2, (box.w / step) * 2, (box.h / cell) * 2);
      tones = samplerContext.getImageData(0, 0, sampler.width, sampler.height).data;
    }

    const blocks = Math.ceil(cols / COLUMN);
    const fixed = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const block = Math.floor(col / COLUMN);
        const line = lines[(row + block * 13 + (blocks - block) * 5) % lines.length];
        const at = col - block * COLUMN - 2;
        const code = at >= 0 && at < line.text.length ? line.text.charCodeAt(at) : 32;
        const glyph = code > 32 && code < 127 ? code - 32 : 0;
        const weight = glyph ? line.weights[at] : 0.5;
        const turn = glyph ? random(block * 57 + line.words[at], row, 3) : random(col, row, 3);

        let tone = 0;
        let matte = 0;
        if (tones) {
          let light = 0;
          for (let sy = 0; sy < 2; sy++) {
            for (let sx = 0; sx < 2; sx++) {
              const index = ((row * 2 + sy) * sampler.width + col * 2 + sx) * 4;
              light += tones[index];
              matte += tones[index + 3];
            }
          }
          matte /= 4 * 255;
          // Stretched so skin reaches the top of the range, with a floor that keeps the
          // dark hair and jumper faintly drawn instead of empty.
          const lum = Math.min(1, Math.max(0, (light / (4 * 255) - 0.03) / 0.66));
          tone = 0.1 + 0.9 * Math.pow(lum * lum * (3 - 2 * lum), 0.72);
        }
        if (!glyph && matte < 0.08) continue;

        // In the portrait, a spot that needs more light gets a heavier character.
        let portrait = glyph;
        if (matte >= 0.08) {
          const wobble = (random(col, row, 2) - 0.5) * 8;
          portrait = atlas.ramp[Math.min(GLYPHS - 1, Math.max(0, Math.round(Math.pow(tone, 0.9) * (GLYPHS - 1) + wobble)))];
        }
        fixed.push(left + (col + 0.5) * step, top + (row + 0.5) * cell, random(col, row, 1), glyph, portrait, weight, tone, matte, turn);
      }
    }

    count = fixed.length / FIELDS;
    home = new Float32Array(count * 2);
    seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      home[i * 2] = fixed[i * FIELDS];
      home[i * 2 + 1] = fixed[i * FIELDS + 1];
      seeds[i] = fixed[i * FIELDS + 2];
    }
    move = new Float32Array(count * 3);
    velocity = new Float32Array(count * 2);
    gl.bindBuffer(gl.ARRAY_BUFFER, staticBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fixed), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, moveBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, move, gl.DYNAMIC_DRAW);
  }

  function resize() {
    const nextWidth = container.clientWidth || 1;
    const nextHeight = container.clientHeight || 1;
    const changed = nextWidth !== width || nextHeight !== height;
    width = nextWidth;
    height = nextHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    if (changed) build();
    if (!running) render();
  }

  // Pointer, in stage pixels from the top-left corner. "r" is the size of the opening.
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, r: 0, inside: false, lastMove: -1e9, speed: 0 };
  const waves = [];
  const place = (event) => {
    const rect = container.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  };
  function onPointerMove(event) {
    [pointer.tx, pointer.ty] = place(event);
    pointer.lastMove = performance.now();
    if (!pointer.inside) {
      pointer.inside = true;
      // An opening that is already there glides over; a new one starts under the pointer.
      if (pointer.r < 4) {
        pointer.x = pointer.tx;
        pointer.y = pointer.ty;
      }
    }
  }
  function onPointerLeave() {
    pointer.inside = false;
  }
  function onClick(event) {
    if (reducedMotion) return;
    const [x, y] = place(event);
    waves.push({ x, y, born: clock, radius: 0, strength: 1 });
    if (waves.length > 3) waves.shift();
  }
  container.addEventListener('pointermove', onPointerMove, { passive: true });
  container.addEventListener('pointerdown', onPointerMove, { passive: true });
  container.addEventListener('pointerleave', onPointerLeave, { passive: true });
  container.addEventListener('pointercancel', onPointerLeave, { passive: true });
  container.addEventListener('click', onClick);

  let target = reducedMotion ? 1 : 0;
  let progress = target;
  let intro = reducedMotion ? 1 : 0;
  let clock = 0;
  const scanOf = (value) => Math.min(1, Math.max(0, (value - 0.03) / 0.57)) * (1 + BAND);
  const revealOf = (value) => {
    const t = Math.min(1, Math.max(0, (value - 0.62) / 0.34));
    return t * t * (3 - 2 * t);
  };

  function movePointer(now, dt) {
    const base = Math.min(88, Math.max(42, Math.min(width, height) * 0.11));
    const quiet = now - pointer.lastMove > 2600;
    let wanted = 0;
    let follow = 16;
    if (pointer.inside && !(coarse && quiet)) {
      wanted = base * (1 + Math.min(0.35, pointer.speed / 2600));
    } else if (quiet && !reducedMotion && progress < 0.12) {
      // Left alone before any scrolling, a small opening drifts around the figure so the
      // idea is visible. Once the code is turning over, the scroll has the stage to itself.
      pointer.tx = focus.x + (Math.cos(clock * 0.5) * 0.17 + Math.cos(clock * 0.19) * 0.06) * height;
      pointer.ty = focus.y + (0.07 + Math.sin(clock * 0.67) * 0.17) * height;
      wanted = base * 0.6 * (0.55 + 0.45 * Math.sin(clock * 0.9));
      follow = 2.4;
      if (pointer.r < 2) {
        pointer.x = pointer.tx;
        pointer.y = pointer.ty;
      }
    }
    const ease = 1 - Math.exp(-follow * dt);
    const dx = (pointer.tx - pointer.x) * ease;
    const dy = (pointer.ty - pointer.y) * ease;
    pointer.x += dx;
    pointer.y += dy;
    pointer.speed += (Math.hypot(dx, dy) / Math.max(dt, 0.001) - pointer.speed) * 0.2;
    pointer.r += (wanted - pointer.r) * (1 - Math.exp(-(wanted > pointer.r ? 9 : 5) * dt));
    if (pointer.r < 0.5 && wanted === 0) pointer.r = 0;

    const far = Math.hypot(width, height);
    for (let i = waves.length - 1; i >= 0; i--) {
      const wave = waves[i];
      wave.radius = (clock - wave.born) * height * 1.3;
      wave.strength = Math.max(0, 1 - wave.radius / far);
      if (wave.strength <= 0) waves.splice(i, 1);
    }
  }

  // Each character is held to its place by a spring. The opening moves its resting point
  // outwards (those inside pile up on the rim), and a passing ripple gives it a kick.
  function simulate(dt) {
    const r = pointer.r;
    const open = r > 0.5;
    const reach = r * 3.4;
    const reach2 = reach * reach;
    const band = height * 0.09;
    for (let i = 0; i < count; i++) {
      const hx = home[i * 2];
      const hy = home[i * 2 + 1];
      const seed = seeds[i];
      let ox = move[i * 3];
      let oy = move[i * 3 + 1];
      let heat = move[i * 3 + 2];
      let vx = velocity[i * 2];
      let vy = velocity[i * 2 + 1];
      let tx = 0;
      let ty = 0;
      let glow = 0;
      let busy = false;

      if (open) {
        const dx = hx - pointer.x;
        const dy = hy - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < reach2) {
          busy = true;
          const d = Math.sqrt(d2) + 0.001;
          // A few strays are pushed less, and hang about inside the opening.
          const rr = seed > 0.955 ? r * 0.35 : r;
          const pushed = Math.sqrt(Math.sqrt(d2 * d2 + rr * rr * rr * rr));
          tx = (dx / d) * (pushed - d);
          ty = (dy / d) * (pushed - d);
          const edge = (pushed - r) / (r * 0.55);
          glow = Math.exp(-edge * edge) * Math.min(1, r / 40);
        }
      }
      for (let w = 0; w < waves.length; w++) {
        const wave = waves[w];
        const dx = hx - wave.x;
        const dy = hy - wave.y;
        const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
        const off = Math.abs(d - wave.radius);
        if (off < band) {
          busy = true;
          const push = (1 - off / band) * wave.strength;
          vx += (dx / d) * push * 2400 * dt;
          vy += (dy / d) * push * 2400 * dt;
          if (push * 0.9 > glow) glow = push * 0.9;
        }
      }

      if (!busy && heat < 0.004 && Math.abs(ox) + Math.abs(oy) < 0.02 && Math.abs(vx) + Math.abs(vy) < 0.5) {
        if (ox !== 0 || oy !== 0 || heat !== 0) {
          move[i * 3] = 0;
          move[i * 3 + 1] = 0;
          move[i * 3 + 2] = 0;
          velocity[i * 2] = 0;
          velocity[i * 2 + 1] = 0;
        }
        continue;
      }

      const omega = 9 + seed * 7;
      vx += (-omega * omega * (ox - tx) - omega * vx) * dt;
      vy += (-omega * omega * (oy - ty) - omega * vy) * dt;
      ox += vx * dt;
      oy += vy * dt;
      heat += (glow - heat) * (glow > heat ? 0.35 : 0.07);
      move[i * 3] = ox;
      move[i * 3 + 1] = oy;
      move[i * 3 + 2] = heat;
      velocity[i * 2] = vx;
      velocity[i * 2 + 1] = vy;
    }
  }

  function render() {
    if (gl.isContextLost()) return;
    const scan = scanOf(progress);
    const reveal = revealOf(progress);
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Backdrop and photograph.
    let u = backdrop.uniforms;
    gl.useProgram(backdrop.program);
    gl.disable(gl.BLEND);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(backdrop.attributes.aPos);
    gl.vertexAttribPointer(backdrop.attributes.aPos, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, figureTexture);
    gl.uniform1i(u.uFigure, 0);
    gl.uniform2f(u.uRes, width, height);
    gl.uniform4f(u.uBox, box.x, box.y, box.w, box.h);
    gl.uniform2f(u.uFocus, focus.x, focus.y);
    gl.uniform3f(u.uPointer, pointer.x, pointer.y, pointer.r);
    const wave = waves[waves.length - 1];
    gl.uniform4f(u.uWave, wave ? wave.x : 0, wave ? wave.y : 0, wave ? wave.radius : 0, wave ? wave.strength : 0);
    gl.uniform1f(u.uReveal, reveal);
    gl.uniform1f(u.uScan, scan);
    gl.uniform1f(u.uBand, BAND);
    gl.uniform1f(u.uTime, clock);
    gl.uniform1f(u.uReady, figureImage ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disableVertexAttribArray(backdrop.attributes.aPos);
    if (!count) return;

    // Characters.
    u = glyphs.uniforms;
    const a = glyphs.attributes;
    gl.useProgram(glyphs.program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindBuffer(gl.ARRAY_BUFFER, staticBuffer);
    gl.enableVertexAttribArray(a.aHome);
    gl.vertexAttribPointer(a.aHome, 2, gl.FLOAT, false, FIELDS * 4, 0);
    gl.enableVertexAttribArray(a.aInfo);
    gl.vertexAttribPointer(a.aInfo, 4, gl.FLOAT, false, FIELDS * 4, 8);
    gl.enableVertexAttribArray(a.aTone);
    gl.vertexAttribPointer(a.aTone, 3, gl.FLOAT, false, FIELDS * 4, 24);
    gl.bindBuffer(gl.ARRAY_BUFFER, moveBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, move);
    gl.enableVertexAttribArray(a.aMove);
    gl.vertexAttribPointer(a.aMove, 3, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
    gl.uniform1i(u.uAtlas, 0);
    gl.uniform2f(u.uRes, width, height);
    gl.uniform2f(u.uFocus, focus.x, focus.y);
    gl.uniform1f(u.uRatio, ratio);
    gl.uniform1f(u.uCell, cell);
    gl.uniform1f(u.uScan, scan);
    gl.uniform1f(u.uBand, BAND);
    gl.uniform1f(u.uReveal, reveal);
    gl.uniform1f(u.uIntro, intro);
    gl.uniform1f(u.uTime, clock);
    gl.uniform1f(u.uMaxPoint, maxPoint);
    gl.drawArrays(gl.POINTS, 0, count);
    gl.disableVertexAttribArray(a.aHome);
    gl.disableVertexAttribArray(a.aInfo);
    gl.disableVertexAttribArray(a.aTone);
    gl.disableVertexAttribArray(a.aMove);
  }

  // If the device cannot hold a smooth frame rate, lower the resolution rather than stutter.
  let quality = 0;
  let warmup = 45;
  let sampleCount = 0;
  let sampleTotal = 0;
  function watchFrameTime(ms) {
    if (quality >= 2 || ms > 200) return; // long gaps are a hidden tab, not a slow GPU
    if (warmup > 0) { warmup -= 1; return; }
    sampleTotal += ms;
    sampleCount += 1;
    if (sampleCount < 60) return;
    const average = sampleTotal / sampleCount;
    sampleTotal = 0;
    sampleCount = 0;
    if (average > 25) {
      quality += 1;
      ratio = quality === 1 ? Math.min(maxRatio, 1.15) : 0.85;
      warmup = 20;
      resize();
    }
  }

  const STEP = 1 / 60;
  let running = false;
  let started = false;
  let visible = true;
  let frame = 0;
  let last = 0;
  let backlog = 0;

  function tick(now) {
    frame = requestAnimationFrame(tick);
    watchFrameTime(now - last);
    const dt = Math.min((now - last) / 1000 || STEP, 0.1);
    last = now;
    clock += dt;

    progress += (target - progress) * (1 - Math.exp(-7 * dt));
    if (Math.abs(target - progress) < 0.0003) progress = target;
    intro = Math.min(1, intro + dt / 1.5);
    movePointer(now, dt);

    // The springs run at a fixed 60 steps a second, whatever the screen's refresh rate.
    backlog = Math.min(backlog + dt, STEP * 3);
    while (backlog >= STEP) {
      simulate(STEP);
      backlog -= STEP;
    }
    render();
  }

  function setRunning(next) {
    if (next && gl.isContextLost()) return;
    if (next === running) return;
    running = next;
    cancelAnimationFrame(frame);
    if (running) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  // A browser may take the graphics context away (a sleeping laptop, a busy GPU). Hold
  // still until it comes back, then build everything again.
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    setRunning(false);
  });
  canvas.addEventListener('webglcontextrestored', () => {
    try {
      setup();
    } catch (error) {
      console.error(error);
      return;
    }
    build();
    if (started && !reducedMotion) setRunning(visible && !document.hidden);
    else render();
  });

  const visibility = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (started && !reducedMotion) setRunning(visible && !document.hidden);
    },
    { rootMargin: '80px' },
  );
  visibility.observe(container);
  function onVisibilityChange() {
    if (started && !reducedMotion) setRunning(visible && !document.hidden);
  }
  document.addEventListener('visibilitychange', onVisibilityChange);

  return {
    start() {
      started = true;
      container.classList.add('is-live');
      // With reduced motion the stage is a still picture: the photograph, already shown.
      if (reducedMotion) render();
      else setRunning(visible && !document.hidden);
    },
    // 0 is the wall of code, 1 is the photograph. Driven by the page's scroll position.
    setProgress(value) {
      if (reducedMotion) return;
      target = Math.min(1, Math.max(0, value));
    },
    dispose() {
      setRunning(false);
      visibility.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      canvas.remove();
    },
  };
}
