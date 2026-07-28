use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

// ─── Public types sent to frontend ──────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileNode {
    pub id: usize,
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub size: u64,
    pub child_ids: Vec<usize>,
    pub parent_id: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProgressPayload {
    #[serde(default)]
    pub scan_id: Option<String>,
    pub path: String,
    pub count: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScanDeltaPayload {
    pub scan_id: String,
    pub added: Vec<FileNode>,
    pub updated: Vec<FileNode>,
    pub path: String,
    pub count: usize,
    pub done: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScanCompletePayload {
    pub scan_id: String,
    pub count: usize,
    pub total_nodes: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScanErrorPayload {
    pub scan_id: String,
    pub message: String,
}

// ─── Intermediate tree (zero cross-thread sync) ─────────────────────────────

struct RawFile {
    name: String,
    path: PathBuf,
    size: u64,
}

struct RawDir {
    name: String,
    path: PathBuf,
    size: u64,
    files: Vec<RawFile>,
    subdirs: Vec<RawDir>,
}

// ─── Shared scan cache for on-demand path resolution ────────────────────────

pub struct ScanCache {
    paths: Arc<Mutex<Vec<String>>>,
}

impl Clone for ScanCache {
    fn clone(&self) -> Self {
        Self {
            paths: Arc::clone(&self.paths),
        }
    }
}

impl ScanCache {
    pub fn new() -> Self {
        Self {
            paths: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub fn get_path(&self, id: usize) -> Option<String> {
        let paths = self.paths.lock().unwrap();
        paths.get(id).cloned()
    }

    fn store_paths(&self, paths: Vec<String>) {
        let mut cache = self.paths.lock().unwrap();
        *cache = paths;
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

        // Phase 1: Parallel filesystem walk across all CPU cores
        let walk_start = Instant::now();
        let raw_tree = Self::walk_parallel(
            root_path,
            &progress,
            app_clone.as_ref(),
            total_start,
            &last_emit_ms,
            scan_id,
            root_path,
        );
        let _walk_ms = walk_start.elapsed();

        // Phase 2: Flatten to Vec<FileNode> with paths
        let flatten_start = Instant::now();
        let file_count = progress.load(Ordering::Relaxed);
        let capacity = file_count + file_count / 4 + 1024;
        let mut nodes = Vec::with_capacity(capacity);
        let mut paths = Vec::with_capacity(capacity);
        Self::flatten_tree(&raw_tree, None, &mut nodes, &mut paths);
        let _flatten_ms = flatten_start.elapsed();

        // Store paths in cache for on-demand resolution
        if let Some(c) = cache {
            c.store_paths(paths);
        }

        let _total_ms = total_start.elapsed();
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

        // Run the optimized parallel scanner!
        let nodes = self.scan(target_path, Some(app), cache, Some(&scan_id))?;
        let total_count = nodes.len();

        // Send the scanned tree in chunks to avoid Webview IPC payload size limitations and memory crashes
        let chunk_size = 10000;
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
            std::thread::sleep(Duration::from_millis(2));
        }

        // Send a final empty payload with done = true to trigger the final flush
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
    fn should_skip_directory(path: &Path, target_path: &Path) -> bool {
        if path == target_path {
            return false;
        }

        let path_str = path.to_string_lossy();
        let normalized = path_str.replace('\\', "/");

        let to_skip = [
            "/System/Volumes",
            "/Volumes",
            "/dev",
            "/proc",
            "/sys",
        ];

        for skip_path in to_skip.iter() {
            if normalized == *skip_path {
                return true;
            }
        }

        false
    }

    fn walk_parallel(
        dir: &Path,
        progress: &Arc<AtomicUsize>,
        app: Option<&AppHandle>,
        scan_start: Instant,
        last_emit_ms: &Arc<AtomicU64>,
        scan_id: Option<&str>,
        target_path: &Path,
    ) -> RawDir {
        let entries: Vec<fs::DirEntry> = fs::read_dir(dir)
            .ok()
            .map(|rd| rd.flatten().collect())
            .unwrap_or_default();

        let mut file_entries: Vec<fs::DirEntry> = Vec::new();
        let mut dir_entries: Vec<fs::DirEntry> = Vec::new();

        for entry in entries {
            let ft = match entry.file_type() {
                Ok(ft) => ft,
                Err(_) => continue,
            };

            if ft.is_symlink() {
                continue;
            }

            if ft.is_dir() {
                let entry_path = entry.path();
                if Self::should_skip_directory(&entry_path, target_path) {
                    continue;
                }
                dir_entries.push(entry);
            } else if ft.is_file() {
                file_entries.push(entry);
            }
        }

        let files: Vec<RawFile> = file_entries
            .into_par_iter()
            .filter_map(|entry| {
                let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
                let name = entry.file_name().to_string_lossy().into_owned();
                let path = entry.path();
                let count = progress.fetch_add(1, Ordering::Relaxed) + 1;
                if count == 1 || count % 2000 == 0 {
                    Self::emit_progress_throttled(app, dir, count, scan_start, last_emit_ms, scan_id);
                }
                Some(RawFile { name, path, size })
            })
            .collect();

        // ── Fan out into subdirectories across rayon worker threads ──
        let subdirs: Vec<RawDir> = dir_entries
            .par_iter()
            .map(|entry| Self::walk_parallel(&entry.path(), progress, app, scan_start, last_emit_ms, scan_id, target_path))
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
        let should_emit = count == 1 || count % 250 == 0 || elapsed_ms.saturating_sub(last_ms) >= 250;

        if !should_emit {
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
        paths: &mut Vec<String>,
    ) {
        let dir_id = nodes.len();
        let dir_path = raw.path.to_string_lossy().into_owned();

        paths.push(dir_path.clone());
        nodes.push(FileNode {
            id: dir_id,
            name: raw.name.clone(),
            path: dir_path,
            is_directory: true,
            size: raw.size,
            child_ids: Vec::new(),
            parent_id,
        });

        let mut child_ids = Vec::with_capacity(raw.subdirs.len() + raw.files.len());

        // Subdirs first, largest → smallest
        let mut sorted_dirs: Vec<usize> = (0..raw.subdirs.len()).collect();
        sorted_dirs.sort_unstable_by(|&a, &b| raw.subdirs[b].size.cmp(&raw.subdirs[a].size));

        for idx in sorted_dirs {
            let child_id = nodes.len();
            child_ids.push(child_id);
            Self::flatten_tree(&raw.subdirs[idx], Some(dir_id), nodes, paths);
        }

        // Files second, largest → smallest
        let mut sorted_files: Vec<usize> = (0..raw.files.len()).collect();
        sorted_files.sort_unstable_by(|&a, &b| raw.files[b].size.cmp(&raw.files[a].size));

        for idx in sorted_files {
            let file = &raw.files[idx];
            let file_id = nodes.len();
            let file_path = file.path.to_string_lossy().into_owned();
            child_ids.push(file_id);
            paths.push(file_path.clone());
            nodes.push(FileNode {
                id: file_id,
                name: file.name.clone(),
                path: file_path,
                is_directory: false,
                size: file.size,
                child_ids: Vec::new(),
                parent_id: Some(dir_id),
            });
        }

        nodes[dir_id].child_ids = child_ids;
    }
}
