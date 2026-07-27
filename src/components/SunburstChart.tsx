import React, { useRef, useEffect, useCallback } from 'react';
import { FileNode, Slice } from '../types';
import { formatBytes, truncate, getNodeColor } from '../utils/formatters';

interface SunburstChartProps {
  flatNodes: FileNode[];
  currentId: number | null;
  hoveredNode: FileNode | null;
  onHoverNode: (node: FileNode | null) => void;
  onNavigate: (nodeId: number) => void;
}

const RING_WIDTH = 52;
const INNER_RADIUS = 48;
const MAX_DEPTH = 3;

export const SunburstChart: React.FC<SunburstChartProps> = ({
  flatNodes,
  currentId,
  hoveredNode,
  onHoverNode,
  onNavigate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const slicesRef = useRef<Slice[]>([]);

  const rootNode = currentId !== null ? flatNodes[currentId] : null;

  // Compute slices recursively
  const computeSlices = useCallback(
    (root: FileNode): Slice[] => {
      const slices: Slice[] = [];

      function recurse(node: FileNode, depth: number, startAngle: number, endAngle: number) {
        if (depth >= MAX_DEPTH || node.size <= 0) return;

        let current = startAngle;
        const totalSweep = endAngle - startAngle;

        for (const childId of node.childIds || []) {
          const child = flatNodes[childId];
          if (!child || child.size <= 0) continue;

          const fraction = child.size / node.size;
          const sweep = totalSweep * fraction;
          const childEnd = current + sweep;

          const rInner = INNER_RADIUS + depth * RING_WIDTH;
          const rOuter = rInner + RING_WIDTH - 2;

          slices.push({
            node: child,
            depth,
            startAngle: current,
            endAngle: childEnd,
            innerRadius: rInner,
            outerRadius: rOuter,
          });

          recurse(child, depth + 1, current, childEnd);
          current = childEnd;
        }
      }

      recurse(root, 0, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI);
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

    const slices = computeSlices(rootNode);
    slicesRef.current = slices;

    // Draw Slices
    for (const slice of slices) {
      const isHovered = hoveredNode && hoveredNode.id === slice.node.id;

      ctx.beginPath();
      ctx.arc(cx, cy, slice.outerRadius, slice.startAngle, slice.endAngle, false);
      ctx.arc(cx, cy, slice.innerRadius, slice.endAngle, slice.startAngle, true);
      ctx.closePath();

      if (hoveredNode && !isHovered) {
        ctx.fillStyle = 'rgba(18, 18, 23, 0.25)';
      } else {
        ctx.fillStyle = getNodeColor(slice.node.name, slice.depth);
      }

      ctx.fill();

      if (isHovered) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(9, 9, 11, 0.4)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // Center Hole Background
    ctx.beginPath();
    ctx.arc(cx, cy, INNER_RADIUS - 2, 0, Math.PI * 2);
    ctx.fillStyle = '#121217';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center Label
    const displayNode = hoveredNode || rootNode;
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 12px Inter, sans-serif';
    ctx.fillText(truncate(displayNode.name || '/', 12), cx, cy - 8);

    ctx.fillStyle = '#a855f7';
    ctx.font = '700 11px JetBrains Mono, monospace';
    ctx.fillText(formatBytes(displayNode.size), cx, cy + 10);
  }, [rootNode, computeSlices, hoveredNode]);

  // Handle Resize and Canvas Setup
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const size = Math.max(Math.min(container.clientWidth, container.clientHeight) - 20, 220);
      const dpr = window.devicePixelRatio || 1;

      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
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
    const start = -Math.PI / 2;
    const twoPi = Math.PI * 2;
    let a = angle;
    while (a < start) a += twoPi;
    while (a >= start + twoPi) a -= twoPi;
    return a;
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

  if (!rootNode) return null;

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center relative p-4">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
      />
    </div>
  );
};
