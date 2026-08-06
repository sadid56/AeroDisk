import { FileNode } from "../types";

export function getFullPath(nodeId: number, flatNodes: FileNode[]): string {
  const node = flatNodes[nodeId];
  if (!node) return "";

  const trail: string[] = [];
  let curr: FileNode | null = node;

  while (curr) {
    if (curr.parentId == null) {
      // Root node holds the base absolute path
      trail.unshift(curr.path || "");
      break;
    } else {
      trail.unshift(curr.name);
    }
    curr = curr.parentId !== null && flatNodes[curr.parentId] ? flatNodes[curr.parentId] : null;
  }

  const basePath = trail[0];
  const relativeParts = trail.slice(1);
  if (!basePath) return relativeParts.join("/");

  // Determine if it's Windows or Unix path format from the base path
  const isWindows = basePath.includes("\\") || (basePath.length >= 2 && basePath[1] === ":");
  const separator = isWindows ? "\\" : "/";

  let fullPath = basePath;
  for (const part of relativeParts) {
    if (!fullPath.endsWith(separator)) {
      fullPath += separator;
    }
    fullPath += part;
  }
  return fullPath;
}
