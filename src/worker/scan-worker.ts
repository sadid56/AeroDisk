import { parentPort, workerData } from 'worker_threads';
import * as fs from 'fs';
import * as path from 'path';

interface FileNode {
  id: number;
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  childIds: number[];
  parentId: number | null;
}

const nodes: FileNode[] = [];

function scanDirectory(dirPath: string, parentId: number | null): FileNode {
  const id = nodes.length;
  const name = path.basename(dirPath) || dirPath;
  const node: FileNode = {
    id,
    name,
    path: dirPath,
    isDirectory: true,
    size: 0,
    childIds: [],
    parentId
  };
  nodes.push(node);

  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err) {
    // Permission denied or reading errors: return the node with 0 bytes and empty children
    return node;
  }

  let total = 0;
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue; // skip hidden files and directories

    // Skip heavy system cache/application settings folders to optimize performance and prevent permission errors
    if (entry.name === 'Library' && process.platform === 'darwin') continue;
    if (entry.name === 'AppData' && process.platform === 'win32') continue;

    const fullPath = path.join(dirPath, entry.name);

    try {
      if (entry.isSymbolicLink()) continue;

      if (entry.isDirectory()) {
        const child = scanDirectory(fullPath, id);
        node.childIds.push(child.id);
        total += child.size;
      } else if (entry.isFile()) {
        const stats = fs.statSync(fullPath);
        // Use allocated blocks if available (stat.blocks * 512 bytes) for real disk space,
        // otherwise fall back to raw logical file size.
        const size = stats.blocks ? stats.blocks * 512 : stats.size;
        const fileId = nodes.length;

        nodes.push({
          id: fileId,
          name: entry.name,
          path: fullPath,
          isDirectory: false,
          size,
          childIds: [],
          parentId: id
        });
        node.childIds.push(fileId);
        total += size;

        // Post progress messages occasionally so the UI can update live
        if (nodes.length % 1000 === 0 && parentPort) {
          parentPort.postMessage({ type: 'progress', path: fullPath, count: nodes.length });
        }
      }
    } catch (err) {
      continue;
    }
  }

  // Sort child contents in descending order by size
  node.childIds.sort((a, b) => nodes[b].size - nodes[a].size);
  node.size = total;
  return node;
}

if (workerData && workerData.targetPath && parentPort) {
  scanDirectory(workerData.targetPath, null);
  parentPort.postMessage({ type: 'done', nodes });
}
