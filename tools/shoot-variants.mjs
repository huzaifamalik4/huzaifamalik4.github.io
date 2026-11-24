// Screenshots every alternative section layout for review.
// Usage: node tools/shoot-variants.mjs [width] [height] [mobile] [section,section...]
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const [width = '1440', height = '900', mobileFlag = '', only = ''] = process.argv.slice(2);
const W = Number(width);
const H = Number(height);
const mobile = mobileFlag === 'mobile';
const dark = process.env.SHOOT_THEME === 'dark'; // SHOOT_THEME=dark photographs the dark theme
const OUT = path.resolve('tools/shots');
const PORT = 9335;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PLAN = {
  work: { variants: ['b', 'c', 'd'], frames: 3 },
  about: { variants: ['b', 'c'], frames: 2 },
  services: { variants: ['b', 'c'], frames: 2 },
  experience: { variants: ['b', 'c'], frames: 2 },
  pricing: { variants: ['b', 'c'], frames: 2 },
  contact: { variants: ['b', 'c'], frames: 2 },
};
const sections = only ? only.split(',') : Object.keys(PLAN);

await mkdir(OUT, { recursive: true });
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', `--remote-debugging-port=${PORT}`, '--user-data-dir=D:/tmp/hm-variant-profile', '--hide-scrollbars', '--mute-audio', 'about:blank',
], { stdio: 'ignore' });

try {
  let target;
  for (let i = 0; i < 40 && !target; i++) {
    await sleep(250);
    try {
      target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === 'page');
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
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    else if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
  };
  const send = (method, params = {}) => new Promise((resolve) => { id += 1; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile });
  if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true });

  const scale = mobile ? 0.6 : 0.34;
  const tw = Math.round(W * scale);
  const th = Math.round(H * scale);
  let scriptId = null;

  for (const section of sections) {
    const { variants, frames } = PLAN[section];
    const tiles = [];
    for (const variant of variants) {
      if (scriptId) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: scriptId });
      const choices = JSON.stringify({ [section]: variant });
      scriptId = (await send('Page.addScriptToEvaluateOnNewDocument', {
        source: `try { localStorage.setItem('hm-design-choices', ${JSON.stringify(choices)}); sessionStorage.setItem('hm-design-picker', '1'); ${dark ? `localStorage.setItem('hm-theme', 'dark');` : `localStorage.removeItem('hm-theme');`} } catch (e) {}`,
      })).result.identifier;
      await send('Page.navigate', { url: `http://localhost:4173/?pick=1&v=${section}${variant}` });
      await sleep(4200);
      await evaluate(`(() => { const p = document.querySelector('.picker'); if (p) p.style.display = 'none'; })()`);
      const applied = await evaluate(`document.querySelector('[data-section="${section}"]').dataset.variant`);
      if (applied !== variant) errors.push(`${section} ${variant}: page shows ${applied}`);
      const overflow = await evaluate('document.documentElement.scrollWidth - window.innerWidth');
      if (overflow > 1) errors.push(`${section} ${variant}: ${overflow}px sideways overflow`);
      const top = await evaluate(`(() => { const el = document.querySelector('[data-section="${section}"]'); return el.getBoundingClientRect().top + window.scrollY; })()`);
      const sectionHeight = await evaluate(`document.querySelector('[data-section="${section}"]').offsetHeight`);
      for (let f = 0; f < frames; f++) {
        // Spread the frames over the section, so long layouts are seen top to bottom.
        const span = Math.max(0, sectionHeight - H * 0.7);
        const y = Math.round(top - 30 + (frames > 1 ? (span * f) / (frames - 1) : 0));
        await evaluate(`window.scrollTo(0, ${y})`);
        await sleep(1500);
        const shot = await send('Page.captureScreenshot', { format: 'png' });
        tiles.push(await sharp(Buffer.from(shot.result.data, 'base64')).resize(tw, th).toBuffer());
      }
    }
    const file = path.join(OUT, `variant-${section}${mobile ? '-mobile' : ''}${dark ? '-dark' : ''}.jpg`);
    await sharp({ create: { width: frames * (tw + 8) + 8, height: variants.length * (th + 8) + 8, channels: 3, background: '#ff3b8d' } })
      .composite(tiles.map((input, i) => ({ input, left: 8 + (i % frames) * (tw + 8), top: 8 + Math.floor(i / frames) * (th + 8) })))
      .jpeg({ quality: 84 })
      .toFile(file);
    console.log(section, '->', file);
  }
  console.log(errors.length ? `PROBLEMS:\n${errors.join('\n')}` : 'no script errors, no sideways overflow');
  ws.close();
} finally {
  chrome.kill();
}
