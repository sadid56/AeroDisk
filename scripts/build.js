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
const srcPath = path.join(__dirname, '..', 'src');

// Copy HTML
copyFile(path.join(srcPath, 'renderer', 'index.html'), path.join(distPath, 'renderer', 'index.html'));

// Copy Assets
copyFile(path.join(srcPath, 'assets', 'favicon.png'), path.join(distPath, 'assets', 'favicon.png'));

// Copy Stylesheets
copyFile(path.join(srcPath, 'styles', 'styles.css'), path.join(distPath, 'styles', 'styles.css'));
copyFile(path.join(srcPath, 'styles', 'base.css'), path.join(distPath, 'styles', 'base.css'));
copyFile(path.join(srcPath, 'styles', 'titlebar.css'), path.join(distPath, 'styles', 'titlebar.css'));
copyFile(path.join(srcPath, 'styles', 'sidebar.css'), path.join(distPath, 'styles', 'sidebar.css'));
copyFile(path.join(srcPath, 'styles', 'workspace.css'), path.join(distPath, 'styles', 'workspace.css'));
copyFile(path.join(srcPath, 'styles', 'components.css'), path.join(distPath, 'styles', 'components.css'));

console.log('=== Build Completed Successfully ===');
