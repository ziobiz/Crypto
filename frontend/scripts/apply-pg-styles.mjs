import fs from 'fs';
import path from 'path';

const root = new URL('../src/app/dashboard', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const replacements = [
  ['rounded-lg border border-gray-200 bg-white p-6 space-y-5', 'pg-section pg-section-pad space-y-3'],
  ['rounded-lg border border-gray-200 bg-white p-6 space-y-4', 'pg-section pg-section-pad space-y-3'],
  ['mt-1 w-full rounded-lg border px-3 py-2 text-sm', 'pg-input mt-1'],
  ['mt-1 w-full rounded-lg border px-3 py-2 font-mono text-xs', 'pg-input mt-1 font-mono'],
  ['mt-1 w-full rounded-lg border px-3 py-2', 'pg-input mt-1'],
  ['w-full rounded-lg border px-3 py-2 text-sm', 'pg-input'],
  ['w-full rounded-lg border border-gray-200 px-3 py-2 text-sm', 'pg-input'],
  [
    'rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50',
    'pg-btn pg-btn-primary disabled:opacity-50',
  ],
  [
    'rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50',
    'pg-btn pg-btn-secondary disabled:opacity-50',
  ],
  ['rounded-lg border border-gray-300 px-3 py-2 text-sm', 'pg-input'],
  ['className="min-w-full divide-y divide-gray-200 text-sm"', 'className="pg-table"'],
  ['className="min-w-full text-sm"', 'className="pg-table"'],
  ['rounded-xl border bg-white p-6', 'pg-section pg-section-pad'],
  ['rounded-lg border px-3 py-2 text-sm', 'pg-input'],
  ['rounded-lg border border-gray-200 bg-white p-6', 'pg-section pg-section-pad'],
  ['rounded-lg border border-gray-200 bg-white p-4', 'pg-card pg-card-body'],
  ['rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700', 'pg-btn pg-btn-primary'],
  ['rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50', 'pg-btn pg-btn-primary disabled:opacity-50'],
  ['rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50', 'pg-btn pg-btn-primary disabled:opacity-50'],
  ['text-sm font-medium text-gray-700', 'text-[11px] font-semibold text-gray-700'],
  ['flex items-center gap-2 text-sm font-medium', 'flex items-center gap-2 text-[11px] font-medium'],
  ['mt-1 w-56 rounded-lg border px-3 py-2', 'pg-input mt-1 w-56'],
];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    if (fs.statSync(file).isDirectory()) walk(file);
    else if (file.endsWith('.tsx')) {
      let content = fs.readFileSync(file, 'utf8');
      const original = content;
      for (const [from, to] of replacements) {
        content = content.split(from).join(to);
      }
      if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('updated', file);
      }
    }
  }
}

walk(root);
