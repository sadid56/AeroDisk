import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function useFullDiskAccess() {
  const [hasFDA, setHasFDA] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const checkFDA = useCallback(async () => {
    try {
      const allowed = await invoke<boolean>('check_full_disk_access');
      setHasFDA(allowed);
      return allowed;
    } catch (err) {
      console.error('Failed to check FDA permission:', err);
      return true;
    }
  }, []);

  const requestFDA = useCallback(async () => {
    setLoading(true);
    try {
      await invoke('request_full_disk_access');
    } catch (err) {
      console.error('Failed to request FDA access:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkFDA();
  }, [checkFDA]);

  return {
    hasFDA,
    checkFDA,
    requestFDA,
    loading,
  };
}
