interface FileNode {
  id: number;
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  childIds: number[];
  parentId: number | null;
}

interface Slice {
  node: FileNode;
  depth: number;
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
}

interface Window {
  api: {
    selectFolder: () => Promise<string | null>;
    getHomeFolder: () => Promise<string>;
    setDockIcon: (dataUrl: string) => Promise<void>;
    scanFolder: (targetPath: string) => Promise<FileNode[]>;
    getDiskSpace: (targetPath: string) => Promise<{ total: number; available: number } | null>;
    deleteItem: (targetPath: string) => Promise<{ success: boolean; error?: string }>;
    revealInFolder: (targetPath: string) => Promise<void>;
    onScanProgress: (callback: (data: { path: string; count: number }) => void) => void;
  };
}

let flatNodes: FileNode[] = [];
let rootId: number | null = null;
let currentId: number | null = null;
let breadcrumbIds: number[] = [];
let pendingDeleteNode: FileNode | null = null;
let contextTarget: FileNode | null = null;

// ---- UI Elements ----
const canvas = document.getElementById('sunburst-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const listEl = document.getElementById('file-list') as HTMLUListElement;
const emptyEl = document.getElementById('empty-state') as HTMLDivElement;
const loadingEl = document.getElementById('loading-state') as HTMLDivElement;
const dashboardEl = document.getElementById('dashboard-layout') as HTMLDivElement;
const contextMenu = document.getElementById('context-menu') as HTMLDivElement;
const deleteModal = document.getElementById('delete-modal') as HTMLDivElement;
const loadingStatusText = document.getElementById('loading-status-text') as HTMLHeadingElement;
const diskInfoCard = document.getElementById('disk-info-card') as HTMLDivElement;

const focusNodeName = document.getElementById('focus-node-name') as HTMLHeadingElement;
const focusNodeSize = document.getElementById('focus-node-size') as HTMLParagraphElement;
const focusNodePath = document.getElementById('focus-node-path') as HTMLSpanElement;

const RING_WIDTH = 55;
const INNER_RADIUS = 50;
const MAX_DEPTH = 3;

let currentSlices: Slice[] = [];
let hoveredSlice: Slice | null = null;

// ---- File Size Formatter ----
function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

function showToast(title: string, message: string) {
  const container = document.getElementById('toast-container')!;
  const toast = document.createElement('div');
  toast.className = 'toast';

  toast.innerHTML = `
    <span class="toast-icon">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    </span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message" title="${message}">${message}</div>
    </div>
    <div class="toast-progress"></div>
  `;

  container.appendChild(toast);

  // Remove toast after animation
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

function getFileIcon(name: string, isDirectory: boolean): string {
  if (isDirectory) return '📁';
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': case 'jpg': case 'jpeg': case 'webp': case 'gif': case 'svg': case 'ico':
      return '🖼️';
    case 'mp4': case 'mkv': case 'mov': case 'avi': case 'webm':
      return '🎥';
    case 'zip': case 'tar': case 'gz': case 'rar': case '7z': case 'dmg': case 'iso':
      return '📦';
    case 'js': case 'ts': case 'tsx': case 'jsx': case 'html': case 'css': case 'json':
    case 'py': case 'go': case 'rs': case 'cpp': case 'c': case 'java': case 'sh':
      return '💻';
    case 'pdf': case 'doc': case 'docx': case 'txt': case 'md': case 'csv': case 'xlsx':
      return '📄';
    case 'mp3': case 'wav': case 'flac': case 'm4a': case 'ogg':
      return '🎵';
    default:
      return '📄';
  }
}

// ---- Drag & Drop Scanning ----
function setupDragAndDrop() {
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.body.style.opacity = '0.7';
  });

  const resetDrag = () => {
    document.body.style.opacity = '1.0';
  };

  document.addEventListener('dragleave', resetDrag);
  document.addEventListener('dragend', resetDrag);

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    resetDrag();

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0] as any;
      if (file.path) {
        startScan(file.path);
      }
    }
  });
}

// ---- Event Listeners ----
document.getElementById('choose-folder-btn')!.addEventListener('click', async () => {
  const folder = await window.api.selectFolder();
  if (folder) startScan(folder);
});

document.getElementById('empty-choose-btn')!.addEventListener('click', async () => {
  const folder = await window.api.selectFolder();
  if (folder) startScan(folder);
});

document.getElementById('rescan-btn')!.addEventListener('click', () => {
  if (rootId !== null && flatNodes[rootId]) startScan(flatNodes[rootId].path);
});

window.api.onScanProgress((data) => {
  loadingStatusText.textContent = `Scanning... ${data.count.toLocaleString()} items found`;
});

// ---- Scan Flow ----
async function startScan(targetPath: string) {
  // Reset lists and layouts to show loading
  emptyEl.classList.add('hidden');
  dashboardEl.classList.add('hidden');
  loadingEl.classList.remove('hidden');
  document.getElementById('rescan-btn')!.setAttribute('disabled', 'true');
  document.getElementById('scan-meta-stats')!.classList.add('hidden');
  loadingStatusText.textContent = 'Preparing scanner...';

  try {
    const nodes = await window.api.scanFolder(targetPath);
    flatNodes = nodes;
    rootId = 0;
    currentId = 0;
    breadcrumbIds = [0];

    loadingEl.classList.add('hidden');
    dashboardEl.classList.remove('hidden');
    document.getElementById('rescan-btn')!.removeAttribute('disabled');

    const totalFiles = nodes.length;
    document.getElementById('meta-files-count')!.textContent = totalFiles.toLocaleString();
    document.getElementById('scan-meta-stats')!.classList.remove('hidden');

    renderBreadcrumbs();
    renderList();
    updateFocusCard(flatNodes[0]);
    resizeCanvas();
    refreshStorageInfo();
  } catch (err: any) {
    console.error('Scan failed:', err);
    loadingEl.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    alert(`Failed to scan folder: ${err.message || err}`);
  }
}

async function refreshStorageInfo() {
  if (rootId === null || !flatNodes[rootId]) return;
  const path = flatNodes[rootId].path;
  const info = await window.api.getDiskSpace(path);

  const fillEl = document.getElementById('disk-progress-fill') as HTMLDivElement;
  const usageLabel = document.getElementById('disk-usage-label') as HTMLDivElement;
  const capacityLabel = document.getElementById('disk-capacity-label') as HTMLDivElement;

  if (info) {
    const used = info.total - info.available;
    const pct = (used / info.total) * 100;
    fillEl.style.width = `${pct}%`;
    usageLabel.textContent = `${formatBytes(used)} used of ${formatBytes(info.total)}`;
    capacityLabel.textContent = `${formatBytes(info.available)} available`;
    diskInfoCard.classList.remove('hidden');
  } else {
    usageLabel.textContent = 'Storage data unavailable';
    capacityLabel.textContent = '';
    fillEl.style.width = '0%';
  }
}

// ---- Navigation ----
function navigateTo(nodeId: number) {
  currentId = nodeId;
  const idx = breadcrumbIds.indexOf(nodeId);
  if (idx !== -1) {
    breadcrumbIds = breadcrumbIds.slice(0, idx + 1);
  } else {
    breadcrumbIds.push(nodeId);
  }
  hoveredSlice = null;
  renderBreadcrumbs();
  renderList();
  updateFocusCard(flatNodes[nodeId]);
  drawSunburst();
}

function renderBreadcrumbs() {
  const el = document.getElementById('breadcrumbs')!;
  el.innerHTML = '';
  breadcrumbIds.forEach((id, index) => {
    const node = flatNodes[id];
    const btn = document.createElement('button');
    btn.className = 'breadcrumb-btn' + (index === breadcrumbIds.length - 1 ? ' active' : '');
    btn.textContent = node.name || '/';
    btn.addEventListener('click', () => navigateTo(id));
    el.appendChild(btn);

    if (index < breadcrumbIds.length - 1) {
      const sep = document.createElement('span');
      sep.className = 'breadcrumb-sep';
      sep.textContent = '›';
      el.appendChild(sep);
    }
  });
}

// ---- List View Panel ----
function renderList() {
  listEl.innerHTML = '';
  if (currentId === null) return;
  const node = flatNodes[currentId];

  if (!node || node.childIds.length === 0) {
    const li = document.createElement('li');
    li.style.padding = '24px';
    li.style.textAlign = 'center';
    li.style.color = 'var(--color-text-muted)';
    li.textContent = 'This folder contains no scanable files.';
    listEl.appendChild(li);
    return;
  }

  for (const childId of node.childIds) {
    const child = flatNodes[childId];
    if (!child) continue;
    const li = document.createElement('li');
    li.className = 'file-row';
    const pct = node.size > 0 ? (child.size / node.size) * 100 : 0;

    li.innerHTML = `
      <span class="file-icon">${getFileIcon(child.name, child.isDirectory)}</span>
      <div class="file-info">
        <div class="file-name" title="${child.name}">${child.name}</div>
        <div class="file-bar-track">
          <div class="file-bar-fill" style="width: ${pct}%"></div>
        </div>
      </div>
      <div class="file-meta-actions">
        <span class="file-size">${formatBytes(child.size)}</span>
        <button class="row-menu-btn" title="More options">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="12" cy="5" r="1"></circle>
            <circle cx="12" cy="19" r="1"></circle>
          </svg>
        </button>
      </div>
    `;

    li.addEventListener('dblclick', () => {
      if (child.isDirectory) navigateTo(child.id);
    });

    li.addEventListener('click', () => {
      updateFocusCard(child);
      // Highlight matching slice in Sunburst
      const match = currentSlices.find(s => s.node.id === child.id);
      if (match) {
        hoveredSlice = match;
        drawSunburst();
      }
    });

    const menuBtn = li.querySelector('.row-menu-btn') as HTMLButtonElement;
    menuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = menuBtn.getBoundingClientRect();
      showContextMenu(rect.left - 130, rect.bottom + 6, child);
    });

    li.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, child);
    });

    listEl.appendChild(li);
  }
}

function updateFocusCard(node: FileNode) {
  focusNodeName.textContent = node.name || '/';
  focusNodeSize.textContent = formatBytes(node.size);
  focusNodePath.textContent = node.path;
}

// ---- Context Menu ----
function showContextMenu(x: number, y: number, node: FileNode) {
  contextTarget = node;
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.classList.remove('hidden');

  const openBtn = document.getElementById('ctx-open-btn')!;
  if (node.isDirectory) {
    openBtn.classList.remove('hidden');
  } else {
    openBtn.classList.add('hidden');
  }
}

document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (!contextMenu.contains(target)) {
    contextMenu.classList.add('hidden');
  }
});

document.getElementById('ctx-open-btn')!.addEventListener('click', () => {
  if (contextTarget && contextTarget.isDirectory) navigateTo(contextTarget.id);
  contextMenu.classList.add('hidden');
});

document.getElementById('ctx-reveal-btn')!.addEventListener('click', () => {
  if (contextTarget) window.api.revealInFolder(contextTarget.path);
  contextMenu.classList.add('hidden');
});

document.getElementById('ctx-delete-btn')!.addEventListener('click', () => {
  if (contextTarget) showDeleteModal(contextTarget);
  contextMenu.classList.add('hidden');
});

// ---- Delete Dialog ----
function showDeleteModal(node: FileNode) {
  pendingDeleteNode = node;
  document.getElementById('delete-modal-title')!.textContent = `Delete "${truncate(node.name, 28)}"?`;
  document.getElementById('delete-modal-detail')!.textContent = `This item and all its contents will be moved to the Trash/Recycle bin. This frees up ${formatBytes(node.size)}.`;
  deleteModal.classList.remove('hidden');
}

document.getElementById('delete-cancel-btn')!.addEventListener('click', () => {
  deleteModal.classList.add('hidden');
  pendingDeleteNode = null;
});

document.getElementById('delete-confirm-btn')!.addEventListener('click', async () => {
  if (!pendingDeleteNode) return;
  const node = pendingDeleteNode;
  deleteModal.classList.add('hidden');

  const result = await window.api.deleteItem(node.path);
  if (result.success) {
    removeNodeFromTree(node.id);
    if (currentId === node.id) {
      navigateTo(node.parentId !== null ? node.parentId : rootId || 0);
    } else {
      renderList();
      drawSunburst();
    }
    refreshStorageInfo();
    showToast('Deleted Successfully', `Moved "${node.name}" to Trash`);
  } else {
    showToast('Deletion Failed', result.error || 'Unknown error occurred');
  }
  pendingDeleteNode = null;
});

function removeNodeFromTree(nodeId: number) {
  const node = flatNodes[nodeId];
  if (!node) return;

  // Subtract sizes upwards
  let pid = node.parentId;
  while (pid !== null && flatNodes[pid]) {
    flatNodes[pid].size -= node.size;
    pid = flatNodes[pid].parentId;
  }

  // Remove child link from parent
  if (node.parentId !== null && flatNodes[node.parentId]) {
    flatNodes[node.parentId].childIds = flatNodes[node.parentId].childIds.filter(id => id !== nodeId);
  }
}

// ---- High-DPI Responsive Sunburst Chart ----
function resizeCanvas() {
  if (!dashboardEl.classList.contains('hidden')) {
    const container = document.getElementById('sunburst-container')!;
    const size = Math.max(Math.min(container.clientWidth, container.clientHeight) - 30, 200);

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    drawSunburst();
  }
}

window.addEventListener('resize', resizeCanvas);

function computeSlices(rootNode: FileNode): Slice[] {
  const slices: Slice[] = [];

  function recurse(node: FileNode, depth: number, startAngle: number, endAngle: number) {
    if (depth >= MAX_DEPTH || node.size <= 0) return;

    let current = startAngle;
    const totalSweep = endAngle - startAngle;

    for (const childId of node.childIds) {
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
        outerRadius: rOuter
      });

      recurse(child, depth + 1, current, childEnd);
      current = childEnd;
    }
  }

  recurse(rootNode, 0, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI);
  return slices;
}

function colorFor(node: FileNode, depth: number): string {
  let hash = 0;
  for (let i = 0; i < node.name.length; i++) {
    hash = (hash << 5) - hash + node.name.charCodeAt(i);
    hash |= 0;
  }

  // Elegant color scheme coordinates
  const hues = [265, 200, 310, 230, 280]; // Purples, teals, pinks, deep blues
  const baseHue = hues[Math.abs(hash) % hues.length];
  const hueOffset = (Math.abs(hash >> 3) % 20) - 10;
  const hue = (baseHue + hueOffset + 360) % 360;

  const saturation = 65 - depth * 5;
  const lightness = Math.max(55 - depth * 7, 35);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function drawSunburst() {
  const size = canvas.width / (window.devicePixelRatio || 1);
  ctx.clearRect(0, 0, size, size);

  if (currentId === null) return;
  const rootNode = flatNodes[currentId];
  if (!rootNode) return;

  currentSlices = computeSlices(rootNode);

  const cx = size / 2;
  const cy = size / 2;

  // Draw Slices
  for (const slice of currentSlices) {
    const isHovered = hoveredSlice && hoveredSlice.node.id === slice.node.id;

    ctx.beginPath();
    ctx.arc(cx, cy, slice.outerRadius, slice.startAngle, slice.endAngle, false);
    ctx.arc(cx, cy, slice.innerRadius, slice.endAngle, slice.startAngle, true);
    ctx.closePath();

    // Dim other slices if there is an active hover
    if (hoveredSlice && !isHovered) {
      ctx.fillStyle = 'rgba(24, 24, 37, 0.2)';
    } else {
      ctx.fillStyle = colorFor(slice.node, slice.depth);
    }

    ctx.fill();

    // Draw borders/glow around active slice
    if (isHovered) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(11, 11, 15, 0.4)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  // Draw Center Circle hole details
  ctx.beginPath();
  ctx.arc(cx, cy, INNER_RADIUS - 2, 0, Math.PI * 2);
  ctx.fillStyle = '#14141f'; // matching Focus box background
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Render text inside the hole
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(truncate(rootNode.name || '/', 10), cx, cy - 8);

  ctx.fillStyle = 'var(--accent-secondary)';
  ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(formatBytes(rootNode.size), cx, cy + 10);
}

function normalizeAngle(angle: number): number {
  const start = -Math.PI / 2;
  const twoPi = Math.PI * 2;
  let a = angle;
  while (a < start) a += twoPi;
  while (a >= start + twoPi) a -= twoPi;
  return a;
}

// Canvas interactions
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const cx = canvas.clientWidth / 2;
  const cy = canvas.clientHeight / 2;
  const dx = x - cx;
  const dy = y - cy;
  const radius = Math.sqrt(dx * dx + dy * dy);
  const angle = normalizeAngle(Math.atan2(dy, dx));

  const hit = currentSlices.find((slice) => {
    if (radius < slice.innerRadius || radius > slice.outerRadius) return false;
    return angle >= slice.startAngle && angle <= slice.endAngle;
  });

  if (hit && hit.node.isDirectory) {
    navigateTo(hit.node.id);
  }
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const cx = canvas.clientWidth / 2;
  const cy = canvas.clientHeight / 2;
  const dx = x - cx;
  const dy = y - cy;
  const radius = Math.sqrt(dx * dx + dy * dy);
  const angle = normalizeAngle(Math.atan2(dy, dx));

  const hit = currentSlices.find((slice) => {
    if (radius < slice.innerRadius || radius > slice.outerRadius) return false;
    return angle >= slice.startAngle && angle <= slice.endAngle;
  });

  if (hit) {
    if (hoveredSlice?.node.id !== hit.node.id) {
      hoveredSlice = hit;
      drawSunburst();
      updateFocusCard(hit.node);
    }
  } else {
    if (hoveredSlice !== null) {
      hoveredSlice = null;
      drawSunburst();
      if (currentId !== null && flatNodes[currentId]) {
        updateFocusCard(flatNodes[currentId]);
      }
    }
  }
});

canvas.addEventListener('mouseleave', () => {
  if (hoveredSlice !== null) {
    hoveredSlice = null;
    drawSunburst();
    if (currentId !== null && flatNodes[currentId]) {
      updateFocusCard(flatNodes[currentId]);
    }
  }
});

function cropAndSetAppIcon() {
  const size = 256;
  const canvasEl = document.createElement('canvas');
  canvasEl.width = size;
  canvasEl.height = size;
  const canvasCtx = canvasEl.getContext('2d');
  if (!canvasCtx) return;

  const img = new Image();
  img.onload = () => {
    // macOS rounded squircle corner radius is approx 21% of icon size
    const radius = size * 0.21;
    canvasCtx.beginPath();
    canvasCtx.roundRect(0, 0, size, size, radius);
    canvasCtx.clip();
    
    canvasCtx.drawImage(img, 0, 0, size, size);
    
    const dataUrl = canvasEl.toDataURL('image/png');
    window.api.setDockIcon(dataUrl).catch((err) => {
      console.warn('Failed to dynamically apply macOS Dock icon:', err.message);
    });
  };
  img.src = '../assets/favicon.png';
}

// Run Init & Default Scan of Home Directory
setupDragAndDrop();
cropAndSetAppIcon(); // Apply rounded corner mask for macOS Dock icon
window.api.getHomeFolder().then((homePath) => {
  if (homePath) {
    startScan(homePath);
  }
}).catch((err) => {
  console.error('Failed to trigger default scan on startup:', err);
});
