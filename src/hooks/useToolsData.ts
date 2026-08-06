import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { LargeFile, CleanupSuggestion, DuplicateGroup } from '../types';

export function useToolsData() {
  const [largeFiles, setLargeFiles] = useState<LargeFile[]>([]);
  const [cleanupSuggestions, setCleanupSuggestions] = useState<CleanupSuggestion[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refetchTools = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedLarge, fetchedCleanup, fetchedDuplicates] = await Promise.all([
        invoke<LargeFile[]>('fetch_large_files'),
        invoke<CleanupSuggestion[]>('fetch_cleanup_suggestions'),
        invoke<DuplicateGroup[]>('fetch_duplicate_files'),
      ]);
      setLargeFiles(fetchedLarge || []);
      setCleanupSuggestions(fetchedCleanup || []);
      setDuplicateGroups(fetchedDuplicates || []);
    } catch (err) {
      console.error('Failed to fetch tools data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchTools();
  }, [refetchTools]);

  return {
    largeFiles,
    cleanupSuggestions,
    duplicateGroups,
    loading,
    refetchTools,
  };
}
