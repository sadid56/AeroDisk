import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  selectFolder: (): Promise<string | null> => ipcRenderer.invoke('select-folder'),
  getHomeFolder: (): Promise<string> => ipcRenderer.invoke('get-home-folder'),
  setDockIcon: (dataUrl: string): Promise<void> => ipcRenderer.invoke('set-dock-icon', dataUrl),
  scanFolder: (targetPath: string): Promise<any[]> => ipcRenderer.invoke('scan-folder', targetPath),
  getDiskSpace: (targetPath: string): Promise<{ total: number; available: number } | null> =>
    ipcRenderer.invoke('get-disk-space', targetPath),
  deleteItem: (targetPath: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('delete-item', targetPath),
  revealInFolder: (targetPath: string): Promise<void> => ipcRenderer.invoke('reveal-in-folder', targetPath),
  onScanProgress: (callback: (data: { path: string; count: number }) => void): void => {
    ipcRenderer.on('scan-progress', (_event, data) => callback(data));
  }
});
