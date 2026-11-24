// The light that crosses the page when the theme changes: a ring of split colour that
// spreads from the button that was pressed. Drawn on a see-through canvas laid over
// everything, at half resolution, since it is all soft gradients.

const SCALE = 0.5;

const VERTEX = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAGMENT = `
precision highp float;
uniform vec2 uRes;
uniform vec2 uOrigin;
uniform float uRadius;
uniform float uWidth;
uniform float uTime;
uniform float uFade;
uniform float uFill;
uniform vec3 uPaper;
uniform vec3 uGlow;

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

// A soap-film run of colour: violet, cyan, mint, pink, and round again.
vec3 sheen(float t) {
  float s = fract(t) * 4.0;
  vec3 violet = vec3(0.62, 0.48, 1.0);
  vec3 cyan = vec3(0.38, 0.9, 1.0);
  vec3 mint = vec3(0.58, 1.0, 0.76);
  vec3 pink = vec3(1.0, 0.72, 0.94);
  vec3 color = mix(violet, cyan, smoothstep(0.0, 1.0, s));
  color = mix(color, mint, smoothstep(1.0, 2.0, s));
  color = mix(color, pink, smoothstep(2.0, 3.0, s));
  return mix(color, violet, smoothstep(3.0, 4.0, s));
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float dist = distance(p, uOrigin);

  // The front ripples a little, so it reads as light through water, not a drawn circle.
  float ripple = noise(p / uWidth * 0.9 + vec2(uTime * 0.35, -uTime * 0.2)) - 0.5;
  float x = (dist - uRadius) / uWidth + ripple * 0.7;

  float core = exp(-x * x * 6.0);
  float halo = exp(-x * x * 0.85);

  // The colours fan out across the band like light split by glass.
  float phase = x * 0.36 + ripple * 0.5 + uTime * 0.07;
  vec3 band = mix(sheen(phase), vec3(1.0), 0.1 + 0.62 * core);
  float bandAlpha = clamp(core * 0.9 + halo * 0.46, 0.0, 1.0);

  // Behind the front, a glow in the new theme's colour fades away.
  float behind = clamp(-x, 0.0, 8.0);
  float glowAlpha = step(x, 0.0) * exp(-behind * behind * 0.12) * 0.42;

  // Where the browser cannot blend two snapshots of the page, the area behind the
  // front is painted in the new page colour instead.
  float fillAlpha = uFill * smoothstep(0.6, -0.6, x);

  vec3 rgb = uPaper * fillAlpha;
  float alpha = fillAlpha;
  rgb = uGlow * glowAlpha + rgb * (1.0 - glowAlpha);
  alpha = glowAlpha + alpha * (1.0 - glowAlpha);
  rgb = band * bandAlpha + rgb * (1.0 - bandAlpha);
  alpha = bandAlpha + alpha * (1.0 - bandAlpha);

  gl_FragColor = vec4(rgb, alpha) * uFade;
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

const PAPER = { light: [0.933, 0.929, 0.91], dark: [0.043, 0.043, 0.047] };
const GLOW = { light: [0.86, 0.8, 1.0], dark: [0.27, 0.95, 0.66] };

export function createPrism() {
  const canvas = document.createElement('canvas');
  canvas.className = 'prism';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return null;

  const program = gl.createProgram();
  const uniforms = {};
  try {
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
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  document.body.appendChild(canvas);

  let frame = 0;

  function draw({ x, y, radius, width, time, fade, fill, theme }) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uniforms.uRes, canvas.width, canvas.height);
    gl.uniform2f(uniforms.uOrigin, x * SCALE, y * SCALE);
    gl.uniform1f(uniforms.uRadius, radius * SCALE);
    gl.uniform1f(uniforms.uWidth, width * SCALE);
    gl.uniform1f(uniforms.uTime, time);
    gl.uniform1f(uniforms.uFade, fade);
    gl.uniform1f(uniforms.uFill, fill ? 1 : 0);
    gl.uniform3fv(uniforms.uPaper, PAPER[theme]);
    gl.uniform3fv(uniforms.uGlow, GLOW[theme]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  return {
    // Sizes the canvas to the window and wipes it. Call before each sweep.
    prepare() {
      canvas.width = Math.max(2, Math.round(window.innerWidth * SCALE));
      canvas.height = Math.max(2, Math.round(window.innerHeight * SCALE));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
    // Runs the ring from the origin out to "reach". Resolves when it gets there.
    play({ x, y, reach, width, duration, ease, theme, fill = false }) {
      cancelAnimationFrame(frame);
      return new Promise((resolve) => {
        const start = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - start) / duration);
          draw({ x, y, radius: ease(t) * reach, width, time: (now - start) / 1000, fade: 1, fill, theme });
          if (t < 1) frame = requestAnimationFrame(step);
          else resolve();
        };
        frame = requestAnimationFrame(step);
      });
    },
    // Fades out whatever the last frame showed (used after a filled sweep).
    fadeOut({ x, y, reach, width, duration, theme }) {
      cancelAnimationFrame(frame);
      return new Promise((resolve) => {
        const start = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - start) / duration);
          draw({ x, y, radius: reach, width, time: 2 + (now - start) / 1000, fade: 1 - t, fill: true, theme });
          if (t < 1) frame = requestAnimationFrame(step);
          else resolve();
        };
        frame = requestAnimationFrame(step);
      });
    },
    stop() {
      cancelAnimationFrame(frame);
    },
  };
}
