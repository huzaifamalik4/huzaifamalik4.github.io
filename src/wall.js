// The screens wall: a field of tiny tiles, each one a screen from a project in the Work
// section. A lens follows the pointer and enlarges the tiles under it; a click holds the
// lens still and opens a card about that project.
// Plain WebGL, one pass: the fragment shader works out which tile every pixel belongs to.

import { WALL_COLS, WALL_ROWS, WALL_TILES } from './wall-data.js';

const ATLAS_URL = 'assets/img/wall-atlas.webp';
const TILE_COUNT = WALL_COLS * WALL_ROWS;
const STRIDE = 13; // each row of the wall starts 13 tiles further along the sheet
const TILE_ASPECT = 0.75; // tiles are 4:3

const VERTEX = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAGMENT = `
precision highp float;
uniform sampler2D uAtlas;
uniform vec2 uRes;
uniform float uRatio;
uniform vec2 uLens;
uniform float uPower;
uniform float uSigma;
uniform vec2 uCell;
uniform vec2 uShift;
uniform float uReady;
uniform float uLit;

const vec3 GROUND = vec3(0.020, 0.020, 0.024);

void main() {
  // CSS pixels from the top-left corner of the stage, like the page measures things.
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uRatio;
  vec2 d = p - uLens;
  float u = dot(d, d) / (uSigma * uSigma);

  // The lens: flat in the middle, falling away fast at the rim, which squeezes the
  // tiles just outside it the way a glass ball would.
  float bump = uPower * exp(-u * u);
  vec2 s = uLens + d * (1.0 - bump) + uShift;
  vec2 g = s / uCell;
  vec2 id = floor(g);
  vec2 f = g - id;

  // Rounded tile, sized for how large it appears at this spot.
  vec2 size = uCell / (1.0 - bump);
  float gap = max(0.8, min(size.x, size.y) * 0.04);
  vec2 inner = size * 0.5 - gap;
  float radius = min(inner.x, inner.y) * 0.26;
  vec2 q = abs((f - 0.5) * size) - inner + radius;
  float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  float inside = 1.0 - smoothstep(-0.5, 0.5, sd * uRatio);

  // Which picture: the sheet is read left to right, and every row starts further along.
  float index = mod(id.x + id.y * ${STRIDE}.0, ${TILE_COUNT}.0);
  float col = mod(index, ${WALL_COLS}.0);
  float row = floor(index / ${WALL_COLS}.0);
  vec2 t = clamp((f - 0.5) * size / (2.0 * inner) + 0.5, 0.006, 0.994);
  vec2 uv = vec2((col + t.x) / ${WALL_COLS}.0, 1.0 - (row + t.y) / ${WALL_ROWS}.0);
  vec3 picture = mix(vec3(0.17), texture2D(uAtlas, uv).rgb, uReady);

  // Tiles near the lens are lit; the rest of the wall sits in the dark.
  float glow = exp(-u * 0.55) * uLit;
  float light = mix(0.1, 1.0, glow);

  gl_FragColor = vec4(mix(GROUND, picture * light, inside), 1.0);
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

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function createWall(stage, { reducedMotion = false, onOpen } = {}) {
  const holder = stage.querySelector('[data-wall-canvas]');
  const label = stage.querySelector('[data-wall-label]');
  const card = stage.querySelector('[data-wall-card]');
  if (!holder) return null;

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) return null;

  let program;
  const uniforms = {};
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    gl.bindAttribLocation(program, 0, 'aPos');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'program failed to link');
  } catch (error) {
    console.error(error);
    return null;
  }
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const { name } = gl.getActiveUniform(program, i);
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  gl.useProgram(program);
  holder.appendChild(canvas);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // The picture sheet. A single grey pixel stands in until it has loaded.
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([44, 44, 44, 255]));
  let atlasReady = false;
  const image = new Image();
  image.decoding = 'async';
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    // The sheet is a power of two on both sides, so the far-away tiles can use smaller copies.
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    atlasReady = true;
  };
  image.src = ATLAS_URL;

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const maxRatio = Math.min(window.devicePixelRatio || 1, coarse ? 2 : 1.5);
  let ratio = maxRatio;
  let width = 1;
  let height = 1;
  let cellW = 20;
  let cellH = 15;
  let baseSigma = 200;

  function resize() {
    width = holder.clientWidth || 1;
    height = holder.clientHeight || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    cellW = clamp(width / 60, 12, 23);
    cellH = cellW * TILE_ASPECT;
    baseSigma = clamp(Math.min(width, height) * 0.3, 92, 230);
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(holder);
  resize();

  const lens = { x: width / 2, y: height / 2, tx: width / 2, ty: height / 2, power: 0, sigma: baseSigma };
  const shift = { x: 0, y: 0, speed: 0 };
  let pointerInside = false;
  let pinned = false;
  let focus = -1;
  let ready = 0;
  let lit = 0;

  // Which tile of the wall is drawn at a point on the stage. Mirrors the shader:
  // near the lens, a point shows a part of the wall that is closer to the lens centre.
  const cellAt = (x, y) => {
    const dx = x - lens.x;
    const dy = y - lens.y;
    const u = (dx * dx + dy * dy) / (lens.sigma * lens.sigma);
    const keep = 1 - lens.power * Math.exp(-u * u);
    return {
      col: Math.floor((lens.x + dx * keep + shift.x) / cellW),
      row: Math.floor((lens.y + dy * keep + shift.y) / cellH),
    };
  };
  const tileOf = ({ col, row }) => (((col + row * STRIDE) % TILE_COUNT) + TILE_COUNT) % TILE_COUNT;
  const projectCard = (key) => document.querySelector(`[data-project="${key}"]`);
  const textOf = (scope, selector) => {
    const el = scope && scope.querySelector(selector);
    return el ? el.textContent.trim() : '';
  };

  /* ----- The small label that travels with the lens ----- */

  const labelCaption = label && label.querySelector('[data-wall-caption]');
  const labelProject = label && label.querySelector('[data-wall-project]');
  const labelType = label && label.querySelector('[data-wall-type]');
  function showFocus(index) {
    if (!label) return;
    const [key, caption] = WALL_TILES[index];
    const source = projectCard(key);
    labelCaption.textContent = caption;
    labelProject.textContent = textOf(source, 'h3') || key;
    labelType.textContent = textOf(source, '.card__type');
  }
  function placeLabel() {
    if (!label) return;
    const tileHalf = (cellH / (1 - lens.power)) / 2;
    const labelWidth = label.offsetWidth;
    const labelHeight = label.offsetHeight;
    const x = clamp(lens.x - labelWidth / 2, 12, Math.max(12, width - labelWidth - 12));
    let y = lens.y + tileHalf + 14;
    if (y + labelHeight > height - 12) y = lens.y - tileHalf - 14 - labelHeight;
    label.style.transform = `translate3d(${x.toFixed(1)}px, ${clamp(y, 12, height - labelHeight - 12).toFixed(1)}px, 0)`;
  }

  /* ----- Holding the lens still and opening the card ----- */

  function fillCard(index) {
    if (!card) return;
    const [key, caption] = WALL_TILES[index];
    const source = projectCard(key);
    card.querySelector('[data-card-type]').textContent = textOf(source, '.card__type');
    card.querySelector('[data-card-status]').textContent = textOf(source, '.tag');
    card.querySelector('[data-card-title]').textContent = textOf(source, 'h3') || key;
    card.querySelector('[data-card-screen]').textContent = caption;
    card.querySelector('[data-card-text]').textContent = textOf(source, '.card__info p');
    const link = card.querySelector('[data-card-link]');
    const href = source && source.getAttribute('href');
    if (href) {
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener';
      link.firstElementChild.textContent = source.dataset.open || 'Open the concept';
      link.onclick = null;
    } else {
      link.href = '#work';
      link.removeAttribute('target');
      link.removeAttribute('rel');
      link.firstElementChild.textContent = 'Show it in Work';
      link.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (onOpen && source) onOpen(source);
      };
    }
  }
  function setPinned(next, index) {
    pinned = next;
    stage.classList.toggle('is-pinned', pinned);
    if (card) {
      if (pinned) {
        fillCard(index);
        card.hidden = false;
      }
      card.classList.toggle('is-open', pinned);
      card.setAttribute('aria-hidden', String(!pinned));
      card.inert = !pinned;
    }
  }

  function pointerPosition(event) {
    const rect = holder.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
  function onPointerMove(event) {
    if (pinned) return;
    const { x, y } = pointerPosition(event);
    lens.tx = x;
    lens.ty = y;
    if (!pointerInside) {
      pointerInside = true;
      stage.classList.add('is-active');
    }
  }
  function onPointerLeave() {
    pointerInside = false;
    stage.classList.remove('is-active');
  }
  function onClick(event) {
    if (event.target.closest('[data-wall-card]')) return;
    if (pinned) {
      setPinned(false);
      return;
    }
    // The screen that was clicked glides to the middle of the lens and stays there.
    const { x, y } = pointerPosition(event);
    const cell = cellAt(x, y);
    lens.tx = (cell.col + 0.5) * cellW - shift.x;
    lens.ty = (cell.row + 0.5) * cellH - shift.y;
    setPinned(true, tileOf(cell));
  }
  function onKeyDown(event) {
    if (event.key === 'Escape' && pinned) setPinned(false);
  }
  stage.addEventListener('pointermove', onPointerMove, { passive: true });
  stage.addEventListener('pointerdown', onPointerMove, { passive: true });
  stage.addEventListener('pointerleave', onPointerLeave, { passive: true });
  stage.addEventListener('pointercancel', onPointerLeave, { passive: true });
  stage.addEventListener('click', onClick);
  document.addEventListener('keydown', onKeyDown);
  if (card) {
    card.inert = true;
    const close = card.querySelector('[data-card-close]');
    if (close) close.addEventListener('click', () => setPinned(false));
  }

  // If the device cannot hold a smooth frame rate, lower the resolution rather than stutter.
  let quality = 0;
  let warmup = 45;
  let sampleCount = 0;
  let sampleTotal = 0;
  function watchFrameTime(ms) {
    if (quality >= 2 || ms > 200) return;
    if (warmup > 0) { warmup -= 1; return; }
    sampleTotal += ms;
    sampleCount += 1;
    if (sampleCount < 60) return;
    const average = sampleTotal / sampleCount;
    sampleTotal = 0;
    sampleCount = 0;
    if (average > 25) {
      quality += 1;
      ratio = quality === 1 ? Math.min(maxRatio, 1) : 0.75;
      warmup = 20;
      resize();
    }
  }

  let running = false;
  let visible = false;
  let frame = 0;
  let last = 0;
  let clock = 0;

  function tick(now) {
    frame = requestAnimationFrame(tick);
    watchFrameTime(now - last);
    const dt = Math.min((now - last) / 1000 || 1 / 60, 0.1);
    last = now;
    clock += dt;

    // Left alone, the lens wanders so the wall never sits still.
    const wandering = !pointerInside && !pinned && !reducedMotion;
    if (wandering) {
      lens.tx = width * (0.5 + Math.cos(clock * 0.31) * 0.27 + Math.cos(clock * 0.13) * 0.08);
      lens.ty = height * (0.52 + Math.sin(clock * 0.43) * 0.2);
    }
    const follow = 1 - Math.exp(-(wandering ? 1.8 : pinned ? 5 : 11) * dt);
    lens.x += (lens.tx - lens.x) * follow;
    lens.y += (lens.ty - lens.y) * follow;

    const ease = 1 - Math.exp(-3.2 * dt);
    lens.power += ((pinned ? 0.92 : 0.885) - lens.power) * ease;
    lens.sigma += (baseSigma * (pinned ? 1.4 : 1) - lens.sigma) * ease;
    ready += ((atlasReady ? 1 : 0) - ready) * (1 - Math.exp(-2.5 * dt));
    lit += (1 - lit) * (1 - Math.exp(-1.6 * dt));

    // The wall drifts sideways while nobody is steering, and slides a little with the page.
    shift.speed += ((wandering ? 7 : 0) - shift.speed) * (1 - Math.exp(-2 * dt));
    shift.x = (shift.x + shift.speed * dt) % (cellW * TILE_COUNT);
    if (!reducedMotion && !pinned) {
      const top = holder.getBoundingClientRect().top;
      shift.y = Math.round(-top * 0.08);
    }

    if (!pinned) {
      const next = tileOf(cellAt(lens.x, lens.y));
      if (next !== focus) {
        focus = next;
        showFocus(focus);
      }
      placeLabel();
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1i(uniforms.uAtlas, 0);
    gl.uniform2f(uniforms.uRes, canvas.width, canvas.height);
    gl.uniform1f(uniforms.uRatio, ratio);
    gl.uniform2f(uniforms.uLens, lens.x, lens.y);
    gl.uniform1f(uniforms.uPower, lens.power);
    gl.uniform1f(uniforms.uSigma, lens.sigma);
    gl.uniform2f(uniforms.uCell, cellW, cellH);
    gl.uniform2f(uniforms.uShift, shift.x, shift.y);
    gl.uniform1f(uniforms.uReady, ready);
    gl.uniform1f(uniforms.uLit, lit);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function setRunning(next) {
    if (next === running) return;
    running = next;
    cancelAnimationFrame(frame);
    if (running) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }
  const visibility = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      setRunning(visible && !document.hidden);
    },
    { rootMargin: '60px' },
  );
  visibility.observe(holder);
  function onVisibilityChange() {
    setRunning(visible && !document.hidden);
  }
  document.addEventListener('visibilitychange', onVisibilityChange);

  stage.classList.add('is-live');

  return {
    dispose() {
      setRunning(false);
      visibility.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      document.removeEventListener('keydown', onKeyDown);
      canvas.remove();
    },
  };
}
