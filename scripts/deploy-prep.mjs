// Builds the site and collects only new/changed files into dist-changed/ for upload.
// Runs locally only. Usage: npm run deploy-prep
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, writeFile, readdir, rm, mkdir, copyFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const changedDir = path.join(root, 'dist-changed');
const manifestPath = path.join(root, '.deploy-manifest.json');

// 1. Build
console.log('Building site...\n');
const build = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit', shell: true });
if (build.status !== 0) {
  console.error('\nBuild failed. Nothing was copied.');
  process.exit(build.status ?? 1);
}

// 2. Fingerprint every file in dist
async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? listFiles(full) : [full];
    }),
  );
  return files.flat();
}

const current = {};
for (const file of await listFiles(distDir)) {
  const rel = path.relative(distDir, file).split(path.sep).join('/');
  current[rel] = createHash('sha256').update(await readFile(file)).digest('hex');
}

// 3. Compare with last saved list
const previous = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, 'utf8')) : {};
const added = [];
const changed = [];
let unchanged = 0;
for (const [rel, hash] of Object.entries(current)) {
  if (!(rel in previous)) added.push(rel);
  else if (previous[rel] !== hash) changed.push(rel);
  else unchanged++;
}
const removed = Object.keys(previous).filter((rel) => !(rel in current));

// 4. Copy new and changed files into dist-changed, keeping sub-folders
await rm(changedDir, { recursive: true, force: true });
for (const rel of [...added, ...changed]) {
  const dest = path.join(changedDir, rel);
  await mkdir(path.dirname(dest), { recursive: true });
  await copyFile(path.join(distDir, rel), dest);
}

// 5. Summary
console.log('\n--- Deploy prep summary ---');
if (!existsSync(manifestPath)) console.log('No previous list found: treating every file as new.');
console.log(`New:       ${added.length}`);
console.log(`Changed:   ${changed.length}`);
console.log(`Unchanged: ${unchanged}`);
console.log(`Removed:   ${removed.length}`);

if (added.length + changed.length > 0) {
  console.log(`\nUpload the contents of: ${path.relative(root, changedDir)}${path.sep}`);
} else {
  console.log('\nNothing new to upload.');
}

if (removed.length > 0) {
  console.log('\nDelete these from the server:');
  for (const rel of removed) console.log(`  ${rel}`);
}

if (added.length + changed.length + removed.length === 0) process.exit(0);

// 6. Save the new list only once the upload is confirmed
const rl = createInterface({ input: process.stdin, output: process.stdout });
const answer = (await rl.question('\nDid you upload these files? (y/N) ')).trim().toLowerCase();
rl.close();

if (answer === 'y' || answer === 'yes') {
  const sorted = Object.fromEntries(Object.entries(current).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(manifestPath, JSON.stringify(sorted, null, 2) + '\n');
  console.log('Saved file list for next time.');
} else {
  console.log('List not saved. The next run will show these changes again.');
}
