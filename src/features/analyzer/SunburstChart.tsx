import React, { useRef, useEffect, useCallback } from 'react';
import { FileNode, Slice } from '../../types';
import { formatBytes, truncate, getNodeColor } from '../../utils/formatters';

interface SunburstChartProps {
  flatNodes: FileNode[];
  currentId: number | null;
  hoveredNode: FileNode | null;
  isScanning: boolean;
  onHoverNode: (node: FileNode | null) => void;
  onNavigate: (nodeId: number) => void;
}

const MAX_DEPTH = 1;
const GAP_ANGLE = 0.006; // Elegant subtle arc gap

export const SunburstChart: React.FC<SunburstChartProps> = React.memo(({
  flatNodes,
  currentId,
  hoveredNode,
  isScanning: _isScanning,
  onHoverNode,
  onNavigate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const slicesRef = useRef<Slice[]>([]);
  const lastSlicesKeyRef = useRef<string>("");

  const rootNode = currentId !== null ? flatNodes[currentId] : null;

  // Compute slices recursively with dynamic radius metrics
  const computeSlices = useCallback(
    (root: FileNode, innerRadius: number, ringWidth: number): Slice[] => {
      const slices: Slice[] = [];

      function recurse(node: FileNode, depth: number, startAngle: number, endAngle: number) {
        if (depth >= MAX_DEPTH || node.size <= 0) return;

        const validChildren = (node.childIds || [])
          .map((id) => flatNodes[id])
          .filter((n): n is FileNode => Boolean(n) && n.size > 0);

        const totalChildrenSize = validChildren.reduce((sum, c) => sum + c.size, 0);
        if (totalChildrenSize <= 0) return;

        let current = startAngle;
        const totalSweep = endAngle - startAngle;

        for (const child of validChildren) {
          const fraction = child.size / totalChildrenSize;
          const sweep = totalSweep * fraction;
          const childEnd = current + sweep;

          // Apply subtle gap between adjacent arcs
          const adjustedStart = current + GAP_ANGLE / 2;
          const adjustedEnd = childEnd - GAP_ANGLE / 2;

          if (adjustedEnd > adjustedStart) {
            const rInner = innerRadius + depth * ringWidth;
            const rOuter = rInner + ringWidth - 3;

            slices.push({
              node: child,
              depth,
              startAngle: adjustedStart,
              endAngle: adjustedEnd,
              innerRadius: rInner,
              outerRadius: rOuter,
            });
          }

          if (child.isDirectory && child.childIds && child.childIds.length > 0) {
            recurse(child, depth + 1, current, childEnd);
          }

          current = childEnd;
        }
      }

      recurse(root, 0, 0, Math.PI * 2);
      return slices;
    },
    [flatNodes]
  );

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rootNode) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    // Calculate dynamic radial dimensions based on canvas bounds (maintains perfect ratio on any viewport)
    const maxRadius = Math.min(width, height) * 0.45;
    const innerRadius = maxRadius * 0.22;
    const ringWidth = (maxRadius - innerRadius) / MAX_DEPTH;

    // Use cache key to avoid recomputing slices on hover re-renders
    const cacheKey = `${rootNode.id}-${width}-${height}-${flatNodes.length}`;
    let slices = slicesRef.current;
    if (lastSlicesKeyRef.current !== cacheKey || slices.length === 0) {
      slices = computeSlices(rootNode, innerRadius, ringWidth);
      slicesRef.current = slices;
      lastSlicesKeyRef.current = cacheKey;
    }

    // Draw Slices
    for (const slice of slices) {
      const isHovered = hoveredNode && hoveredNode.id === slice.node.id;
      const outerR = isHovered ? slice.outerRadius + 7 : slice.outerRadius;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, slice.startAngle, slice.endAngle, false);
      ctx.arc(cx, cy, slice.innerRadius, slice.endAngle, slice.startAngle, true);
      ctx.closePath();

      if (isHovered) {
        ctx.shadowColor = '#8b5cf6';
        ctx.shadowBlur = 14;
        ctx.fillStyle = getNodeColor(slice.node.name, slice.depth);
      } else if (hoveredNode) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(18, 18, 23, 0.25)';
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = getNodeColor(slice.node.name, slice.depth);
      }

      ctx.fill();

      if (isHovered) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(9, 9, 11, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Center Hole Background & Label (Theme Adaptive)
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim() || '#f8fafc';
    const surfaceColor = getComputedStyle(document.documentElement).getPropertyValue('--surface-color').trim() || '#121217';

    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius - 3, 0, Math.PI * 2);
    ctx.fillStyle = surfaceColor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(140, 140, 160, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center Display Card Info (Scaled proportionally)
    const displayNode = hoveredNode || rootNode;
    const titleSize = Math.max(9, Math.min(13, innerRadius * 0.24));
    const sizeValSize = Math.max(8, Math.min(12, innerRadius * 0.22));
    const itemsSize = Math.max(7, Math.min(9, innerRadius * 0.18));

    const titleOffset = -innerRadius * 0.2;
    const sizeOffset = innerRadius * 0.16;
    const countOffset = innerRadius * 0.44;

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${titleSize}px Inter, sans-serif`;
    ctx.fillText(truncate(displayNode.name || '/', Math.floor(innerRadius * 0.26)), cx, cy + titleOffset);

    ctx.fillStyle = '#8b5cf6'; // matching active theme violet
    ctx.font = `700 ${sizeValSize}px JetBrains Mono, monospace`;
    ctx.fillText(formatBytes(displayNode.size), cx, cy + sizeOffset);

    if (displayNode.isDirectory && displayNode.childIds) {
      ctx.fillStyle = 'rgba(140, 140, 160, 0.6)';
      ctx.font = `500 ${itemsSize}px Inter, sans-serif`;
      ctx.fillText(`${displayNode.childIds.length} items`, cx, cy + countOffset);
    }
  }, [rootNode, hoveredNode, computeSlices]);

  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);

      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);

      drawChart();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawChart]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  const normalizeAngle = (angle: number): number => {
    return angle < 0 ? angle + Math.PI * 2 : angle;
  };

  const getSliceFromEvent = (e: React.MouseEvent<HTMLCanvasElement>): Slice | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;
    const dx = x - cx;
    const dy = y - cy;
    const radius = Math.sqrt(dx * dx + dy * dy);
    const angle = normalizeAngle(Math.atan2(dy, dx));

    return (
      slicesRef.current.find((slice) => {
        if (radius < slice.innerRadius || radius > slice.outerRadius) return false;
        return angle >= slice.startAngle && angle <= slice.endAngle;
      }) || null
    );
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const hit = getSliceFromEvent(e);
    if (hit && hit.node.isDirectory) {
      onNavigate(hit.node.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const hit = getSliceFromEvent(e);
    if (hit) {
      onHoverNode(hit.node);
    } else {
      onHoverNode(null);
    }
  };

  const handleMouseLeave = () => {
    onHoverNode(null);
  };

  if (!rootNode) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6 select-none">
        {/* Skeleton sunburst placeholder — feels like an instant page load */}
        <div className="relative" style={{ width: 240, height: 240 }}>
          {/* Outer ring */}
          <div
            className="absolute inset-0 rounded-full border-[18px] opacity-[0.08]"
            style={{ borderColor: 'var(--accent-purple-color)' }}
          />
          {/* Middle ring */}
          <div
            className="absolute rounded-full border-[14px] opacity-[0.06]"
            style={{
              inset: 26,
              borderColor: 'var(--accent-purple-color)',
            }}
          />
          {/* Inner ring */}
          <div
            className="absolute rounded-full border-[10px] opacity-[0.04]"
            style={{
              inset: 48,
              borderColor: 'var(--accent-purple-color)',
            }}
          />
          {/* Center hole */}
          <div
            className="absolute rounded-full flex flex-col items-center justify-center"
            style={{
              inset: 66,
              backgroundColor: 'var(--surface-color)',
              border: '1px solid var(--surface-border-color)',
            }}
          >
            <div className="w-12 h-2.5 rounded bg-surface-border/40 mb-2" />
            <div className="w-8 h-2 rounded bg-surface-border/30" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center relative p-4 select-none">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
      />
    </div>
  );
});
