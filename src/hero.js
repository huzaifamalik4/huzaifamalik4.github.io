// The hero stage: a portrait drawn in blue and overlaid with code. The pointer leaves a
// liquid trail that wipes the code away and shows the photograph underneath.
// Plain WebGL: one small simulation pass for the trail, one pass for the picture.

const PHOTO_URL = 'assets/img/hero-portrait.webp';
const PHOTO_ASPECT = 2040 / 850;
const FOCAL_X = 0.652; // where the face sits across the image
const TRAIL_WIDTH = 192; // simulation resolution, in texels across

const CODE_LINES = [
  '<!-- huzaifamalik.me -->',
  '<section class="hero">',
  '  <h1>Web developer building</h1>',
  '  <h1>websites that feel alive.</h1>',
  '</section>',
  '',
  'const huzaifa = {',
  "  role: 'developer + designer',",
  "  based: 'Pakistan',",
  '  since: 2020,',
  "  stack: ['WordPress', 'Shopify', 'React'],",
  '  available: true,',
  '};',
  '',
  'function build(idea) {',
  '  const design = sketch(idea);',
  '  const site = code(design);',
  '  return launch(site);',
  '}',
  '',
  '.site {',
  '  speed: fast;',
  '  layout: responsive;',
  '  details: considered;',
  '}',
  '',
  "add_action('init', 'register_theme');",
  "<?php get_template_part('hero'); ?>",
  '',
  '@media (max-width: 700px) {',
  '  .grid { grid-template-columns: 1fr; }',
  '}',
  '',
  'while (!client.isHappy) refine(site);',
  'git commit -m "ship it"',
  '',
];

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

// Trail simulation: spread a little, fade a little, then paint along the pointer's path.
const TRAIL_FRAGMENT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPrev;
uniform vec2 uTexel;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform float uAspect;
uniform float uRadius;
uniform float uPaint;

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.000001), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  float c = texture2D(uPrev, vUv).r;
  float n = texture2D(uPrev, vUv + vec2(uTexel.x, 0.0)).r
          + texture2D(uPrev, vUv - vec2(uTexel.x, 0.0)).r
          + texture2D(uPrev, vUv + vec2(0.0, uTexel.y)).r
          + texture2D(uPrev, vUv - vec2(0.0, uTexel.y)).r;
  float v = mix(c, n * 0.25, 0.4);
  v = v * 0.98 - 0.0024;
  vec2 s = vec2(uAspect, 1.0);
  float d = segmentDistance(vUv * s, uFrom * s, uTo * s);
  v += uPaint * smoothstep(uRadius, uRadius * 0.2, d);
  gl_FragColor = vec4(clamp(v, 0.0, 1.0), 0.0, 0.0, 1.0);
}`;

const PICTURE_FRAGMENT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPhoto;
uniform sampler2D uCode;
uniform sampler2D uTrail;
uniform vec2 uRes;
uniform vec2 uTrailTexel;
uniform float uTime;
uniform float uImageAspect;
uniform float uFocalX;
uniform float uAnchor;
uniform float uCodeTile;
uniform float uReveal;
uniform float uPhotoReady;

const vec3 BLUE = vec3(0.133, 0.220, 1.0);
const vec3 DEEP = vec3(0.020, 0.035, 0.300);
const vec3 SKY = vec3(0.520, 0.580, 1.0);

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

// Fit the wide photo to the stage like "cover", keeping the face in frame.
vec2 photoUv(vec2 uv) {
  float stage = uRes.x / uRes.y;
  if (stage < uImageAspect) {
    float w = stage / uImageAspect;
    float left = clamp(uFocalX - w * uAnchor, 0.0, 1.0 - w);
    return vec2(left + uv.x * w, uv.y);
  }
  float h = uImageAspect / stage;
  return vec2(uv.x, (1.0 - h) * 0.56 + uv.y * h);
}

void main() {
  vec2 uv = vUv;
  float stage = uRes.x / uRes.y;

  float t = texture2D(uTrail, uv).r;
  vec2 grad = vec2(
    texture2D(uTrail, uv + vec2(uTrailTexel.x * 2.0, 0.0)).r - texture2D(uTrail, uv - vec2(uTrailTexel.x * 2.0, 0.0)).r,
    texture2D(uTrail, uv + vec2(0.0, uTrailTexel.y * 2.0)).r - texture2D(uTrail, uv - vec2(0.0, uTrailTexel.y * 2.0)).r
  );

  // A wobbling edge makes the wiped area read as liquid, not as a hard circle.
  float wobble = noise(vec2(uv.x * stage, uv.y) * 4.0 + uTime * 0.3) - 0.5;
  float field = t + wobble * 0.3 * smoothstep(0.03, 0.3, t);
  float mask = smoothstep(0.30, 0.35, field) * uPhotoReady;

  vec2 pUv = photoUv(uv);
  float lum = dot(texture2D(uPhoto, pUv).rgb, vec3(0.299, 0.587, 0.114));
  float tone = pow(smoothstep(0.04, 0.93, lum), 0.78);
  tone = mix(0.62, tone, uReveal * uPhotoReady);

  // Code side: the portrait as a two-colour print, with code laid over it.
  vec3 print = mix(DEEP, BLUE, smoothstep(0.0, 0.7, tone));
  print = mix(print, SKY, smoothstep(0.78, 1.0, tone) * 0.22);
  vec2 cUv = vec2(uv.x * stage, uv.y) / uCodeTile;
  cUv.y -= uTime * 0.006;
  vec3 texel = texture2D(uCode, cUv).rgb;
  float ink = max(texel.r, max(texel.g, texel.b));
  vec3 tint = texel / max(ink, 0.001);
  vec3 codeSide = mix(print, tint, ink * mix(0.07, 0.92, tone));

  // Photo side, bent slightly near the edge of the wiped area.
  vec3 photo = texture2D(uPhoto, photoUv(uv - grad * 0.05)).rgb;

  vec3 color = mix(codeSide, photo, mask);
  float rim = smoothstep(0.24, 0.30, field) * (1.0 - smoothstep(0.35, 0.43, field)) * uPhotoReady;
  color = mix(color, vec3(1.0), rim * 0.5);

  color += (hash(uv * uRes + fract(uTime) * 100.0) - 0.5) * 0.03;
  gl_FragColor = vec4(color, 1.0);
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

function createProgram(gl, fragment) {
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment));
  gl.bindAttribLocation(program, 0, 'aPos');
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || 'program failed to link');
  }
  const uniforms = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const { name } = gl.getActiveUniform(program, i);
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  return { program, uniforms };
}

// Draws the code that tiles across the stage. White marks text; colour marks the token type.
function drawCodeTexture() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  ctx.font = '600 19px ui-monospace, "Cascadia Mono", Consolas, Menlo, monospace';
  ctx.textBaseline = 'top';

  const lineHeight = size / CODE_LINES.length;
  const token = /(<!--.*?-->|'[^']*'|"[^"]*"|\b(?:const|function|return|while|true|class|section|h1|php)\b|\d+|[{}()[\];,<>=/:!?.@-]+)/g;
  const colourOf = (part) => {
    if (part.startsWith('<!--')) return '#8f9bff';
    if (/^['"]/.test(part)) return '#c8d0ff';
    if (/^(?:const|function|return|while|true|class|section|h1|php)$/.test(part)) return '#aab6ff';
    if (/^\d+$/.test(part)) return '#c8d0ff';
    if (/^[{}()[\];,<>=/:!?.@-]+$/.test(part)) return '#9aa6ff';
    return '#ffffff';
  };

  // Two columns, the second offset by half the listing, so the tile has no empty half.
  for (let column = 0; column < 2; column++) {
    const offset = column === 0 ? 0 : Math.floor(CODE_LINES.length / 2);
    CODE_LINES.forEach((_, row) => {
      const line = CODE_LINES[(row + offset) % CODE_LINES.length];
      let x = 20 + column * (size / 2);
      const y = row * lineHeight + 5;
      line.split(token).forEach((part) => {
        if (!part) return;
        ctx.fillStyle = colourOf(part);
        ctx.fillText(part, x, y);
        x += ctx.measureText(part).width;
      });
    });
  }
  return canvas;
}

export function createHero(container, { reducedMotion = false } = {}) {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) return null;

  let trailProgram;
  let pictureProgram;
  try {
    trailProgram = createProgram(gl, TRAIL_FRAGMENT);
    pictureProgram = createProgram(gl, PICTURE_FRAGMENT);
  } catch (error) {
    console.error(error);
    return null;
  }
  container.appendChild(canvas);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  function createTexture({ repeat = false, mipmap = false } = {}) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
  }

  // Code tile (power-of-two, so it can repeat and mipmap in WebGL 1).
  const codeTexture = createTexture({ repeat: true, mipmap: true });
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, drawCodeTexture());
  gl.generateMipmap(gl.TEXTURE_2D);

  // Photo: a single grey pixel until the real one arrives.
  const photoTexture = createTexture();
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([150, 150, 150, 255]));
  let photoReady = false;
  let photoShownAt = 0;
  const image = new Image();
  image.decoding = 'async';
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, photoTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    photoReady = true;
  };
  image.src = PHOTO_URL;

  // Two trail buffers, swapped every simulation step.
  const trail = [0, 1].map(() => ({ texture: createTexture(), framebuffer: gl.createFramebuffer(), width: 0, height: 0 }));
  function sizeTrail(aspect) {
    const width = TRAIL_WIDTH;
    const height = Math.max(48, Math.min(512, Math.round(TRAIL_WIDTH / aspect)));
    trail.forEach((target) => {
      target.width = width;
      target.height = height;
      gl.bindTexture(gl.TEXTURE_2D, target.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const maxRatio = Math.min(window.devicePixelRatio || 1, coarse ? 2 : 1.75);
  let ratio = maxRatio;
  let cssWidth = 1;
  let cssHeight = 1;
  let aspect = 1;

  function resize() {
    cssWidth = container.clientWidth || 1;
    cssHeight = container.clientHeight || 1;
    const nextAspect = cssWidth / cssHeight;
    canvas.width = Math.round(cssWidth * ratio);
    canvas.height = Math.round(cssHeight * ratio);
    if (Math.abs(nextAspect - aspect) > 0.01 || !trail[0].width) {
      aspect = nextAspect;
      sizeTrail(aspect);
    }
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  // Pointer, in stage coordinates (0 to 1, origin bottom-left).
  const pointer = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, tx: 0.5, ty: 0.5, lastMove: -1e9, inside: false, paint: 0 };
  // Where the face sits on screen: right of centre on wide stages, centred on tall ones.
  const anchorFor = (a) => 0.5 + 0.14 * Math.min(1, Math.max(0, (a - 0.9) / 0.9));

  function onPointerMove(event) {
    const rect = container.getBoundingClientRect();
    pointer.tx = (event.clientX - rect.left) / rect.width;
    pointer.ty = 1 - (event.clientY - rect.top) / rect.height;
    pointer.lastMove = performance.now();
    if (!pointer.inside) {
      // Start the stroke where the pointer came in, not from the idle path.
      pointer.inside = true;
      pointer.x = pointer.px = pointer.tx;
      pointer.y = pointer.py = pointer.ty;
    }
  }
  function onPointerLeave() {
    pointer.inside = false;
    pointer.lastMove = -1e9;
  }
  container.addEventListener('pointermove', onPointerMove, { passive: true });
  container.addEventListener('pointerdown', onPointerMove, { passive: true });
  container.addEventListener('pointerleave', onPointerLeave, { passive: true });
  container.addEventListener('pointercancel', onPointerLeave, { passive: true });

  let read = 0;
  function stepTrail(fromX, fromY, toX, toY, paint) {
    const source = trail[read];
    const target = trail[1 - read];
    const u = trailProgram.uniforms;
    gl.useProgram(trailProgram.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.viewport(0, 0, target.width, target.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, source.texture);
    gl.uniform1i(u.uPrev, 0);
    gl.uniform2f(u.uTexel, 1 / source.width, 1 / source.height);
    gl.uniform2f(u.uFrom, fromX, fromY);
    gl.uniform2f(u.uTo, toX, toY);
    gl.uniform1f(u.uAspect, aspect);
    gl.uniform1f(u.uRadius, aspect < 1 ? 0.13 : 0.17);
    gl.uniform1f(u.uPaint, paint);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    read = 1 - read;
  }

  function drawPicture(time, reveal) {
    const u = pictureProgram.uniforms;
    gl.useProgram(pictureProgram.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, photoTexture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, codeTexture);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, trail[read].texture);
    gl.uniform1i(u.uPhoto, 0);
    gl.uniform1i(u.uCode, 1);
    gl.uniform1i(u.uTrail, 2);
    gl.uniform2f(u.uRes, canvas.width, canvas.height);
    gl.uniform2f(u.uTrailTexel, 1 / trail[read].width, 1 / trail[read].height);
    gl.uniform1f(u.uTime, time);
    gl.uniform1f(u.uImageAspect, PHOTO_ASPECT);
    gl.uniform1f(u.uFocalX, FOCAL_X);
    gl.uniform1f(u.uAnchor, anchorFor(aspect));
    gl.uniform1f(u.uCodeTile, 590 / cssHeight);
    gl.uniform1f(u.uReveal, reveal);
    gl.uniform1f(u.uPhotoReady, photoReady ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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
      ratio = quality === 1 ? Math.min(maxRatio, 1.15) : 0.8;
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
  let clock = 0;
  let backlog = 0;

  function tick(now) {
    frame = requestAnimationFrame(tick);
    watchFrameTime(now - last);
    const dt = Math.min((now - last) / 1000 || STEP, 0.1);
    last = now;
    clock += dt;

    if (photoReady && !photoShownAt) photoShownAt = clock;
    const sinceShown = photoShownAt ? clock - photoShownAt : 0;
    const reveal = reducedMotion ? 1 : Math.min(1, sinceShown / 1.6);

    // With no recent input, the wipe drifts around the face by itself so the idea is visible.
    const idle = now - pointer.lastMove > 2400;
    if (idle) {
      const cx = anchorFor(aspect);
      pointer.tx = cx + (Math.cos(clock * 0.62) * 0.2 + Math.cos(clock * 0.21) * 0.07) / Math.max(aspect, 0.8);
      pointer.ty = 0.55 + Math.sin(clock * 0.83) * 0.2;
    }
    const follow = 1 - Math.exp(-(idle ? 3 : 16) * dt);
    pointer.x += (pointer.tx - pointer.x) * follow;
    pointer.y += (pointer.ty - pointer.y) * follow;

    const wantPaint = photoReady && sinceShown > 0.9 && !(idle && reducedMotion) ? (idle ? 0.16 : 0.5) : 0;
    pointer.paint += (wantPaint - pointer.paint) * (1 - Math.exp(-6 * dt));

    // The trail runs at a fixed 60 steps a second, whatever the screen's refresh rate.
    backlog = Math.min(backlog + dt, STEP * 4);
    while (backlog >= STEP) {
      stepTrail(pointer.px, pointer.py, pointer.x, pointer.y, pointer.paint);
      pointer.px = pointer.x;
      pointer.py = pointer.y;
      backlog -= STEP;
    }

    drawPicture(clock, reveal);
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
      if (started) setRunning(visible && !document.hidden);
    },
    { rootMargin: '80px' },
  );
  visibility.observe(container);
  function onVisibilityChange() {
    if (started) setRunning(visible && !document.hidden);
  }
  document.addEventListener('visibilitychange', onVisibilityChange);

  return {
    start() {
      started = true;
      container.classList.add('is-live');
      setRunning(visible && !document.hidden);
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
