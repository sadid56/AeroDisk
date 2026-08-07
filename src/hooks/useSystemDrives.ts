import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { SystemDrive, UserFolder } from '../types';

export function useSystemDrives() {
  const [drives, setDrives] = useState<SystemDrive[]>([]);
  const [folders, setFolders] = useState<UserFolder[]>([]);
  const [systemRootFolders, setSystemRootFolders] = useState<UserFolder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedDrives, fetchedFolders, fetchedSystemRoot] = await Promise.all([
        invoke<SystemDrive[]>('fetch_system_drives'),
        invoke<UserFolder[]>('fetch_user_folders'),
        invoke<UserFolder[]>('fetch_system_root_folders'),
      ]);
      setDrives(fetchedDrives || []);
      setFolders(fetchedFolders || []);
      setSystemRootFolders(fetchedSystemRoot || []);
    } catch (err) {
      console.error('Failed to fetch system drives or user folders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    drives,
    folders,
    systemRootFolders,
    loading,
    refetch,
  };
}
