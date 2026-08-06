/**
 * Regenerates src/lib/icons.js from the lucide-react package.
 *
 * The app no longer depends on lucide-react at runtime — only the handful of
 * icons it actually draws are inlined into src/lib/icons.js as SVG markup. This
 * script is how that file is produced.
 *
 * To add an icon: append its lucide name to WANTED below, then
 *
 *   npm i -D --no-save lucide-react@0.469.0
 *   npm run icons
 *
 * and commit the regenerated src/lib/icons.js.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ESM = path.join(ROOT, 'node_modules/lucide-react/dist/esm');

/** Every icon the app draws, by its lucide-react export name. */
const WANTED = [
  'AlertTriangle', 'ArrowDownCircle', 'ArrowLeft', 'ArrowRight', 'ArrowUpCircle',
  'BadgeCheck', 'Banknote', 'Bell', 'BellRing', 'Briefcase',
  'CalendarCheck', 'CalendarDays', 'CheckCheck', 'CheckCircle2', 'ChevronRight',
  'CircleHelp', 'ClipboardList', 'Clock', 'Clock3', 'Compass', 'CreditCard',
  'Download', 'ExternalLink', 'Eye', 'EyeOff', 'FileText', 'Handshake', 'Home',
  'Hourglass', 'Image', 'ImagePlus', 'Inbox', 'Landmark', 'LayoutDashboard',
  'LayoutGrid', 'Link2', 'Loader2', 'LocateFixed', 'LogOut', 'Mail', 'MapPin',
  'Menu', 'MessageSquare', 'MessageSquareWarning', 'PackageSearch', 'Phone',
  'Plus', 'PlusCircle', 'RefreshCw', 'ScanLine', 'Search', 'ShieldCheck',
  'ShieldQuestion', 'ShieldX', 'SlidersHorizontal', 'Smartphone', 'Star', 'Tag',
  'Trash2', 'TrendingUp', 'User', 'UserCheck', 'UserCog', 'UserSearch', 'Users',
  'Wallet', 'Wrench', 'X', 'XCircle',
];

if (!fs.existsSync(ESM)) {
  console.error(
    'lucide-react is not installed. Run:\n  npm i -D --no-save lucide-react@0.469.0\nthen re-run this script.'
  );
  process.exit(1);
}

// 1. name -> icon file, from the barrel's alias re-exports. This is what maps
//    legacy names like Loader2 and CheckCircle2 onto their renamed source files.
const barrel = fs.readFileSync(path.join(ESM, 'lucide-react.js'), 'utf8');
const nameToFile = new Map();
for (const line of barrel.split('\n')) {
  const m = line.match(/^export \{(.+)\} from '\.\/icons\/(.+)\.js';$/);
  if (!m) continue;
  for (const spec of m[1].split(',')) {
    const alias = spec.trim().match(/^default as (\w+)$/);
    if (alias) nameToFile.set(alias[1], m[2]);
  }
}

const SELF_CLOSING = new Set(['path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse']);

/** Pull the node array out of an icon module. */
function nodesFor(file) {
  const src = fs.readFileSync(path.join(ESM, 'icons', `${file}.js`), 'utf8');
  const start = src.indexOf('createLucideIcon(');
  if (start === -1) throw new Error(`no createLucideIcon in ${file}`);
  const open = src.indexOf('[', start);
  let depth = 0;
  let end = -1;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']' && --depth === 0) {
      end = i;
      break;
    }
  }
  // The literal is plain JS data (arrays + object literals) from a local file.
  return eval(src.slice(open, end + 1));
}

function toSvgChildren(nodes) {
  return nodes
    .map(([tag, attrs]) => {
      const parts = [];
      for (const [k, v] of Object.entries(attrs)) {
        if (k === 'key') continue;
        // React attribute names are camelCase; SVG wants kebab-case.
        const name = /[A-Z]/.test(k) ? k.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase() : k;
        parts.push(`${name}="${String(v).replace(/"/g, '&quot;')}"`);
      }
      const open = `<${tag}${parts.length ? ` ${parts.join(' ')}` : ''}`;
      return SELF_CLOSING.has(tag) ? `${open}/>` : `${open}></${tag}>`;
    })
    .join('');
}

const entries = [];
const missing = [];
for (const name of WANTED) {
  const file = nameToFile.get(name);
  if (!file) {
    missing.push(name);
    continue;
  }
  entries.push([name, toSvgChildren(nodesFor(file))]);
}

if (missing.length) {
  console.error(`Not found in lucide-react: ${missing.join(', ')}`);
  process.exit(1);
}

entries.sort(([a], [b]) => a.localeCompare(b));

const body = entries.map(([n, c]) => `  ${n}: '${c.replace(/'/g, "\\'")}',`).join('\n');

const out = `// Generated from lucide-react v0.469.0 (ISC) — see scripts/gen-icons.mjs.
// Only the icons this app actually uses are inlined, which is why the runtime
// icon package could be dropped along with React.
//
// Do not hand-edit: run \`npm run icons\` to regenerate.
import { raw } from './dom.js';

const PATHS = {
${body}
};

const SVG_ATTRS =
  'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
  'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

/**
 * Inline SVG for one icon, as a raw (already-escaped) HTML fragment.
 * \`cls\` takes the same Tailwind sizing/colour classes the React icons took.
 */
export function icon(name, cls = 'h-5 w-5') {
  const children = PATHS[name];
  if (!children) throw new Error(\`Unknown icon: \${name}\`);
  return raw(
    \`<svg \${SVG_ATTRS} class="\${cls}" aria-hidden="true" focusable="false">\${children}</svg>\`
  );
}

export const iconNames = Object.keys(PATHS);
`;

fs.writeFileSync(path.join(ROOT, 'src/lib/icons.js'), out);
console.log(`Wrote ${entries.length} icons to src/lib/icons.js`);
