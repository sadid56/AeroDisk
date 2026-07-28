import React from 'react';
import { useProtectedPath } from '../hooks/useProtectedPath';
import {
  FolderOpen,
  ExternalLink,
  Copy,
  Trash2,
  FolderPlus,
  ShieldAlert,
  Terminal,
} from 'lucide-react';
import { FileNode } from '../types';
import { Dropdown, DropdownItem, DropdownDivider } from './ui/Dropdown';
import { getFullPath } from '../utils/pathUtils';

interface ContextMenuProps {
  x: number;
  y: number;
  node: FileNode;
  flatNodes: FileNode[];
  onClose: () => void;
  onNavigate: (id: number) => void;
  onReveal: (path: string) => void;
  onDelete: (node: FileNode) => void;
  onCopyPath: (path: string) => void;
  onCreateSubfolder?: (node: FileNode) => void;
  onOpenInTerminal: (path: string) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = React.memo(({
  x,
  y,
  node,
  flatNodes,
  onClose,
  onNavigate,
  onReveal,
  onDelete,
  onCopyPath,
  onCreateSubfolder,
  onOpenInTerminal,
}) => {
  const resolvedPath = getFullPath(node.id, flatNodes);
  const { isProtected } = useProtectedPath(resolvedPath);

  type MenuItemConfig = 
    | { type: 'divider'; key: string }
    | {
        type: 'item';
        key: string;
        label: string;
        icon: React.ReactNode;
        onClick: () => void;
        variant?: 'default' | 'danger' | 'warning';
      }
    | {
        type: 'custom';
        key: string;
        content: React.ReactNode;
      };

  const menuItems: MenuItemConfig[] = [
    ...(node.isDirectory
      ? [
          {
            type: 'item' as const,
            key: 'open-folder',
            label: 'Open Folder',
            icon: <FolderOpen className="w-4 h-4 text-accent-purple" />,
            onClick: () => onNavigate(node.id),
          },
          ...(onCreateSubfolder
            ? [
                {
                  type: 'item' as const,
                  key: 'create-folder',
                  label: 'Create Folder',
                  icon: <FolderPlus className="w-4 h-4 text-accent-purple" />,
                  onClick: () => onCreateSubfolder(node),
                },
              ]
            : []),
        ]
      : []),
    {
      type: 'item' as const,
      key: 'reveal-file-manager',
      label: 'Reveal in File Manager',
      icon: <ExternalLink className="w-4 h-4 text-accent-blue" />,
      onClick: () => onReveal(resolvedPath),
    },
    {
      type: 'item' as const,
      key: 'open-terminal',
      label: 'Open in Terminal',
      icon: <Terminal className="w-4 h-4 text-emerald-400" />,
      onClick: () => onOpenInTerminal(resolvedPath),
    },
    {
      type: 'item' as const,
      key: 'copy-path',
      label: 'Copy Path',
      icon: <Copy className="w-4 h-4 text-accent-pink" />,
      onClick: () => onCopyPath(resolvedPath),
    },
    { type: 'divider' as const, key: 'divider-1' },
    isProtected
      ? {
          type: 'custom' as const,
          key: 'protected-path',
          content: (
            <div className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-2 text-[11px] font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Protected System Path</span>
            </div>
          ),
        }
      : {
          type: 'item' as const,
          key: 'delete',
          label: 'Move to Trash',
          icon: <Trash2 className="w-4 h-4" />,
          variant: 'danger' as const,
          onClick: () => onDelete(node),
        },
  ];

  return (
    <Dropdown x={x} y={y} header={node.name} onClose={onClose}>
      {menuItems.map((item) => {
        if (item.type === 'divider') {
          return <DropdownDivider key={item.key} />;
        }
        if (item.type === 'custom') {
          return <React.Fragment key={item.key}>{item.content}</React.Fragment>;
        }
        return (
          <DropdownItem
            key={item.key}
            icon={item.icon}
            label={item.label}
            variant={item.variant}
            onClick={() => {
              item.onClick();
              onClose();
            }}
          />
        );
      })}
    </Dropdown>
  );
});
