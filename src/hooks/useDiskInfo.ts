import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { DiskSpaceInfo } from '../types';

export function useDiskInfo(targetPath?: string) {
  const [diskInfo, setDiskInfo] = useState<DiskSpaceInfo | null>(null);

  const fetchDiskInfo = useCallback(async (path: string) => {
    try {
      const info = await invoke<DiskSpaceInfo | null>('get_disk_info', { targetPath: path });
      setDiskInfo(info);
    } catch (err) {
      console.error('Failed to get disk info:', err);
      setDiskInfo(null);
    }
  }, []);

  useEffect(() => {
    if (targetPath) {
      fetchDiskInfo(targetPath);
    }
  }, [targetPath, fetchDiskInfo]);

  return { diskInfo, refreshDiskInfo: fetchDiskInfo };
}
