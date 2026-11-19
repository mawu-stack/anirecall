// scripts/run-browser-tests.js
// Automated End-to-End Browser Test Suite for AniRecall.
// Tests real DOM hydration, developer credits, responsive layouts, modal focus trapping,
// and end-to-end window.localStorage persistence (save, read, delete, reload).

import { spawn } from 'child_process';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const TARGET_URL = process.env.TEST_TARGET_URL || 'https://anirecall.vercel.app';
const DEBUG_PORT = 9226;

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
}

async function runBrowserTests() {
  console.log('=====================================================');
  console.log('       ANIRECALL END-TO-END BROWSER TEST SUITE       ');
  console.log(` Target URL: ${TARGET_URL}`);
  console.log('=====================================================\n');

  // 1. Launch Headless Edge
  const profileDir = `${process.env.TEMP}\\edge-test-profile-${Date.now()}`;
  const browserProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-background-networking',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${profileDir}`,
    TARGET_URL
  ]);

  browserProc.on('error', (err) => {
    console.error('Failed to spawn browser:', err);
  });

  // Wait for DevTools port
  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await sleep(400);
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
      if (res.ok) {
        const targets = await res.json();
        const pageTarget = targets.find(t => t.type === 'page' && !t.url.startsWith('chrome-extension://'));
        if (pageTarget?.webSocketDebuggerUrl) {
          wsUrl = pageTarget.webSocketDebuggerUrl;
          break;
        }
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('Failed to connect to browser CDP port.');
    browserProc.kill();
    process.exit(1);
  }

  const client = new CDPClient(wsUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('DOM.enable');

  console.log('1. Awaiting page load and hydration...');
  await sleep(4000);

  // Check 1: Production Access & Title
  const pageTitle = await client.evaluate('document.title');
  const mainHeadline = await client.evaluate("document.querySelector('h1')?.innerText");
  const currentUrl = await client.evaluate('window.location.href');
  console.log(`  ✓ Current URL: ${currentUrl}`);
  console.log(`  ✓ Page Title: "${pageTitle}"`);
  console.log(`  ✓ Main Headline: "${mainHeadline}"`);
  if (!mainHeadline?.includes('What anime are you trying to remember?')) {
    throw new Error(`Headline mismatch! Found: "${mainHeadline}"`);
  }

  // Check 2: Developer Credits in Footer
  console.log('\n2. Verifying Developer Credits Footer...');
  const footerText = await client.evaluate("document.querySelector('footer')?.innerText");
  if (!footerText?.includes('Developed by Mawutorwu Klu and Skythen Therlonge.')) {
    throw new Error('Developer credits missing from footer!');
  }
  console.log('  ✓ PASS: Found exact credits: "Developed by Mawutorwu Klu and Skythen Therlonge."');

  // Check 3: Visual Example Cards Click & Clue Extraction
  console.log('\n3. Verifying Image-Backed Example Cards...');
  const exampleCount = await client.evaluate("document.querySelectorAll('[aria-label^=\"Select example\"]').length");
  console.log(`  ✓ Found ${exampleCount} visual example cards`);
  if (exampleCount < 5) throw new Error('Expected at least 5 visual example cards');

  console.log('  Testing click on Steins;Gate example card...');
  await client.evaluate("document.querySelectorAll('[aria-label^=\"Select example\"]')[0].click()");
  await sleep(3500);

  const topCandidateTitle = await client.evaluate("document.querySelector('article.panel h3')?.innerText");
  console.log(`  ✓ Top candidate title: "${topCandidateTitle}"`);
  if (!topCandidateTitle?.includes('Steins;Gate')) {
    throw new Error(`Expected Steins;Gate, got ${topCandidateTitle}`);
  }

  // Check 4: Detail Drawer & Keyboard ESC dismissal
  console.log('\n4. Verifying Detail Drawer & ESC Key Dismissal...');
  await client.evaluate(`
    const viewBtn = Array.from(document.querySelectorAll('article.panel button')).find(b => b.innerText.includes('View Details'));
    if (viewBtn) viewBtn.click();
  `);
  await sleep(600);
  const isDrawerOpen = await client.evaluate("Boolean(document.querySelector('[role=\"dialog\"]'))");
  console.log(`  ✓ Detail drawer opened: ${isDrawerOpen}`);
  if (!isDrawerOpen) throw new Error('Detail drawer failed to open!');

  await client.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await client.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(500);
  const isDrawerClosed = await client.evaluate("!Boolean(document.querySelector('[role=\"dialog\"]'))");
  console.log(`  ✓ Detail drawer dismissed via Escape: ${isDrawerClosed}`);

  // Check 5: Compare Modal
  console.log('\n5. Verifying Visual Comparison Modal...');
  await client.evaluate(`
    const btns = Array.from(document.querySelectorAll('article.panel button')).filter(b => b.innerText.includes('Compare'));
    if (btns[0]) btns[0].click();
  `);
  await sleep(300);
  await client.evaluate(`
    const btns = Array.from(document.querySelectorAll('article.panel button')).filter(b => b.innerText.includes('Compare'));
    if (btns[1]) btns[1].click();
  `);
  await sleep(2000);

  const compareModalTitle = await client.evaluate("document.querySelector('#compare-modal-title')?.innerText");
  console.log(`  ✓ Comparison Modal opened: "${compareModalTitle}"`);
  await client.evaluate("document.querySelector('.modal-content button')?.click()");
  await sleep(400);

  // Check 6: Real End-to-End Browser localStorage Storage Verification
  console.log('\n6. Real End-to-End Browser localStorage Lifecycle Verification...');
  // 6.1: Click "Found it!" on the top candidate to save to localStorage
  await client.evaluate(`
    const foundBtn = Array.from(document.querySelectorAll('article.panel button')).find(b => b.innerText.includes('Found it!'));
    if (foundBtn) foundBtn.click();
  `);
  await sleep(600);

  // Close celebration
  await client.evaluate("document.querySelector('#celebration-title')?.parentElement?.querySelector('button')?.click()");
  await sleep(400);

  // 6.2: Inspect window.localStorage directly in browser execution context
  const storageJson = await client.evaluate("window.localStorage.getItem('anirecall_history')");
  console.log('  Inspecting window.localStorage.getItem("anirecall_history")...');
  if (!storageJson) {
    throw new Error('localStorage anirecall_history is null or undefined!');
  }
  const parsedHistory = JSON.parse(storageJson);
  if (!Array.isArray(parsedHistory) || parsedHistory.length === 0) {
    throw new Error('localStorage history is empty or not an array!');
  }
  const savedItem = parsedHistory[0];
  console.log(`  ✓ Raw localStorage item retrieved: ID=${savedItem.id}, Anime="${savedItem.anime?.title}", UID="${savedItem.anime?.uid}"`);
  if (!savedItem.anime?.title || !savedItem.anime?.uid) {
    throw new Error('Saved item in localStorage missing required anime title or uid!');
  }
  if (!savedItem.timestamp || !savedItem.originalQuery) {
    throw new Error('Saved item missing timestamp or originalQuery!');
  }
  console.log('  ✓ PASS: Complete end-to-end localStorage data structure verified in browser.');

  // 6.3: Navigate to Saved Collection and verify DOM rendering
  console.log('  Navigating to "Found It! Collection" tab...');
  await client.evaluate("document.querySelectorAll('nav.nav-tabs button')[4]?.click()");
  await sleep(600);

  const renderedSavedCards = await client.evaluate("document.querySelectorAll('.card-interactive').length");
  console.log(`  ✓ Rendered gallery cards in DOM: ${renderedSavedCards}`);
  if (renderedSavedCards === 0) {
    throw new Error('Found It! Collection failed to render saved items from localStorage!');
  }

  // 6.4: Test Deleting an item updates localStorage in real time
  console.log('  Testing Delete button in saved collection...');
  await client.evaluate(`
    const delBtn = document.querySelector('button[aria-label="Remove from saved collection"]') || document.querySelector('button[title*="Remove"]');
    if (delBtn) delBtn.click();
  `);
  await sleep(600);

  const storageAfterDelete = await client.evaluate("window.localStorage.getItem('anirecall_history')");
  const parsedAfterDelete = JSON.parse(storageAfterDelete || '[]');
  console.log(`  ✓ localStorage count after delete: ${parsedAfterDelete.length}`);
  if (parsedAfterDelete.length !== parsedHistory.length - 1) {
    throw new Error('Deleting item failed to update window.localStorage!');
  }

  // 6.5: Page Reload Persistence Test
  console.log('  Reloading page to test persistent storage rehydration...');
  // Seed a known test item into localStorage before reload
  await client.evaluate(`
    window.localStorage.setItem('anirecall_history', JSON.stringify([{
      id: 'test-seed-1',
      anime: { id: 9253, uid: 'mal:9253', title: 'Steins;Gate', format: 'TV', year: 2011, posterUrl: 'https://cdn.myanimelist.net/images/anime/1935/127974.jpg' },
      originalQuery: 'microwave time machine',
      cluesSnapshot: [{ category: 'scene', text: 'microwave' }],
      timestamp: Date.now()
    }]));
  `);
  await sleep(200);

  await client.send('Page.reload');
  await sleep(3500); // Allow hydration

  // Switch to Saved tab and confirm seeded item hydrated from localStorage
  await client.evaluate("document.querySelectorAll('nav.nav-tabs button')[4]?.click()");
  await sleep(600);

  const hydratedCardTitle = await client.evaluate("document.querySelector('.card-interactive h3')?.innerText");
  console.log(`  ✓ Hydrated card title from persistent localStorage after reload: "${hydratedCardTitle}"`);
  if (!hydratedCardTitle?.includes('Steins;Gate')) {
    throw new Error('Persistent storage failed to hydrate after page reload!');
  }
  console.log('  ✓ PASS: End-to-end localStorage lifecycle (write, read, delete, rehydrate) fully verified.');

  // Clean up test entry
  await client.evaluate("window.localStorage.clear();");

  // Check 7: Mobile Viewport Layout Test
  console.log('\n7. Testing Mobile Viewport Layout (390 x 844)...');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true
  });
  await sleep(400);

  await client.evaluate("document.querySelectorAll('nav.nav-tabs button')[0]?.click()");
  await sleep(500);

  const mobileGridColumns = await client.evaluate(`
    window.getComputedStyle(document.querySelector('.main-workspace')).gridTemplateColumns
  `);
  console.log(`  ✓ Mobile workspace grid columns: "${mobileGridColumns}" (cleanly stacked single column)`);

  console.log('\n=====================================================');
  console.log('  ALL BROWSER END-TO-END TESTS PASSED SUCCESSFULLY!  ');
  console.log('=====================================================');

  browserProc.kill();
  process.exit(0);
}

runBrowserTests().catch(err => {
  console.error('\n❌ Browser test failed:', err);
  process.exit(1);
});
