import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function useCreateFolder() {
  const [isCreating, setIsCreating] = useState(false);

  const createFolder = useCallback(async (parentPath: string, folderName: string) => {
    setIsCreating(true);
    try {
      const createdPath = await invoke<string>('create_new_folder', {
        parentPath,
        folderName,
      });
      return createdPath;
    } finally {
      setIsCreating(false);
    }
  }, []);

  return {
    createFolder,
    isCreating,
  };
}
