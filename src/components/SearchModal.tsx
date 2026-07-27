import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, CornerDownLeft } from 'lucide-react';
import { FileNode } from '../types';
import { formatBytes, getFileCategory, truncate } from '../utils/formatters';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  flatNodes: FileNode[];
  onNavigate: (nodeId: number) => void;
  onSelectNode: (node: FileNode) => void;
}

const MAX_SEARCH_RESULTS = 80;

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  flatNodes,
  onNavigate,
  onSelectNode,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Fast memoized search over flatNodes
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const matches: FileNode[] = [];

    for (let i = 0; i < flatNodes.length; i++) {
      const node = flatNodes[i];
      if (node && node.name && node.name.toLowerCase().includes(q)) {
        matches.push(node);
        if (matches.length >= MAX_SEARCH_RESULTS) break;
      }
    }
    return matches;
  }, [flatNodes, query]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Keyboard navigation inside modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelectResult(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  const handleSelectResult = (node: FileNode) => {
    onSelectNode(node);
    if (node.isDirectory) {
      onNavigate(node.id);
    } else if (node.parentId !== null) {
      onNavigate(node.parentId);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-surface border border-surface-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Search Header Input */}
        <div className="relative border-b border-surface-border p-4 flex items-center gap-3">
          <Search className="w-5 h-5 text-accent-purple shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type to search files or directories across disk..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-medium"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-background border border-surface-border text-slate-400">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-surface-border/40 scrollbar-thin scrollbar-thumb-surface-border">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-slate-500 text-xs space-y-1">
              <p className="font-semibold text-slate-400">Command Palette Search</p>
              <p>Type a file name, folder, or extension to search across indexed storage.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matching files or folders found for &quot;{query}&quot;
            </div>
          ) : (
            results.map((node, index) => {
              const category = getFileCategory(node.name, node.isDirectory);
              const Icon = category.Icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={node.id}
                  onClick={() => handleSelectResult(node)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-accent-purple/20 border-l-2 border-accent-purple text-white'
                      : 'hover:bg-surface-hover/70 text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${category.color}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 truncate" title={node.name}>
                        {node.name}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${category.color} bg-background/50 border border-surface-border`}>
                        {category.label}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5" title={node.path}>
                      {truncate(node.path, 60)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs font-bold text-accent-purple">
                      {formatBytes(node.size)}
                    </span>
                    {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-accent-purple" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Info */}
        <div className="px-4 py-2 bg-background/60 border-t border-surface-border flex items-center justify-between text-[11px] text-slate-400">
          <span>
            {results.length > 0 ? `Showing ${results.length} matches` : 'Ready'}
          </span>
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 rounded bg-surface border border-surface-border">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1 py-0.5 rounded bg-surface border border-surface-border">↵</kbd> Select</span>
          </div>
        </div>
      </div>
    </div>
  );
};
