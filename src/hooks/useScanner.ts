import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import { FileNode, ProgressPayload } from '../types';

export function useScanner() {
  const [flatNodes, setFlatNodes] = useState<FileNode[]>([]);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [breadcrumbIds, setBreadcrumbIds] = useState<number[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanCount, setScanCount] = useState<number>(0);
  const [scanStatusPath, setScanStatusPath] = useState<string>('');
  const [hoveredNode, setHoveredNode] = useState<FileNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const startScan = useCallback(async (targetPath: string) => {
    setIsScanning(true);
    setScanCount(0);
    setScanStatusPath('Initializing scan...');
    setHoveredNode(null);
    setSelectedNode(null);

    let unlisten: (() => void) | null = null;

    try {
      unlisten = await listen<ProgressPayload>('scan-progress', (event) => {
        setScanCount(event.payload.count);
        setScanStatusPath(event.payload.path);
      });

      const nodes = await invoke<FileNode[]>('scan_folder', { targetPath });

      setFlatNodes(nodes);
      if (nodes.length > 0) {
        setCurrentId(0);
        setBreadcrumbIds([0]);
        setSelectedNode(nodes[0]);
      }
    } catch (err: any) {
      console.error('Scan failed:', err);
      throw err;
    } finally {
      if (unlisten) unlisten();
      setIsScanning(false);
    }
  }, []);

  const selectFolderDialog = useCallback(async () => {
    const selected = await open({
      directory: true,
      multiple: false,
    });
    if (selected && typeof selected === 'string') {
      await startScan(selected);
    }
  }, [startScan]);

  const scanHomeFolder = useCallback(async () => {
    try {
      const home = await invoke<string>('get_home_folder');
      if (home) {
        await startScan(home);
      }
    } catch (err) {
      console.error('Failed to get home folder:', err);
    }
  }, [startScan]);

  const navigateTo = useCallback((nodeId: number) => {
    setCurrentId(nodeId);
    setBreadcrumbIds((prev) => {
      const idx = prev.indexOf(nodeId);
      if (idx !== -1) {
        return prev.slice(0, idx + 1);
      }
      return [...prev, nodeId];
    });
    if (flatNodes[nodeId]) {
      setSelectedNode(flatNodes[nodeId]);
    }
    setHoveredNode(null);
  }, [flatNodes]);

  const removeNode = useCallback((nodeId: number) => {
    setFlatNodes((prevNodes) => {
      const newNodes = [...prevNodes];
      const target = newNodes[nodeId];
      if (!target) return prevNodes;

      // Subtract size upwards
      let pid = target.parentId;
      while (pid !== null && newNodes[pid]) {
        newNodes[pid] = {
          ...newNodes[pid],
          size: Math.max(0, newNodes[pid].size - target.size),
        };
        pid = newNodes[pid].parentId;
      }

      // Remove from parent's child list
      if (target.parentId !== null && newNodes[target.parentId]) {
        const parent = newNodes[target.parentId];
        newNodes[target.parentId] = {
          ...parent,
          childIds: parent.childIds.filter((id) => id !== nodeId),
        };
      }

      return newNodes;
    });
  }, []);

  const addFolderNode = useCallback((parentId: number, newPath: string, folderName: string): number => {
    let newNodeId = 0;
    setFlatNodes((prevNodes) => {
      newNodeId = prevNodes.length;
      const newNode: FileNode = {
        id: newNodeId,
        name: folderName,
        path: newPath,
        isDirectory: true,
        size: 0,
        childIds: [],
        parentId: parentId,
      };

      const newNodes = [...prevNodes, newNode];

      if (newNodes[parentId]) {
        const parent = newNodes[parentId];
        newNodes[parentId] = {
          ...parent,
          childIds: [...parent.childIds, newNodeId],
        };
      }

      return newNodes;
    });

    return newNodeId;
  }, []);

  const resetToDashboard = useCallback(() => {
    setFlatNodes([]);
    setCurrentId(null);
    setBreadcrumbIds([]);
    setHoveredNode(null);
    setSelectedNode(null);
  }, []);

  const navigateParent = useCallback(() => {
    if (currentId !== null && flatNodes[currentId]) {
      const parentId = flatNodes[currentId].parentId;
      if (parentId !== null) {
        navigateTo(parentId);
      }
    }
  }, [currentId, flatNodes, navigateTo]);

  const activeNode = currentId !== null ? flatNodes[currentId] : null;

  return {
    flatNodes,
    currentId,
    breadcrumbIds,
    isScanning,
    scanCount,
    scanStatusPath,
    hoveredNode,
    setHoveredNode,
    selectedNode,
    setSelectedNode,
    searchQuery,
    setSearchQuery,
    startScan,
    selectFolderDialog,
    scanHomeFolder,
    navigateTo,
    navigateParent,
    removeNode,
    addFolderNode,
    resetToDashboard,
    activeNode,
  };
}
