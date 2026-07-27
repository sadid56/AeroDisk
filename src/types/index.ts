export interface FileNode {
  id: number;
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  childIds: number[];
  parentId: number | null;
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
}

export interface UserFolder {
  name: string;
  path: string;
  exists: boolean;
}

export interface ProgressPayload {
  path: string;
  count: number;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}
