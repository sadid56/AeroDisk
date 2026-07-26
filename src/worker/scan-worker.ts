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
    return node;
  }

  let total = 0;
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    try {
      if (entry.isSymbolicLink()) continue;

      if (entry.isDirectory()) {
        const child = scanDirectory(fullPath, id);
        node.childIds.push(child.id);
        total += child.size;
      } else if (entry.isFile()) {
        const stats = fs.statSync(fullPath);
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
