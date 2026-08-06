export interface FileNode {
  id: number;
  name: string;
  path: string;
  isDirectory?: boolean;
  size: number;
  childIds: number[];
  parentId: number | null;
  createdAt?: number;
}

export interface Slice {
  node: FileNode;
  depth: number;
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
}

export interface DiskSpaceInfo {
  total: number;
  available: number;
}

export interface SystemDrive {
  name: string;
  mount_point: string;
  total_space: number;
  available_space: number;
  file_system: string;
  is_removable: boolean;
  is_read_only: boolean;
  smart_status: string;
}

export interface UserFolder {
  name: string;
  path: string;
  exists: boolean;
  size?: number;
}

export interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
}

export interface ProgressPayload {
  scanId?: string;
  path: string;
  count: number;
}

export interface ScanDeltaPayload {
  scanId: string;
  added: FileNode[];
  updated: FileNode[];
  path: string;
  count: number;
  done: boolean;
}

export interface ScanCompletePayload {
  scanId: string;
  count: number;
  totalNodes: number;
}

export interface ScanErrorPayload {
  scanId: string;
  message: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

export interface LargeFile {
  name: string;
  path: string;
  size: number;
  file_type: string;
}

export interface CleanupSuggestion {
  id: string;
  title: string;
  desc: string;
  size: number;
}

export interface DuplicateGroup {
  name: string;
  size: number;
  count: number;
  total_waste: number;
  paths: string[];
}
