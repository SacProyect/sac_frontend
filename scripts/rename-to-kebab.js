/**
 * Rename frontend files to kebab-case and update all imports.
 * Run from repo root: node sac_frontend/scripts/rename-to-kebab.js
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');

function toKebabCase(str) {
  const base = str.replace(/\.[^.]+$/, '');
  const ext = str.match(/\.[^.]+$/)?.[0] || '';
  const kebab = base
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .replace(/([A-Z]+)/g, (m) => '-' + m.toLowerCase())
    .replace(/^-/, '')
    .toLowerCase();
  return kebab + ext;
}

function needsRename(name) {
  if (name === 'index.ts' || name === 'index.tsx') return false;
  const base = name.replace(/\.[^.]+$/, '');
  const kebab = toKebabCase(name);
  return name !== kebab;
}

function* walkDir(dir, base = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const rel = base ? base + '/' + e.name : e.name;
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'scripts') continue;
      yield* walkDir(path.join(dir, e.name), rel);
    } else if (e.isFile() && /\.(tsx?|jsx?)$/.test(e.name) && needsRename(e.name)) {
      yield { full: path.join(dir, e.name), rel, name: e.name, dir: path.dirname(rel) };
    }
  }
}

const renames = [];
for (const f of walkDir(SRC)) {
  const newName = toKebabCase(f.name);
  const newRel = f.dir ? f.dir + '/' + newName : newName;
  renames.push({
    oldPath: path.join(SRC, f.rel).split(path.sep).join('/'),
    newPath: path.join(SRC, newRel).split(path.sep).join('/'),
    oldImport: f.rel.replace(/\.(tsx?|jsx?)$/, '').replace(/\\/g, '/'),
    newImport: newRel.replace(/\.(tsx?|jsx?)$/, '').replace(/\\/g, '/'),
  });
}

// Sort by old path length desc so we don't replace substring first
renames.sort((a, b) => b.oldImport.length - a.oldImport.length);

console.log('Renaming', renames.length, 'files...');
for (const r of renames) {
  if (fs.existsSync(r.oldPath)) {
    fs.renameSync(r.oldPath, r.newPath);
    console.log('  ', r.oldPath.replace(SRC, 'src'), '->', r.newName || path.basename(r.newPath));
  }
}

// Replace imports in all source files
function* allFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'scripts') continue;
      yield* allFiles(full);
    } else if (e.isFile() && /\.(tsx?|jsx?)$/.test(e.name)) {
      yield full;
    }
  }
}

console.log('Updating imports...');
for (const file of allFiles(SRC)) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const r of renames) {
    const oldImport = r.oldImport;
    const newImport = r.newImport;
    const patterns = [
      [new RegExp(`(@/)${oldImport.replace(/\//g, '\\/')}(?=["'\\s)])`, 'g'), `$1${newImport}`],
      [new RegExp(`(["\'])${oldImport.replace(/\//g, '\\/')}\\1`, 'g'), `"${newImport}"`],
      [new RegExp(`(from\\s+["'])${oldImport.replace(/\//g, '\\/')}(["'])`, 'g'), `$1${newImport}$2`],
      [new RegExp(`(import\\s*\\(["'])${oldImport.replace(/\//g, '\\/')}(["']\\))`, 'g'), `$1${newImport}$2`],
    ];
    for (const [re, repl] of patterns) {
      const next = content.replace(re, repl);
      if (next !== content) {
        content = next;
        changed = true;
      }
    }
    const relPath = path.relative(path.dirname(file), path.join(SRC, r.oldImport)).replace(/\\/g, '/');
    const newRelPath = path.relative(path.dirname(file), path.join(SRC, r.newImport)).replace(/\\/g, '/');
    if (relPath !== newRelPath && (content.includes(relPath + '"') || content.includes(relPath + "'"))) {
      content = content.replace(new RegExp(relPath.replace(/\//g, '\\/') + '(["\'])', 'g'), newRelPath + '$1');
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(file, content);
}

console.log('Done.');
