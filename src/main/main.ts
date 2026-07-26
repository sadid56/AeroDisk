import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { Worker } from 'worker_threads';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1150,
    height: 780,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: '#0f0f15',
    icon: path.join(__dirname, '../renderer/favicon.png'),
    titleBarStyle: 'hiddenInset', // Sleek native look on macOS
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ---- Get Home Directory ----
ipcMain.handle('get-home-folder', () => {
  return os.homedir();
});

// ---- Folder Selection ----
ipcMain.handle('select-folder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// ---- Native Cross-Platform Disk Space Retriever ----
ipcMain.handle('get-disk-space', (_event, targetPath: string) => {
  try {
    const stats = fs.statfsSync(targetPath);
    const total = Number(stats.blocks) * Number(stats.bsize);
    const available = Number(stats.bavail) * Number(stats.bsize);
    return { total, available };
  } catch (err: any) {
    console.error('Failed to retrieve disk space natively:', err);
    return null;
  }
});

// ---- Multi-threaded Folder Scanning ----
ipcMain.handle('scan-folder', async (event, targetPath: string) => {
  const sender = event.sender;
  return new Promise((resolve, reject) => {
    // Note: Compiled worker will be in dist/worker/scan-worker.js
    const workerPath = path.join(__dirname, '../worker/scan-worker.js');
    const worker = new Worker(workerPath, {
      workerData: { targetPath }
    });

    worker.on('message', (msg) => {
      if (msg.type === 'progress') {
        sender.send('scan-progress', msg);
      } else if (msg.type === 'done') {
        resolve(msg.nodes);
        worker.terminate();
      }
    });

    worker.on('error', (err) => {
      console.error('Worker error:', err);
      reject(err);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Scan worker exited with code ${code}`));
      }
    });
  });
});

// ---- Dynamic Trash Module Integration (ESM-only module support) ----
ipcMain.handle('delete-item', async (_event, targetPath: string) => {
  try {
    const { default: trash } = await (new Function('return import("trash")')());
    await trash(targetPath);
    return { success: true };
  } catch (err: any) {
    console.error('Failed to move item to trash:', err);
    return { success: false, error: err.message || String(err) };
  }
});

// ---- Open Item in Native Explorer/Finder ----
ipcMain.handle('reveal-in-folder', (_event, targetPath: string) => {
  shell.showItemInFolder(targetPath);
});
