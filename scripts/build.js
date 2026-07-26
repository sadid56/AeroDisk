const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  console.log(`Copied: ${path.relative(path.join(__dirname, '..'), src)} -> ${path.relative(path.join(__dirname, '..'), dest)}`);
}

console.log('=== Starting Build Process ===');

// 1. Clean dist folder
const distPath = path.join(__dirname, '..', 'dist');
console.log('Cleaning dist directory...');
cleanDir(distPath);

// 2. Compile TypeScript
console.log('Compiling TypeScript...');
const tscBin = path.join(__dirname, '..', 'node_modules', '.bin', 'tsc');
const tscCmd = process.platform === 'win32' ? `${tscBin}.cmd` : tscBin;

const tscResult = spawnSync(tscCmd, [], { stdio: 'inherit', shell: true });
if (tscResult.status !== 0) {
  console.error('Error: TypeScript compilation failed!');
  process.exit(tscResult.status || 1);
}
console.log('TypeScript compiled successfully.');

// 3. Copy Assets
console.log('Copying static assets...');
const srcRenderer = path.join(__dirname, '..', 'src', 'renderer');
const distRenderer = path.join(distPath, 'renderer');

copyFile(path.join(srcRenderer, 'index.html'), path.join(distRenderer, 'index.html'));
copyFile(path.join(srcRenderer, 'styles.css'), path.join(distRenderer, 'styles.css'));
copyFile(path.join(srcRenderer, 'favicon.png'), path.join(distRenderer, 'favicon.png'));
copyFile(path.join(srcRenderer, 'css', 'base.css'), path.join(distRenderer, 'css', 'base.css'));
copyFile(path.join(srcRenderer, 'css', 'titlebar.css'), path.join(distRenderer, 'css', 'titlebar.css'));
copyFile(path.join(srcRenderer, 'css', 'sidebar.css'), path.join(distRenderer, 'css', 'sidebar.css'));
copyFile(path.join(srcRenderer, 'css', 'workspace.css'), path.join(distRenderer, 'css', 'workspace.css'));
copyFile(path.join(srcRenderer, 'css', 'components.css'), path.join(distRenderer, 'css', 'components.css'));

console.log('=== Build Completed Successfully ===');
