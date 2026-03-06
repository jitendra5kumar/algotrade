#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd());
const SRC_DIR = path.join(projectRoot, 'src');

const DRY_RUN = process.argv.includes('--dry');
const ADD_TS_NOCHECK = process.argv.includes('--nocheck');

/**
 * Detect whether a file appears to contain JSX/React code
 */
function isLikelyJsx(content) {
  if (/from\s+['\"]react['\"];?/.test(content)) return true;
  if (/React\./.test(content)) return true;
  if (/<[A-Z][A-Za-z0-9]*\b[^>]*>/.test(content)) return true; // heuristic: PascalCase JSX
  return false;
}

/**
 * Walk a directory recursively and yield .js/.jsx files
 */
function* walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip backend
      if (full.includes(path.sep + 'backend' + path.sep)) continue;
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'out') continue;
      yield* walk(full);
    } else if (entry.isFile()) {
      if (full.endsWith('.js') || full.endsWith('.jsx')) {
        yield full;
      }
    }
  }
}

function ensureTsNoCheckPrefixed(content) {
  // Ensure ts-nocheck is the very first line (TypeScript requires first line)
  if (/^\/\/\s*@ts-nocheck\b/m.test(content.split('\n')[0] ?? '')) return content;
  const lines = content.split('\n');
  lines.unshift('// @ts-nocheck');
  return lines.join('\n');
}

function convertFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const jsx = filePath.endsWith('.jsx') || isLikelyJsx(raw);
  const newExt = jsx ? '.tsx' : '.ts';
  const newPath = filePath.replace(/\.(jsx?|tsx?)$/i, newExt);

  let nextContent = raw;
  if (ADD_TS_NOCHECK) {
    nextContent = ensureTsNoCheckPrefixed(nextContent);
  }

  if (DRY_RUN) {
    return { from: filePath, to: newPath, changed: ADD_TS_NOCHECK && nextContent !== raw };
  }

  if (ADD_TS_NOCHECK && nextContent !== raw) {
    fs.writeFileSync(filePath, nextContent, 'utf8');
  }
  fs.renameSync(filePath, newPath);
  return { from: filePath, to: newPath, changed: ADD_TS_NOCHECK && nextContent !== raw };
}

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error('src directory not found');
    process.exit(1);
  }

  const targets = Array.from(walk(SRC_DIR));
  if (targets.length === 0) {
    console.log('No .js/.jsx files found under src');
    return;
  }

  const results = [];
  for (const file of targets) {
    // Skip files that already are .ts/.tsx (walk may not include them, but be safe)
    if (file.endsWith('.ts') || file.endsWith('.tsx')) continue;
    results.push(convertFile(file));
  }

  const header = DRY_RUN ? 'Planned conversions (dry-run):' : 'Converted files:';
  console.log(header);
  for (const r of results) {
    console.log(`- ${r.from} -> ${r.to}${r.changed ? ' (+ ts-nocheck)' : ''}`);
  }
  console.log(`Total: ${results.length}`);
}

main();


