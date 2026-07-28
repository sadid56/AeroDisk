import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function useProtectedPath(path?: string) {
  const [isProtected, setIsProtected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const checkPath = useCallback(async (targetPath: string) => {
    setLoading(true);
    try {
      const res = await invoke<boolean>('check_is_protected_path', { targetPath });
      setIsProtected(res);
      return res;
    } catch (err) {
      console.error('Failed to check protected path status:', err);
      setIsProtected(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (path) {
      checkPath(path);
    }
  }, [path, checkPath]);

  return {
    isProtected,
    loading,
    checkPath,
  };
}
