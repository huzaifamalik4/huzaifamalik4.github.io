// Screenshots the local preview at a given viewport by driving headless Chrome over CDP,
// then tiles the frames into one contact sheet for review.
// Usage: node tools/shoot.mjs <width> <height> <name> [mobile]
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const [width = '390', height = '844', name = 'mobile', mobileFlag] = process.argv.slice(2);
const W = Number(width);
const H = Number(height);
const mobile = mobileFlag === 'mobile';
const URL_ = process.env.SHOOT_URL || 'http://localhost:4173/';
const OUT = path.resolve('tools/shots');
const PORT = 9333;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await mkdir(OUT, { recursive: true });

const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=D:/tmp/hm-shot-profile',
  '--hide-scrollbars',
  '--mute-audio',
  'about:blank',
], { stdio: 'ignore' });

try {
  let target;
  for (let i = 0; i < 40 && !target; i++) {
    await sleep(250);
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      target = list.find((t) => t.type === 'page');
    } catch { /* not up yet */ }
  }
  if (!target) throw new Error('Chrome did not start');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0;
  const pending = new Map();
  const errors = [];
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      errors.push(`${msg.params.entry.text} ${msg.params.entry.url || ''}`);
    }
  };
  const send = (method, params = {}) => new Promise((resolve) => {
    id += 1;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res.result?.result?.value;
  };

  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: mobile ? 2 : 1, mobile });
  if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await send('Page.navigate', { url: URL_ });
  await sleep(6500);

  const total = await evaluate('document.documentElement.scrollHeight');
  const frames = [];
  const step = Math.round(H * 0.92);
  for (let y = 0, n = 0; y < total && n < 40; y += step, n++) {
    await evaluate(`window.scrollTo(0, ${y})`);
    await sleep(1500);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    frames.push(Buffer.from(shot.result.data, 'base64'));
  }

  const fps = await evaluate(`new Promise((resolve) => {
    window.scrollTo(0, 0);
    setTimeout(() => {
      let n = 0; const t0 = performance.now();
      const tick = () => { n++; performance.now() - t0 < 2000 ? requestAnimationFrame(tick) : resolve(Math.round(n / 2)); };
      requestAnimationFrame(tick);
    }, 800);
  })`);
  const overflow = await evaluate('document.documentElement.scrollWidth - window.innerWidth');

  // Contact sheet: frames side by side, a few per row.
  const scale = W > 800 ? 0.34 : 0.5;
  const tw = Math.round(W * scale);
  const th = Math.round(H * scale);
  const perRow = W > 800 ? 3 : 6;
  const sheets = [];
  for (let start = 0; start < frames.length; start += perRow * 2) {
    const group = frames.slice(start, start + perRow * 2);
    const rows = Math.ceil(group.length / perRow);
    const tiles = await Promise.all(group.map((buf) => sharp(buf).resize(tw, th).toBuffer()));
    const file = path.join(OUT, `${name}-${String(sheets.length + 1).padStart(2, '0')}.jpg`);
    await sharp({ create: { width: perRow * (tw + 8) + 8, height: rows * (th + 8) + 8, channels: 3, background: '#ff3b8d' } })
      .composite(tiles.map((input, i) => ({ input, left: 8 + (i % perRow) * (tw + 8), top: 8 + Math.floor(i / perRow) * (th + 8) })))
      .jpeg({ quality: 82 })
      .toFile(file);
    sheets.push(file);
  }
  await writeFile(path.join(OUT, `${name}-first.png`), frames[0]);

  console.log(JSON.stringify({ viewport: `${W}x${H}`, pageHeight: total, frames: frames.length, fps, horizontalOverflow: overflow, errors, sheets }, null, 2));
  ws.close();
} finally {
  chrome.kill();
}
