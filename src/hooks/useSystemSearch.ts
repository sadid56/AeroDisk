import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FileNode, DirectoryEntry } from "../types";

export function useSystemSearch(query: string, isOpen: boolean, hasScanData: boolean) {
  const [systemResults, setSystemResults] = useState<FileNode[]>([]);
  const [searchingSystem, setSearchingSystem] = useState(false);

  useEffect(() => {
    if (hasScanData || !query.trim() || !isOpen) {
      setSystemResults([]);
      setSearchingSystem(false);
      return;
    }

    setSearchingSystem(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const entries = await invoke<DirectoryEntry[]>("search_system", { query: query.trim() });
        const fileNodes: FileNode[] = (entries || []).map((entry, idx) => ({
          id: idx + 99000,
          name: entry.name,
          path: entry.path,
          size: entry.size,
          isDirectory: entry.isDirectory,
          parentId: null,
          childIds: [],
        }));
        setSystemResults(fileNodes);
      } catch (err) {
        console.error("System search error:", err);
      } finally {
        setSearchingSystem(false);
      }
    }, 350); // 350ms debounce

    return () => clearTimeout(delayDebounce);
  }, [query, hasScanData, isOpen]);

  return { systemResults, searchingSystem, setSystemResults };
}
