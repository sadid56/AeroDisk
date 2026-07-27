use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
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

struct StreamSession {
    scan_id: String,
    app: AppHandle,
    last_emit: Instant,
}

impl StreamSession {
    fn new(scan_id: String, app: AppHandle) -> Self {
        Self {
            scan_id,
            app,
            last_emit: Instant::now(),
        }
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

        let mut session = StreamSession::new(scan_id.clone(), app.clone());
        let mut nodes: Vec<FileNode> = Vec::new();
        let mut dirty_ids: HashSet<usize> = HashSet::new();
        let mut pending_added: Vec<FileNode> = Vec::new();
        let mut progress = 0usize;

        let mut dir_stack: Vec<usize> = Vec::new();

        self.walk_streaming(
            root_path,
            None,
            &mut nodes,
            &mut pending_added,
            &mut dirty_ids,
            &mut progress,
            &mut session,
            &mut dir_stack,
        )?;

        let root_path_str = root_path.to_string_lossy().into_owned();

        self.maybe_flush_stream(
            &mut session,
            &nodes,
            &mut pending_added,
            &mut dirty_ids,
            progress,
            &root_path_str,
            true,
        )?;

        if let Some(c) = cache {
            let paths = nodes.iter().map(|node| node.path.clone()).collect();
            c.store_paths(paths);
        }

        let _ = session.app.emit(
            "scan-complete",
            ScanCompletePayload {
                scan_id,
                count: nodes.len(),
                total_nodes: nodes.len(),
            },
        );

        Ok(())
    }

    fn walk_streaming(
        &mut self,
        dir: &Path,
        parent_id: Option<usize>,
        nodes: &mut Vec<FileNode>,
        pending_added: &mut Vec<FileNode>,
        dirty_ids: &mut HashSet<usize>,
        progress: &mut usize,
        session: &mut StreamSession,
        dir_stack: &mut Vec<usize>,
    ) -> Result<u64, String> {
        let dir_id = nodes.len();
        let dir_path = dir.to_string_lossy().into_owned();
        let name = dir
            .file_name()
            .map(|s| s.to_string_lossy().into_owned())
            .unwrap_or_else(|| dir_path.clone());

        nodes.push(FileNode {
            id: dir_id,
            name,
            path: dir_path.clone(),
            is_directory: true,
            size: 0,
            child_ids: Vec::new(),
            parent_id,
        });
        pending_added.push(nodes[dir_id].clone());

        if let Some(pid) = parent_id {
            if let Some(parent) = nodes.get_mut(pid) {
                parent.child_ids.push(dir_id);
                dirty_ids.insert(pid);
            }
        }

        dir_stack.push(dir_id);
        self.maybe_flush_stream(
            session,
            nodes,
            pending_added,
            dirty_ids,
            *progress,
            &dir_path,
            false,
        )?;

        let entries: Vec<fs::DirEntry> = match fs::read_dir(dir) {
            Ok(rd) => rd.flatten().collect(),
            Err(_err) => {
                // Ignore unreadable directories and continue scanning the rest.
                dir_stack.pop();
                dirty_ids.insert(dir_id);
                self.maybe_flush_stream(
                    session,
                    nodes,
                    pending_added,
                    dirty_ids,
                    *progress,
                    &dir_path,
                    false,
                )?;
                return Ok(nodes[dir_id].size);
            }
        };

        for entry in entries {
            let ft = match entry.file_type() {
                Ok(ft) => ft,
                Err(_) => continue,
            };

            if ft.is_symlink() {
                continue;
            }

            let entry_path = entry.path();
            let entry_name = entry.file_name().to_string_lossy().into_owned();

            if ft.is_dir() {
                self.walk_streaming(
                    &entry_path,
                    Some(dir_id),
                    nodes,
                    pending_added,
                    dirty_ids,
                    progress,
                    session,
                    dir_stack,
                )?;
                self.maybe_flush_stream(
                    session,
                    nodes,
                    pending_added,
                    dirty_ids,
                    *progress,
                    &entry_path.to_string_lossy(),
                    false,
                )?;
            } else if ft.is_file() {
                let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
                let file_id = nodes.len();
                nodes.push(FileNode {
                    id: file_id,
                    name: entry_name,
                    path: entry_path.to_string_lossy().into_owned(),
                    is_directory: false,
                    size,
                    child_ids: Vec::new(),
                    parent_id: Some(dir_id),
                });
                pending_added.push(nodes[file_id].clone());

                if let Some(parent) = nodes.get_mut(dir_id) {
                    parent.child_ids.push(file_id);
                    dirty_ids.insert(dir_id);
                }

                for &ancestor_id in dir_stack.iter() {
                    if let Some(ancestor) = nodes.get_mut(ancestor_id) {
                        ancestor.size = ancestor.size.saturating_add(size);
                        dirty_ids.insert(ancestor_id);
                    }
                }

                *progress += 1;
                self.emit_progress_live(session, &entry_path, *progress)?;
                self.maybe_flush_stream(
                    session,
                    nodes,
                    pending_added,
                    dirty_ids,
                    *progress,
                    &entry_path.to_string_lossy(),
                    false,
                )?;
            }
        }

        dir_stack.pop();
        dirty_ids.insert(dir_id);
        self.maybe_flush_stream(
            session,
            nodes,
            pending_added,
            dirty_ids,
            *progress,
            &dir_path,
            false,
        )?;
        Ok(nodes[dir_id].size)
    }

    fn emit_progress_live(
        &self,
        session: &mut StreamSession,
        path: &Path,
        count: usize,
    ) -> Result<(), String> {
        let elapsed = session.last_emit.elapsed();
        let should_emit = count == 1 || count % 250 == 0 || elapsed >= Duration::from_millis(200);

        if !should_emit {
            return Ok(());
        }

        session.last_emit = Instant::now();
        session
            .app
            .emit(
                "scan-progress",
                ProgressPayload {
                    scan_id: Some(session.scan_id.clone()),
                    path: path.to_string_lossy().into_owned(),
                    count,
                },
            )
            .map_err(|err| err.to_string())
    }

    fn maybe_flush_stream(
        &self,
        session: &mut StreamSession,
        nodes: &[FileNode],
        pending_added: &mut Vec<FileNode>,
        dirty_ids: &mut HashSet<usize>,
        count: usize,
        path: &str,
        force: bool,
    ) -> Result<(), String> {
        let elapsed = session.last_emit.elapsed();
        let should_flush = force
            || !pending_added.is_empty() && pending_added.len() >= 16
            || !dirty_ids.is_empty() && dirty_ids.len() >= 16
            || elapsed >= Duration::from_millis(16);

        if !should_flush {
            return Ok(());
        }

        let added = std::mem::take(pending_added);
        let updated: Vec<FileNode> = dirty_ids
            .drain()
            .filter_map(|id| nodes.get(id).cloned())
            .collect();

        if added.is_empty() && updated.is_empty() {
            return Ok(());
        }

        session.last_emit = Instant::now();

        session
            .app
            .emit(
                "scan-delta",
                ScanDeltaPayload {
                    scan_id: session.scan_id.clone(),
                    added,
                    updated,
                    path: path.to_string(),
                    count,
                    done: force,
                },
            )
            .map_err(|err| err.to_string())
    }
}

// ─── Phase 1: Parallel Walk ─────────────────────────────────────────────────

impl Scanner {
    fn walk_parallel(
        dir: &Path,
        progress: &Arc<AtomicUsize>,
        app: Option<&AppHandle>,
        scan_start: Instant,
        last_emit_ms: &Arc<AtomicU64>,
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
                Self::emit_progress_throttled(app, dir, count, scan_start, last_emit_ms);
                Some(RawFile { name, path, size })
            })
            .collect();

        // ── Fan out into subdirectories across rayon worker threads ──
        let subdirs: Vec<RawDir> = dir_entries
            .par_iter()
            .map(|entry| Self::walk_parallel(&entry.path(), progress, app, scan_start, last_emit_ms))
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
                        scan_id: None,
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
