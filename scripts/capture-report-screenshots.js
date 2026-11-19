// scripts/capture-report-screenshots.js
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const TARGET_URL = 'https://anirecall.vercel.app';
const DEBUG_PORT = 9227;

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 0;
    this.pending = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = ++this.msgId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res?.result?.value;
  }

  async captureScreenshot(outputPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    if (res?.data) {
      fs.writeFileSync(outputPath, Buffer.from(res.data, 'base64'));
      console.log(`Saved screenshot to ${outputPath}`);
    }
  }
}

async function captureScreenshots() {
  const profileDir = `${process.env.TEMP}\\edge-report-profile-${Date.now()}`;
  const browserProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--headless=new',
    '--window-size=1280,900',
    '--disable-gpu',
    '--no-first-run',
    `--user-data-dir=${profileDir}`,
    TARGET_URL
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await sleep(400);
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
      if (res.ok) {
        const targets = await res.json();
        const pageTarget = targets.find(t => t.type === 'page');
        if (pageTarget?.webSocketDebuggerUrl) {
          wsUrl = pageTarget.webSocketDebuggerUrl;
          break;
        }
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    throw new Error('Could not connect to Edge DevTools');
  }

  const client = new CDPClient(wsUrl);
  await client.connect();
  await client.send('Page.enable');

  await sleep(3000);

  // 1. Screenshot 1: Homepage
  const reportDir = path.resolve('report');
  await client.captureScreenshot(path.join(reportDir, 'screenshot-home.png'));

  // 2. Click an example card to load results
  await client.evaluate(`
    const steinsCard = Array.from(document.querySelectorAll('[aria-label^="Select example"]')).find(el => el.innerText.includes('Microwave') || el.innerText.includes('Steins'));
    if (steinsCard) steinsCard.click();
  `);

  for (let i = 0; i < 30; i++) {
    await sleep(500);
    const hasCandidates = await client.evaluate("Boolean(document.querySelector('article.panel h3'))");
    if (hasCandidates) break;
  }
  await sleep(1000);

  // Screenshot 2: Results View
  await client.captureScreenshot(path.join(reportDir, 'screenshot-results.png'));

  // 3. Open Detail Drawer
  await client.evaluate(`
    const viewBtn = Array.from(document.querySelectorAll('article.panel button')).find(b => b.innerText.includes('View Details'));
    if (viewBtn) viewBtn.click();
  `);
  await sleep(800);

  // Screenshot 3: Detail Drawer View
  await client.captureScreenshot(path.join(reportDir, 'screenshot-drawer.png'));

  try {
    browserProc.kill();
  } catch (e) {}
}

captureScreenshots().catch(console.error);
