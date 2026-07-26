const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'src');
const distPath = path.join(__dirname, '..', 'dist');

let electronProcess = null;
let debounceTimeout = null;

// Helper to copy static assets
function copyAsset(srcFile) {
  const rel = path.relative(srcPath, srcFile);
  const destFile = path.join(distPath, rel);
  try {
    fs.mkdirSync(path.dirname(destFile), { recursive: true });
    fs.copyFileSync(srcFile, destFile);
    console.log(`[Watch] Copied asset: ${rel}`);
  } catch (err) {
    console.error(`[Watch] Failed to copy asset ${rel}:`, err.message);
  }
}

// Start/Restart Electron process
function startElectron() {
  if (electronProcess) {
    try {
      // Force kill current process group or process
      electronProcess.kill('SIGINT');
    } catch (e) {
      // ignore
    }
  }

  console.log('[Watch] Launching Electron app window...');
  const electronBin = process.platform === 'win32' ? 'electron.cmd' : 'electron';
  
  electronProcess = spawn('npx', [electronBin, '.'], {
    stdio: 'inherit',
    shell: true
  });

  electronProcess.on('close', (code) => {
    if (code !== null && code !== 0 && code !== 130) {
      console.log(`[Watch] Electron exited with code ${code}`);
    }
  });
}

function triggerRebuildAndRestart(reason) {
  if (debounceTimeout) clearTimeout(debounceTimeout);
  
  debounceTimeout = setTimeout(() => {
    console.log(`[Watch] Reloading due to: ${reason}`);
    
    // Copy any updated assets before relaunching
    if (reason.endsWith('.html') || reason.endsWith('.css') || reason.endsWith('.png')) {
      const fullSrcPath = path.join(srcPath, reason);
      if (fs.existsSync(fullSrcPath)) {
        copyAsset(fullSrcPath);
      }
    }
    
    startElectron();
  }, 200);
}

// 1. Initial build
console.log('[Watch] Building assets before starting watch...');
const build = spawn('node', [path.join(__dirname, 'build.js')], { stdio: 'inherit' });

build.on('close', (code) => {
  if (code !== 0) {
    console.error('[Watch] Initial build failed, watcher not started.');
    process.exit(code);
  }

  // 2. Start tsc watch
  console.log('[Watch] Starting TypeScript watcher...');
  const tscBin = path.join(__dirname, '..', 'node_modules', '.bin', 'tsc');
  const tscCmd = process.platform === 'win32' ? `${tscBin}.cmd` : tscBin;
  const tscWatch = spawn(tscCmd, ['--watch'], { stdio: 'pipe', shell: true });

  tscWatch.stdout.on('data', (data) => {
    const text = data.toString().trim();
    if (text) {
      console.log(`[TSC] ${text}`);
      // Restart when TypeScript compilation successfully outputs files
      if (text.includes('Watching for file changes') || text.includes('Found 0 errors')) {
        triggerRebuildAndRestart('TypeScript recompile');
      }
    }
  });

  // 3. Watch non-TS frontend static files
  console.log('[Watch] Watching source directories recursively for CSS/HTML/Image assets...');
  fs.watch(srcPath, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    if (filename.endsWith('.html') || filename.endsWith('.css') || filename.endsWith('.png')) {
      triggerRebuildAndRestart(filename);
    }
  });

  // 4. Initial launch
  startElectron();
});

// Handle termination cleanly
process.on('SIGINT', () => {
  if (electronProcess) {
    try {
      electronProcess.kill('SIGINT');
    } catch (e) {}
  }
  process.exit(0);
});
