import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { LargeFile, CleanupSuggestion, DuplicateGroup } from '../types';

export function useToolsData() {
  const [largeFiles, setLargeFiles] = useState<LargeFile[]>([]);
  const [cleanupSuggestions, setCleanupSuggestions] = useState<CleanupSuggestion[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  
  const [largeFilesLoading, setLargeFilesLoading] = useState<boolean>(true);
  const [cleanupLoading, setCleanupLoading] = useState<boolean>(true);
  const [duplicatesLoading, setDuplicatesLoading] = useState<boolean>(true);

  const refetchTools = useCallback(async () => {
    setLargeFilesLoading(true);
    setCleanupLoading(true);
    setDuplicatesLoading(true);

    // 1. Fetch large files
    invoke<LargeFile[]>('fetch_large_files')
      .then((res) => {
        setLargeFiles(res || []);
      })
      .catch((err) => {
        console.error('Failed to fetch large files:', err);
      })
      .finally(() => {
        setLargeFilesLoading(false);
      });

    // 2. Fetch cleanup suggestions (very fast)
    invoke<CleanupSuggestion[]>('fetch_cleanup_suggestions')
      .then((res) => {
        setCleanupSuggestions(res || []);
      })
      .catch((err) => {
        console.error('Failed to fetch cleanup suggestions:', err);
      })
      .finally(() => {
        setCleanupLoading(false);
      });

    // 3. Fetch duplicate files (slowest, walks whole home folder)
    invoke<DuplicateGroup[]>('fetch_duplicate_files')
      .then((res) => {
        setDuplicateGroups(res || []);
      })
      .catch((err) => {
        console.error('Failed to fetch duplicate files:', err);
      })
      .finally(() => {
        setDuplicatesLoading(false);
      });
  }, []);

  useEffect(() => {
    refetchTools();
  }, [refetchTools]);

  return {
    largeFiles,
    cleanupSuggestions,
    duplicateGroups,
    largeFilesLoading,
    cleanupLoading,
    duplicatesLoading,
    refetchTools,
  };
}
