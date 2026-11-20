// The hero scene: a cluster of shapes pulled toward the centre that the pointer pushes through.
import {
  ACESFilmicToneMapping,
  AmbientLight,
  CapsuleGeometry,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PMREMGenerator,
  PointLight,
  Quaternion,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const FOV = 32;
const BASE_Z = 25;
const FIT_HALF_WIDTH = 6.4; // world units the cluster needs on each side
const PULL = 9; // spring toward the centre
const MAX_PULL = 30;
const DRAG = 3.2;
const POINTER_RADIUS = 2.1;

// Small seeded generator so the cluster looks the same on every visit.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createHero(container, { reducedMotion = false } = {}) {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = window.innerWidth < 760;
  const count = small ? 26 : 44;

  let renderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !small;
  renderer.shadowMap.type = PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, BASE_Z);

  const pmrem = new PMREMGenerator(renderer);
  const envScene = new RoomEnvironment();
  scene.environment = pmrem.fromScene(envScene, 0.04).texture;
  scene.environmentIntensity = 0.55;
  pmrem.dispose();

  scene.add(new AmbientLight(0xffffff, 0.25));

  const key = new DirectionalLight(0xffffff, 2.6);
  key.position.set(7, 11, 13);
  key.castShadow = !small;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -9;
  key.shadow.camera.right = 9;
  key.shadow.camera.top = 9;
  key.shadow.camera.bottom = -9;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 40;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.04;
  key.shadow.radius = 5;
  scene.add(key);

  // A blue light that travels with the pointer.
  const glow = new PointLight(0x3a50ff, 90, 16, 1.6);
  glow.position.set(0, 0, 4);
  scene.add(glow);

  const geometries = {
    sphere: new SphereGeometry(1, 48, 32),
    torus: new TorusGeometry(0.66, 0.34, 28, 72),
    box: new RoundedBoxGeometry(1.34, 1.34, 1.34, 6, 0.34),
    capsule: new CapsuleGeometry(0.52, 0.96, 12, 32),
  };
  const materials = [
    new MeshStandardMaterial({ color: 0xf2f1ec, roughness: 0.55, metalness: 0 }), // paper white
    new MeshStandardMaterial({ color: 0x0d0d10, roughness: 0.3, metalness: 0.2 }), // ink
    new MeshStandardMaterial({ color: 0x2238ff, roughness: 0.32, metalness: 0.05, emissive: 0x0a14b8, emissiveIntensity: 0.45 }), // blue
    new MeshStandardMaterial({ color: 0xffffff, roughness: 0.06, metalness: 1 }), // chrome
  ];
  const materialOrder = [0, 0, 1, 2, 0, 3, 1, 2, 0, 1, 3, 0, 2];
  const kindOrder = ['sphere', 'sphere', 'torus', 'sphere', 'box', 'sphere', 'capsule', 'sphere', 'torus', 'box', 'sphere'];
  const colliderScale = { sphere: 1, torus: 0.97, box: 0.98, capsule: 0.9 };

  const rand = mulberry32(20261120);
  const bodies = [];
  for (let i = 0; i < count; i++) {
    const kind = kindOrder[i % kindOrder.length];
    const big = i % 11 === 0;
    const size = big ? 1.35 + rand() * 0.35 : 0.52 + rand() * 0.56;
    const mesh = new Mesh(geometries[kind], materials[materialOrder[i % materialOrder.length]]);
    mesh.scale.setScalar(size);
    mesh.castShadow = !small;
    mesh.receiveShadow = !small;
    mesh.quaternion.setFromAxisAngle(new Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(), rand() * Math.PI * 2);
    scene.add(mesh);

    // Start far outside the frame so the cluster flies together on load.
    const angle = rand() * Math.PI * 2;
    const dist = 17 + rand() * 12;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist * 0.7;
    const z = (rand() - 0.5) * 8;
    bodies.push({
      mesh,
      r: size * colliderScale[kind],
      mass: size * size * size,
      x, y, z,
      px: x, py: y, pz: z,
      spin: new Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
      spinSpeed: 0.12 + rand() * 0.22,
    });
  }

  // Pointer state, in world units on the z = 0 plane.
  const pointer = { x: 0, y: 30, tx: 0, ty: 30, lastMove: -1e9, inside: false };
  let halfW = 1;
  let halfH = 1;

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const tan = Math.tan((FOV * Math.PI) / 360);
    camera.position.z = Math.max(BASE_Z, FIT_HALF_WIDTH / (tan * camera.aspect));
    camera.updateProjectionMatrix();
    halfH = tan * camera.position.z;
    halfW = halfH * camera.aspect;
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  function onPointerMove(event) {
    const rect = container.getBoundingClientRect();
    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    pointer.tx = nx * halfW;
    pointer.ty = ny * halfH;
    pointer.lastMove = performance.now();
    if (!pointer.inside) {
      // Jump straight to the entry point rather than sweeping in from the idle path.
      pointer.inside = true;
      pointer.x = pointer.tx;
      pointer.y = pointer.ty;
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

  function simulate(h) {
    const damp = Math.exp(-DRAG * h);
    const hh = h * h;
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      const vx = (b.x - b.px) * damp;
      const vy = (b.y - b.py) * damp;
      const vz = (b.z - b.pz) * damp;
      let ax = -b.x * PULL;
      let ay = -b.y * PULL;
      let az = -b.z * PULL * 2.4; // flatter cluster, so more of it faces the camera
      const len = Math.hypot(ax, ay, az);
      if (len > MAX_PULL) {
        const k = MAX_PULL / len;
        ax *= k; ay *= k; az *= k;
      }
      b.px = b.x; b.py = b.y; b.pz = b.z;
      b.x += vx + ax * hh;
      b.y += vy + ay * hh;
      b.z += vz + az * hh;
    }

    for (let pass = 0; pass < 2; pass++) {
      // Pointer pushes shapes out of its way.
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        const dx = b.x - pointer.x;
        const dy = b.y - pointer.y;
        const dz = b.z;
        const min = b.r + POINTER_RADIUS;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < min * min && d2 > 1e-6) {
          const d = Math.sqrt(d2);
          const push = ((min - d) / d) * 0.6;
          b.x += dx * push;
          b.y += dy * push;
          b.z += dz * push;
        }
      }
      // Shapes push each other apart, lighter ones giving way more.
      for (let i = 0; i < bodies.length; i++) {
        const a = bodies[i];
        for (let j = i + 1; j < bodies.length; j++) {
          const b = bodies[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dz = b.z - a.z;
          const min = a.r + b.r;
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 >= min * min || d2 < 1e-6) continue;
          const d = Math.sqrt(d2);
          const overlap = (min - d) / d;
          const wa = b.mass / (a.mass + b.mass);
          const wb = 1 - wa;
          a.x -= dx * overlap * wa;
          a.y -= dy * overlap * wa;
          a.z -= dz * overlap * wa;
          b.x += dx * overlap * wb;
          b.y += dy * overlap * wb;
          b.z += dz * overlap * wb;
        }
      }
    }
  }

  const tmpQ = new Quaternion();
  const tmpAxis = new Vector3();
  let running = false;
  let visible = true;
  let frame = 0;
  let last = 0;
  let clock = 0;

  // If the device cannot hold a smooth frame rate, step the quality down rather than stutter.
  const maxRatio = renderer.getPixelRatio();
  let quality = 0;
  let warmup = 45;
  let sampleCount = 0;
  let sampleTotal = 0;
  function lowerQuality() {
    quality += 1;
    if (quality === 1) {
      renderer.setPixelRatio(Math.min(maxRatio, 1.2));
    } else if (quality === 2) {
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = false;
      key.castShadow = false;
      materials.forEach((material) => { material.needsUpdate = true; });
    } else {
      renderer.setPixelRatio(0.75);
    }
    resize();
  }
  function watchFrameTime(ms) {
    if (quality >= 3 || ms > 200) return; // long gaps are a hidden tab, not a slow GPU
    if (warmup > 0) { warmup -= 1; return; }
    sampleTotal += ms;
    sampleCount += 1;
    if (sampleCount < 60) return;
    const average = sampleTotal / sampleCount;
    sampleTotal = 0;
    sampleCount = 0;
    if (average > 25) {
      lowerQuality();
      warmup = 20;
    }
  }

  function tick(now) {
    frame = requestAnimationFrame(tick);
    watchFrameTime(now - last);
    const dt = Math.min((now - last) / 1000 || 0.016, 1 / 30);
    last = now;
    clock += dt;

    // With no recent pointer input, the pusher wanders on its own.
    const idle = now - pointer.lastMove > 2600;
    if (idle && !reducedMotion) {
      pointer.tx = Math.cos(clock * 0.55) * halfW * 0.46;
      pointer.ty = Math.sin(clock * 0.9) * halfH * 0.5;
    } else if (idle) {
      pointer.tx = 0;
      pointer.ty = halfH * 3;
    }
    const follow = 1 - Math.exp(-(idle ? 2.2 : 14) * dt);
    pointer.x += (pointer.tx - pointer.x) * follow;
    pointer.y += (pointer.ty - pointer.y) * follow;

    const steps = 2;
    for (let s = 0; s < steps; s++) simulate(dt / steps);

    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      const m = b.mesh;
      m.position.set(b.x, b.y, b.z);
      // Roll in the direction of travel, plus a slow drift of its own.
      const vx = b.x - b.px;
      const vy = b.y - b.py;
      const speed = Math.hypot(vx, vy);
      if (speed > 1e-5) {
        tmpAxis.set(-vy, vx, 0).normalize();
        tmpQ.setFromAxisAngle(tmpAxis, (speed * steps) / b.r);
        m.quaternion.premultiply(tmpQ);
      }
      tmpQ.setFromAxisAngle(b.spin, b.spinSpeed * dt);
      m.quaternion.premultiply(tmpQ);
    }

    glow.position.set(pointer.x, Math.max(-halfH, Math.min(halfH, pointer.y)), 4.5);
    camera.position.x += (pointer.x * 0.05 - camera.position.x) * 0.04;
    camera.position.y += (Math.max(-halfH, Math.min(halfH, pointer.y)) * 0.05 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
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

  let started = false;
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
      setRunning(visible && !document.hidden);
    },
    dispose() {
      setRunning(false);
      visibility.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
