// Takes one screenshot of a local page: node tools/snap.mjs <path> <width> <height> <out.png> [css-to-hide]
// Used to make the concept project covers from the concept pages themselves.
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';

const [pagePath = '/', width = '1440', height = '810', out = 'tools/shots/snap.png', hide = ''] = process.argv.slice(2);
const PORT = 9334;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', `--remote-debugging-port=${PORT}`, '--user-data-dir=D:/tmp/hm-snap-profile', '--hide-scrollbars', 'about:blank',
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
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  };
  const send = (method, params = {}) => new Promise((resolve) => { id += 1; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); });

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: Number(width), height: Number(height), deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `http://localhost:4173${pagePath}` });
  await sleep(2500);
  if (hide) {
    await send('Runtime.evaluate', { expression: `document.querySelectorAll(${JSON.stringify(hide)}).forEach((el) => { el.style.display = 'none'; })` });
    await sleep(200);
  }
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(out, Buffer.from(shot.result.data, 'base64'));
  console.log('saved', out);
  ws.close();
} finally {
  chrome.kill();
}
