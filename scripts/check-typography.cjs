const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const TARGETS = ['src', 'index.html', 'tailwind.config.js'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.html']);
const violations = [];

const walk = (entry) => {
  const fullPath = path.join(ROOT, entry);
  if (!fs.existsSync(fullPath)) return [];

  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    return fs.readdirSync(fullPath).flatMap((child) => walk(path.join(entry, child)));
  }

  return EXTENSIONS.has(path.extname(fullPath)) ? [fullPath] : [];
};

const addViolation = (file, line, message) => {
  violations.push(`${path.relative(ROOT, file)}:${line}: ${message}`);
};

for (const file of TARGETS.flatMap(walk)) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    for (const match of line.matchAll(/text-\[(\d+(?:\.\d+)?)px\]/g)) {
      const size = Number(match[1]);
      if (size < 12) {
        addViolation(file, lineNumber, `Typography size ${size}px is below the 12px minimum. Use text-xs or a type-* token.`);
      } else {
        addViolation(file, lineNumber, `Avoid arbitrary typography size ${size}px. Use the global text scale or a type-* token.`);
      }
    }

    for (const match of line.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) {
      const size = Number(match[1]);
      if (size < 12) {
        addViolation(file, lineNumber, `font-size ${size}px is below the 12px minimum.`);
      }
    }

    for (const match of line.matchAll(/font-size:\s*(\d?(?:\.\d+)?)rem/g)) {
      const size = Number(match[1]) * 16;
      if (size < 12) {
        addViolation(file, lineNumber, `font-size ${match[1]}rem is below the 12px minimum.`);
      }
    }

    if (/\btracking-(tight|tighter)\b/.test(line)) {
      addViolation(file, lineNumber, 'Negative letter spacing is not allowed. Use tracking-normal or positive tracking.');
    }
  });
}

if (violations.length > 0) {
  console.error('Typography guard failed:\n');
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log('Typography guard passed.');
