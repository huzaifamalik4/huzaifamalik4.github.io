// A small driver for headless Chrome over the DevTools protocol, shared by the
// screenshot scripts in this folder.
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const OUT = path.resolve('tools/shots');

// Stops if a browser is already answering on the port. Without this a script would drive
// whichever browser got there first, which may belong to another program.
export async function ensurePortFree(port) {
  let taken = false;
  try {
    await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(1500) });
    taken = true;
  } catch { /* nothing answers: the port is ours to use */ }
  if (taken) throw new Error(`Port ${port} already has a browser on it. Close that browser or use another port.`);
}

export async function withPage({ width = 1440, height = 900, mobile = false, port = 9340, scale = mobile ? 2 : 1, preload = '' }, run) {
  await mkdir(OUT, { recursive: true });
  await ensurePortFree(port);
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=D:/tmp/hm-cdp-${port}`, '--hide-scrollbars', '--mute-audio', 'about:blank',
  ], { stdio: 'ignore' });
  try {
    let target;
    for (let i = 0; i < 40 && !target; i++) {
      await sleep(250);
      try {
        target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page');
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
      else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') errors.push(`${msg.params.entry.text} ${msg.params.entry.url || ''}`);
      else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map((a) => a.value || a.description || '').join(' '));
    };
    const send = (method, params = {}) => new Promise((resolve) => { id += 1; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); });
    const page = {
      errors,
      send,
      async evaluate(expression) {
        const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
        if (res.result?.exceptionDetails) errors.push(`evaluate: ${res.result.exceptionDetails.exception?.description || res.result.exceptionDetails.text}`);
        return res.result?.result?.value;
      },
      async goto(url, wait = 6000) {
        await send('Page.navigate', { url });
        await sleep(wait);
      },
      async shot() {
        const res = await send('Page.captureScreenshot', { format: 'png' });
        return Buffer.from(res.result.data, 'base64');
      },
      async save(name) {
        const file = path.join(OUT, name);
        await writeFile(file, await this.shot());
        return file;
      },
      move: (x, y) => send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }),
      async click(x, y) {
        await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
        await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
      },
      scrollTo: (y) => page.evaluate(`window.scrollTo(0, ${Math.round(y)})`),
    };
    await send('Runtime.enable');
    await send('Log.enable');
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile });
    if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true });
    if (preload) await send('Page.addScriptToEvaluateOnNewDocument', { source: preload });
    const result = await run(page);
    ws.close();
    return result;
  } finally {
    chrome.kill();
  }
}

// Tiles screenshots into one sheet so a sequence can be read at a glance.
export async function sheet(name, frames, { perRow = 4, tileWidth = 480 } = {}) {
  const meta = await sharp(frames[0]).metadata();
  const tw = tileWidth;
  const th = Math.round((tileWidth * meta.height) / meta.width);
  const tiles = await Promise.all(frames.map((buffer) => sharp(buffer).resize(tw, th).toBuffer()));
  const rows = Math.ceil(frames.length / perRow);
  const file = path.join(OUT, name);
  await sharp({ create: { width: perRow * (tw + 6) + 6, height: rows * (th + 6) + 6, channels: 3, background: '#ff3b8d' } })
    .composite(tiles.map((input, i) => ({ input, left: 6 + (i % perRow) * (tw + 6), top: 6 + Math.floor(i / perRow) * (th + 6) })))
    .jpeg({ quality: 84 })
    .toFile(file);
  return file;
}

// Stores the theme before the page loads, the way an earlier visit would have.
export const presets = ({ theme } = {}) => `try {
  ${theme ? `localStorage.setItem('hm-theme', ${JSON.stringify(theme)});` : `localStorage.removeItem('hm-theme');`}
} catch (e) {}`;
