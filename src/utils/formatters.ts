import {
  Folder,
  Image,
  Film,
  Archive,
  Code2,
  FileText,
  Music,
  File,
  LucideIcon,
} from 'lucide-react';

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(timestamp?: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

export interface FileCategoryInfo {
  Icon: LucideIcon;
  label: string;
  color: string;
}

export function getFileCategory(name: string, isDirectory: boolean): FileCategoryInfo {
  if (isDirectory) return { Icon: Folder, label: 'Folder', color: 'text-amber-400' };

  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': case 'jpg': case 'jpeg': case 'webp': case 'gif': case 'svg': case 'ico':
      return { Icon: Image, label: 'Image', color: 'text-pink-400' };
    case 'mp4': case 'mkv': case 'mov': case 'avi': case 'webm':
      return { Icon: Film, label: 'Video', color: 'text-purple-400' };
    case 'zip': case 'tar': case 'gz': case 'rar': case '7z': case 'dmg': case 'iso':
      return { Icon: Archive, label: 'Archive', color: 'text-red-400' };
    case 'js': case 'ts': case 'tsx': case 'jsx': case 'html': case 'css': case 'json':
    case 'py': case 'go': case 'rs': case 'cpp': case 'c': case 'java': case 'sh':
      return { Icon: Code2, label: 'Code', color: 'text-blue-400' };
    case 'pdf': case 'doc': case 'docx': case 'txt': case 'md': case 'csv': case 'xlsx':
      return { Icon: FileText, label: 'Document', color: 'text-emerald-400' };
    case 'mp3': case 'wav': case 'flac': case 'm4a': case 'ogg':
      return { Icon: Music, label: 'Audio', color: 'text-teal-400' };
    default:
      return { Icon: File, label: 'File', color: 'text-slate-400' };
  }
}

export function getNodeColor(name: string, depth: number): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }

  const hues = [265, 200, 310, 230, 280, 180, 330];
  const baseHue = hues[Math.abs(hash) % hues.length];
  const hueOffset = (Math.abs(hash >> 3) % 20) - 10;
  const hue = (baseHue + hueOffset + 360) % 360;

  const saturation = Math.max(75 - depth * 6, 45);
  const lightness = Math.max(55 - depth * 7, 35);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
