use crate::models::{
    FileNode, ProgressPayload, ScanCompletePayload, ScanDeltaPayload,
};
use rayon::prelude::*;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Instant;
use tauri::{AppHandle, Emitter};

#[cfg(unix)]
use std::os::unix::fs::MetadataExt;

fn get_file_physical_size(meta: &fs::Metadata) -> u64 {
    #[cfg(unix)]
    {
        let physical = meta.blocks().saturating_mul(512);
        std::cmp::min(meta.len(), physical)
    }
    #[cfg(not(unix))]
    {
        meta.len()
    }
}

// ─── Intermediate tree ────────────────────────────────────────────────────────

struct RawFile {
    name: String,
    size: u64,
    created_at: Option<u64>,
}

struct RawDir {
    name: String,
    path: PathBuf,
    size: u64,
    created_at: Option<u64>,
    files: Vec<RawFile>,
    subdirs: Vec<RawDir>,
}

// ─── Shared scan cache for on-demand path resolution ────────────────────────

pub struct ScanCache {
    nodes: Arc<Mutex<Vec<FileNode>>>,
}

impl Clone for ScanCache {
    fn clone(&self) -> Self {
        Self {
            nodes: Arc::clone(&self.nodes),
        }
    }
}

impl ScanCache {
    pub fn new() -> Self {
        Self {
            nodes: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub fn get_path(&self, id: usize) -> Option<String> {
        let nodes = self.nodes.lock().unwrap();
        if id >= nodes.len() {
            return None;
        }

        let mut path_parts = Vec::new();
        let mut curr_id = id;
        let mut visited = std::collections::HashSet::new();

        loop {
            if !visited.insert(curr_id) {
                break;
            }
            let node = &nodes[curr_id];

            if node.parent_id.is_none() {
                if !node.path.is_empty() {
                    path_parts.push(node.path.clone());
                } else {
                    path_parts.push(node.name.clone());
                }
                break;
            } else {
                path_parts.push(node.name.clone());
                curr_id = node.parent_id.unwrap();
            }
        }

        path_parts.reverse();

        #[cfg(target_os = "windows")]
        {
            let mut pb = PathBuf::new();
            for part in path_parts {
                pb.push(part);
            }
            Some(pb.to_string_lossy().into_owned())
        }

        #[cfg(not(target_os = "windows"))]
        {
            let mut result = String::new();
            for (i, part) in path_parts.iter().enumerate() {
                if i == 0 {
                    result.push_str(part);
                } else {
                    if !result.ends_with('/') {
                        result.push('/');
                    }
                    result.push_str(part);
                }
            }
            Some(result)
        }
    }

    fn store_nodes(&self, nodes: Vec<FileNode>) {
        let mut cache = self.nodes.lock().unwrap();
        *cache = nodes;
    }
}

// ─── Scanner ────────────────────────────────────────────────────────────────

pub struct Scanner;

impl Scanner {
    pub fn new() -> Self {
        Self
    }

    pub fn scan(
        &mut self,
        target_path: &str,
        app: Option<&AppHandle>,
        cache: Option<&ScanCache>,
        scan_id: Option<&str>,
    ) -> Result<Vec<FileNode>, String> {
        let root_path = Path::new(target_path);
        if !root_path.exists() {
            return Err(format!("Target path does not exist: {}", target_path));
        }

        let total_start = Instant::now();
        let progress = Arc::new(AtomicUsize::new(0));
        let last_emit_ms = Arc::new(AtomicU64::new(0));
        let app_clone = app.cloned();

        let root_created_at = fs::metadata(root_path).ok().and_then(|m| {
            m.created()
                .or_else(|_| m.modified())
                .ok()
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs())
        });
        let raw_tree = Self::walk_parallel(
            root_path,
            root_created_at,
            &progress,
            app_clone.as_ref(),
            total_start,
            &last_emit_ms,
            scan_id,
            root_path,
        );

        let file_count = progress.load(Ordering::Relaxed);
        let capacity = file_count + file_count / 4 + 1024;
        let mut nodes = Vec::with_capacity(capacity);
        Self::flatten_tree(&raw_tree, None, &mut nodes);

        if let Some(c) = cache {
            c.store_nodes(nodes.clone());
        }

        Ok(nodes)
    }

    pub fn scan_stream(
        &mut self,
        target_path: &str,
        app: &AppHandle,
        cache: Option<&ScanCache>,
        scan_id: String,
    ) -> Result<(), String> {
        let root_path = Path::new(target_path);
        if !root_path.exists() {
            return Err(format!("Target path does not exist: {}", target_path));
        }

        let nodes = self.scan(target_path, Some(app), cache, Some(&scan_id))?;
        let total_count = nodes.len();

        let chunk_size = 50000;
        let mut chunks = nodes.chunks(chunk_size);

        while let Some(chunk) = chunks.next() {
            let _ = app.emit(
                "scan-delta",
                ScanDeltaPayload {
                    scan_id: scan_id.clone(),
                    added: chunk.to_vec(),
                    updated: Vec::new(),
                    path: target_path.to_string(),
                    count: total_count,
                    done: false,
                },
            );
        }

        let _ = app.emit(
            "scan-delta",
            ScanDeltaPayload {
                scan_id: scan_id.clone(),
                added: Vec::new(),
                updated: Vec::new(),
                path: target_path.to_string(),
                count: total_count,
                done: true,
            },
        );

        let _ = app.emit(
            "scan-complete",
            ScanCompletePayload {
                scan_id,
                count: total_count,
                total_nodes: total_count,
            },
        );

        Ok(())
    }
}

// ─── Phase 1: Parallel Walk ─────────────────────────────────────────────────

impl Scanner {
    fn should_skip_directory(dir: &Path, entry_name: &std::ffi::OsStr) -> bool {
        #[cfg(not(target_os = "windows"))]
        {
            if let Some(name_str) = entry_name.to_str() {
                if dir == Path::new("/") {
                    return name_str == "Volumes"
                        || name_str == "dev"
                        || name_str == "proc"
                        || name_str == "sys";
                } else if dir == Path::new("/System") {
                    return name_str == "Volumes";
                }
            }
        }
        false
    }

    fn walk_parallel(
        dir: &Path,
        created_at: Option<u64>,
        progress: &Arc<AtomicUsize>,
        app: Option<&AppHandle>,
        scan_start: Instant,
        last_emit_ms: &Arc<AtomicU64>,
        scan_id: Option<&str>,
        target_path: &Path,
    ) -> RawDir {
        let mut file_entries = Vec::new();
        let mut dir_entries = Vec::new();

        if let Ok(read_dir) = fs::read_dir(dir) {
            for entry in read_dir.flatten() {
                if let Ok(ft) = entry.file_type() {
                    if ft.is_symlink() {
                        continue;
                    }
                    if ft.is_dir() {
                        let name = entry.file_name();
                        if !Self::should_skip_directory(dir, &name) {
                            dir_entries.push(entry);
                        }
                    } else if ft.is_file() {
                        file_entries.push(entry);
                    }
                }
            }
        }

        let process_file = |entry: fs::DirEntry| {
            let meta = entry.metadata().ok();
            let size = meta.as_ref().map(get_file_physical_size).unwrap_or(0);
            let name = entry.file_name().to_string_lossy().into_owned();
            let count = progress.fetch_add(1, Ordering::Relaxed) + 1;
            if count == 1 || count % 2000 == 0 {
                Self::emit_progress_throttled(app, dir, count, scan_start, last_emit_ms, scan_id);
            }
            Some(RawFile { name, size, created_at: None })
        };

        let files: Vec<RawFile> = if file_entries.len() > 16 {
            file_entries.into_par_iter().filter_map(process_file).collect()
        } else {
            file_entries.into_iter().filter_map(process_file).collect()
        };

        let subdirs: Vec<RawDir> = dir_entries
            .par_iter()
            .map(|entry| {
                let entry_path = entry.path();
                Self::walk_parallel(
                    &entry_path,
                    None,
                    progress,
                    app,
                    scan_start,
                    last_emit_ms,
                    scan_id,
                    target_path,
                )
            })
            .collect();

        let file_size: u64 = files.iter().map(|f| f.size).sum();
        let dir_size: u64 = subdirs.iter().map(|d| d.size).sum();

        let name = dir
            .file_name()
            .map(|s| s.to_string_lossy().into_owned())
            .unwrap_or_else(|| dir.to_string_lossy().into_owned());

        RawDir {
            name,
            path: dir.to_path_buf(),
            size: file_size + dir_size,
            created_at,
            files,
            subdirs,
        }
    }

    fn emit_progress_throttled(
        app: Option<&AppHandle>,
        dir: &Path,
        count: usize,
        scan_start: Instant,
        last_emit_ms: &Arc<AtomicU64>,
        scan_id: Option<&str>,
    ) {
        let elapsed_ms = scan_start.elapsed().as_millis() as u64;
        let last_ms = last_emit_ms.load(Ordering::Relaxed);

        if count > 1 && elapsed_ms.saturating_sub(last_ms) < 150 {
            return;
        }

        if last_emit_ms
            .compare_exchange(last_ms, elapsed_ms, Ordering::Relaxed, Ordering::Relaxed)
            .is_ok()
        {
            if let Some(handle) = app {
                let _ = handle.emit(
                    "scan-progress",
                    ProgressPayload {
                        scan_id: scan_id.map(|s| s.to_string()),
                        path: dir.to_string_lossy().into_owned(),
                        count,
                    },
                );
            }
        }
    }
}

// ─── Phase 2: Flatten Tree → Vec<FileNode> ──────────────────────────────────

impl Scanner {
    fn flatten_tree(
        raw: &RawDir,
        parent_id: Option<usize>,
        nodes: &mut Vec<FileNode>,
    ) {
        let dir_id = nodes.len();

        nodes.push(FileNode {
            id: dir_id,
            name: raw.name.clone(),
            path: if parent_id.is_none() { raw.path.to_string_lossy().into_owned() } else { String::new() },
            is_directory: true,
            size: raw.size,
            child_ids: Vec::new(),
            parent_id,
            created_at: raw.created_at,
        });

        let mut child_ids = Vec::with_capacity(raw.subdirs.len() + raw.files.len());

        let mut sorted_dirs: Vec<usize> = (0..raw.subdirs.len()).collect();
        sorted_dirs.sort_unstable_by(|&a, &b| raw.subdirs[b].size.cmp(&raw.subdirs[a].size));

        for idx in sorted_dirs {
            let child_id = nodes.len();
            child_ids.push(child_id);
            Self::flatten_tree(&raw.subdirs[idx], Some(dir_id), nodes);
        }

        let mut sorted_files: Vec<usize> = (0..raw.files.len()).collect();
        sorted_files.sort_unstable_by(|&a, &b| raw.files[b].size.cmp(&raw.files[a].size));

        for (rank, &idx) in sorted_files.iter().enumerate() {
            let file = &raw.files[idx];
            if rank < 60 || file.size >= 102_400 {
                let file_id = nodes.len();
                child_ids.push(file_id);
                nodes.push(FileNode {
                    id: file_id,
                    name: file.name.clone(),
                    path: String::new(),
                    is_directory: false,
                    size: file.size,
                    child_ids: Vec::new(),
                    parent_id: Some(dir_id),
                    created_at: file.created_at,
                });
            }
        }

        nodes[dir_id].child_ids = child_ids;
    }
}
