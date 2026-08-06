// Headless render smoke test.
//
// Loads the *built* production bundle into a jsdom document and mounts the app
// at a set of routes, failing on any uncaught error, console.error, or an empty
// #root. This catches render-time crashes (bad hooks, undefined access) that a
// successful `vite build` cannot.
//
// Usage: node smoke.mjs [dist] [/route,/route,...]
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';

const DIST = process.argv[2] || 'dist';
const ROUTES = process.argv[3] ? process.argv[3].split(',') : ['/'];

const assets = readdirSync(join(DIST, 'assets'));
const jsFile = assets.find((f) => f.endsWith('.js'));
const cssFile = assets.find((f) => f.endsWith('.css'));
const bundle = readFileSync(join(DIST, 'assets', jsFile), 'utf8');

let failures = 0;

for (const route of ROUTES) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (e) => errors.push(`jsdomError: ${e.message}`));
  virtualConsole.on('error', (...args) => errors.push(`console.error: ${args.join(' ')}`));

  const dom = new JSDOM(
    `<!doctype html><html><head>${cssFile ? '<style></style>' : ''}</head><body><div id="root"></div></body></html>`,
    {
      url: `http://localhost${route}`,
      runScripts: 'outside-only',
      pretendToBeVisual: true,
      virtualConsole,
    }
  );

  const { window } = dom;
  // The app talks to the API on mount; keep the test offline and deterministic.
  window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  window.scrollTo = () => {};

  try {
    window.eval(bundle);
  } catch (e) {
    errors.push(`eval threw: ${e.message}`);
  }

  // Let effects and microtasks flush.
  await new Promise((r) => setTimeout(r, 600));

  const root = window.document.getElementById('root');
  const html = root ? root.innerHTML : '';
  const text = (root?.textContent || '').replace(/\s+/g, ' ').trim();

  const ok = html.length > 0 && errors.length === 0;
  if (!ok) failures++;

  console.log(`\n${ok ? 'PASS' : 'FAIL'}  ${route}`);
  console.log(`  rendered: ${html.length} bytes of DOM`);
  if (text) console.log(`  text: ${text.slice(0, 160)}${text.length > 160 ? '…' : ''}`);
  for (const e of errors.slice(0, 6)) console.log(`  ! ${e.slice(0, 300)}`);

  dom.window.close();
}

console.log(`\n${failures === 0 ? 'ALL ROUTES RENDERED' : `${failures} ROUTE(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
