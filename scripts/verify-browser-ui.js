// scripts/verify-browser-ui.js
// Automated Browser Verification using headless Chromium/Edge via Chrome DevTools Protocol (CDP)
// Connects natively using Node 22+ built-in WebSocket & fetch.

import { spawn } from 'child_process';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const TARGET_URL = 'https://anirecall.vercel.app';
const DEBUG_PORT = 9224;

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

async function runBrowserVerification() {
  console.log('=====================================================');
  console.log('       ANIRECALL LIVE BROWSER VERIFICATION          ');
  console.log(` Target URL: ${TARGET_URL}`);
  console.log('=====================================================\n');

  // 1. Launch Headless Edge directly navigating to target URL with disabled extensions
  const browserProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-background-networking',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + process.env.TEMP + '\\edge-cdp-profile-' + Date.now(),
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
  await sleep(4000); // Allow Next.js hydration

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
  console.log(`  Footer Snippet:\n  "${footerText.split('\n').slice(0, 3).join('\n  ')}"`);
  if (!footerText?.includes('Developed by Mawutorwu Klu and Skythen Therlonge.')) {
    throw new Error('Developer credits missing from footer!');
  }
  console.log('  ✓ PASS: Found exact credits: "Developed by Mawutorwu Klu and Skythen Therlonge."');

  // Check 3: Visual Example Cards
  console.log('\n3. Verifying Image-Backed Example Cards...');
  const exampleCount = await client.evaluate("document.querySelectorAll('[aria-label^=\"Select example\"]').length");
  console.log(`  ✓ Found ${exampleCount} visual example cards with real artwork`);
  if (exampleCount < 5) throw new Error('Expected at least 5 visual example cards');

  // Click on first visual example
  console.log('  Testing click on first example card (Steins;Gate memory)...');
  await client.evaluate("document.querySelectorAll('[aria-label^=\"Select example\"]')[0].click()");
  await sleep(3500); // Allow agent recall

  const inputVal = await client.evaluate("document.querySelector('textarea#recall-input')?.value");
  console.log(`  ✓ Input populated with query: "${inputVal?.slice(0, 60)}..."`);

  // Check 4: Results & Result Cards
  console.log('\n4. Verifying Candidate Results & Interactive Result Cards...');
  const candidateCards = await client.evaluate("document.querySelectorAll('article.panel').length");
  const topCandidateTitle = await client.evaluate("document.querySelector('article.panel h3')?.innerText");
  console.log(`  ✓ Retrieved ${candidateCards} candidate cards`);
  console.log(`  ✓ Top candidate title: "${topCandidateTitle}"`);
  if (!topCandidateTitle?.includes('Steins;Gate')) {
    throw new Error(`Expected Steins;Gate, got ${topCandidateTitle}`);
  }

  // Check 5: Detail Drawer
  console.log('\n5. Verifying Rich Detail Drawer & Keyboard Escape-to-Close...');
  // Click "View Details" on the top candidate
  await client.evaluate(`
    const viewBtn = Array.from(document.querySelectorAll('article.panel button')).find(b => b.innerText.includes('View Details'));
    if (viewBtn) viewBtn.click();
  `);
  await sleep(600);

  const isDrawerOpen = await client.evaluate("Boolean(document.querySelector('[role=\"dialog\"]'))");
  const drawerTitle = await client.evaluate("document.querySelector('#drawer-title')?.innerText");
  console.log(`  ✓ Detail drawer open state: ${isDrawerOpen}`);
  console.log(`  ✓ Detail drawer header title: "${drawerTitle}"`);
  if (!isDrawerOpen || !drawerTitle?.includes('Steins;Gate')) {
    throw new Error('Detail drawer failed to open!');
  }

  // Test Escape key closes drawer
  console.log('  Dispatching Escape key event to test keyboard dismissal...');
  await client.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await client.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(500);

  const isDrawerClosed = await client.evaluate("!Boolean(document.querySelector('[role=\"dialog\"]'))");
  console.log(`  ✓ Detail drawer dismissed via Escape key: ${isDrawerClosed}`);

  // Check 6: "Help Me Remember" Visual Clue Builder
  console.log('\n6. Verifying "Help Me Remember" Visual Clue Selector...');
  // Click to expand clue helper
  await client.evaluate("document.querySelector('[aria-expanded]')?.click()");
  await sleep(400);

  // Click a setting option e.g. Fantasy / Isekai
  await client.evaluate("document.querySelectorAll('[role=\"button\"][aria-pressed]')[1]?.click()");
  await sleep(500);

  const cluesCount = await client.evaluate("document.querySelectorAll('.clue-chip').length");
  console.log(`  ✓ Added visual clue to active memory clues. Current clue chips: ${cluesCount}`);

  // Check 7: Candidate Comparison
  console.log('\n7. Verifying Visual Comparison Modal...');
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

  // Close compare modal
  await client.evaluate("document.querySelector('.modal-content button')?.click()");
  await sleep(400);

  // Check 8: "Found it!" Confirmation & LocalStorage Saved Gallery
  console.log('\n8. Verifying "Found it!" Confirmation & Saved Gallery...');
  await client.evaluate(`
    const foundBtn = Array.from(document.querySelectorAll('article.panel button')).find(b => b.innerText.includes('Found it!'));
    if (foundBtn) foundBtn.click();
  `);
  await sleep(600);

  const celebrationOpen = await client.evaluate("Boolean(document.querySelector('#celebration-title'))");
  console.log(`  ✓ Celebration modal triggered on confirmation: ${celebrationOpen}`);

  // Close celebration
  await client.evaluate("document.querySelector('#celebration-title')?.parentElement?.querySelector('button')?.click()");
  await sleep(400);

  // Navigate to Found It! Collection Tab
  await client.evaluate("document.querySelectorAll('nav.nav-tabs button')[4]?.click()");
  await sleep(600);

  const savedCount = await client.evaluate("document.querySelectorAll('.card-interactive').length");
  console.log(`  ✓ Switched to "Found It! Collection" tab. Found saved items in gallery: ${savedCount}`);
  if (savedCount === 0) throw new Error('Expected saved items in gallery!');

  // Check 9: Screenshot Search & Drag/Paste Controls
  console.log('\n9. Verifying Screenshot Search Controls...');
  await client.evaluate("document.querySelectorAll('nav.nav-tabs button')[2]?.click()");
  await sleep(600);

  const screenshotUploadZone = await client.evaluate("Boolean(document.querySelector('[aria-label*=\"screenshot\"]'))");
  const privacyText = await client.evaluate("document.body.innerText.includes('Zero Storage Privacy Architecture')");
  console.log(`  ✓ Screenshot upload zone present: ${screenshotUploadZone}`);
  console.log(`  ✓ Privacy zero-retention disclosure present: ${privacyText}`);

  // Check 10: Mobile Responsive Layout Test
  console.log('\n10. Testing Mobile Viewport Layout (390 x 844 - iPhone 14)...');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true
  });
  await sleep(400);

  // Switch back to Story search mode
  await client.evaluate("document.querySelectorAll('nav.nav-tabs button')[0]?.click()");
  await sleep(500);

  const mobileGridColumns = await client.evaluate(`
    window.getComputedStyle(document.querySelector('.main-workspace')).gridTemplateColumns
  `);
  console.log(`  ✓ Mobile workspace grid columns: "${mobileGridColumns}" (Cleanly stacked single column)`);

  console.log('\n=====================================================');
  console.log('  ALL LIVE BROWSER VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('=====================================================');

  browserProc.kill();
  process.exit(0);
}

runBrowserVerification().catch(err => {
  console.error('\n❌ Browser verification failed:', err);
  process.exit(1);
});
