/**
 * Fix double hyphens in filenames and imports (-- -> -)
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');

function* walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'scripts') continue;
      yield* walkDir(full);
    } else if (e.isFile()) {
      yield full;
    }
  }
}

// 1. Rename files: replace -- with - in filename
let renamed = 0;
for (const file of walkDir(SRC)) {
  const dir = path.dirname(file);
  const name = path.basename(file);
  if (name.includes('--')) {
    const newName = name.replace(/--/g, '-');
    const newPath = path.join(dir, newName);
    if (file !== newPath) {
      fs.renameSync(file, newPath);
      renamed++;
      console.log('  ', name, '->', newName);
    }
  }
}
console.log('Renamed', renamed, 'files');

// 2. In all .ts/.tsx replace path-like -- with -
function* srcFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'scripts') continue;
      yield* srcFiles(full);
    } else if (e.isFile() && /\.(tsx?|jsx?)$/.test(e.name)) {
      yield full;
    }
  }
}

for (const file of srcFiles(SRC)) {
  let content = fs.readFileSync(file, 'utf8');
  const next = content.replace(/--/g, '-');
  if (next !== content) {
    fs.writeFileSync(file, next);
  }
}
console.log('Fixed imports.');
