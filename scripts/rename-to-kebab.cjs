/**
 * Rename frontend files to kebab-case and update all imports.
 * Run from repo root: node sac_frontend/scripts/rename-to-kebab.cjs
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
  const oldPath = path.join(SRC, f.rel);
  const newPath = path.join(SRC, newRel);
  renames.push({
    oldPath,
    newPath,
    oldImport: f.rel.replace(/\.(tsx?|jsx?)$/, '').replace(/\\/g, '/'),
    newImport: newRel.replace(/\.(tsx?|jsx?)$/, '').replace(/\\/g, '/'),
  });
}

// Sort by old path length desc
renames.sort((a, b) => b.oldImport.length - a.oldImport.length);

console.log('Renaming', renames.length, 'files...');
for (const r of renames) {
  if (fs.existsSync(r.oldPath)) {
    try {
      fs.renameSync(r.oldPath, r.newPath);
      console.log('  ', r.oldImport, '->', path.basename(r.newPath));
    } catch (err) {
      if (err.code === 'ENOENT' || r.oldPath === r.newPath) continue;
      const tmp = r.oldPath + '.tmp';
      fs.renameSync(r.oldPath, tmp);
      fs.renameSync(tmp, r.newPath);
      console.log('  ', r.oldImport, '->', path.basename(r.newPath), '(via tmp)');
    }
  }
}

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
  for (const r of renames) {
    content = content.split(r.oldImport).join(r.newImport);
  }
  fs.writeFileSync(file, content);
}

console.log('Done.');
