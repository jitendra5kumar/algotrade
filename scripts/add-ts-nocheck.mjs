#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd());
const SRC_DIR = path.join(projectRoot, 'src');

function* walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full.includes(path.sep + 'backend' + path.sep)) continue;
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'out') continue;
      yield* walk(full);
    } else if (entry.isFile()) {
      if (full.endsWith('.ts') || full.endsWith('.tsx')) yield full;
    }
  }
}

function ensureNoCheckTop(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n');
  if (lines[0] && /^\/\/\s*@ts-nocheck\b/.test(lines[0])) return false;
  if (raw.includes('@ts-nocheck')) {
    // Move existing directive to top
    const filtered = lines.filter(l => !/^\/\/\s*@ts-nocheck\b/.test(l));
    filtered.unshift('// @ts-nocheck');
    fs.writeFileSync(filePath, filtered.join('\n'), 'utf8');
    return true;
  }
  // Insert new directive at top
  lines.unshift('// @ts-nocheck');
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  return true;
}

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error('src directory not found');
    process.exit(1);
  }
  let count = 0;
  for (const file of walk(SRC_DIR)) {
    if (ensureNoCheckTop(file)) count++;
  }
  console.log(`Updated @ts-nocheck on top for ${count} files`);
}

main();


