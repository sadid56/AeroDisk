use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};

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
    pub path: String,
    pub count: usize,
}

pub struct Scanner {
    nodes: Vec<FileNode>,
    counter: Arc<AtomicUsize>,
}

impl Scanner {
    pub fn new() -> Self {
        Self {
            nodes: Vec::new(),
            counter: Arc::new(AtomicUsize::new(0)),
        }
    }

    pub fn scan(&mut self, target_path: &str, app: Option<&AppHandle>) -> Result<Vec<FileNode>, String> {
        let root_path = Path::new(target_path);
        if !root_path.exists() {
            return Err(format!("Target path does not exist: {}", target_path));
        }

        self.scan_directory(root_path, None, app);
        self.sort_children();

        Ok(self.nodes.clone())
    }

    fn scan_directory(&mut self, dir_path: &Path, parent_id: Option<usize>, app: Option<&AppHandle>) -> usize {
        let id = self.nodes.len();
        let name = dir_path
            .file_name()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| dir_path.to_string_lossy().to_string());

        let node = FileNode {
            id,
            name,
            path: dir_path.to_string_lossy().to_string(),
            is_directory: true,
            size: 0,
            child_ids: Vec::new(),
            parent_id,
        };

        self.nodes.push(node);

        let entries = match fs::read_dir(dir_path) {
            Ok(entries) => entries,
            Err(_) => return id,
        };

        let mut total_size: u64 = 0;
        let mut children_indices = Vec::new();

        for entry in entries.flatten() {
            let file_type = match entry.file_type() {
                Ok(ft) => ft,
                Err(_) => continue,
            };

            if file_type.is_symlink() {
                continue;
            }

            let entry_path = entry.path();
            if file_type.is_dir() {
                let child_id = self.scan_directory(&entry_path, Some(id), app);
                let child_size = self.nodes[child_id].size;
                total_size += child_size;
                children_indices.push(child_id);
            } else if file_type.is_file() {
                let size = match entry.metadata() {
                    Ok(meta) => meta.len(),
                    Err(_) => 0,
                };

                let file_id = self.nodes.len();
                let file_name = entry_path
                    .file_name()
                    .map(|s| s.to_string_lossy().to_string())
                    .unwrap_or_default();

                self.nodes.push(FileNode {
                    id: file_id,
                    name: file_name,
                    path: entry_path.to_string_lossy().to_string(),
                    is_directory: false,
                    size,
                    child_ids: Vec::new(),
                    parent_id: Some(id),
                });

                total_size += size;
                children_indices.push(file_id);

                let count = self.counter.fetch_add(1, Ordering::Relaxed) + 1;
                if count % 1000 == 0 {
                    if let Some(app_handle) = app {
                        let _ = app_handle.emit(
                            "scan-progress",
                            ProgressPayload {
                                path: entry_path.to_string_lossy().to_string(),
                                count,
                            },
                        );
                    }
                }
            }
        }

        self.nodes[id].child_ids = children_indices;
        self.nodes[id].size = total_size;
        id
    }

    fn sort_children(&mut self) {
        let nodes_copy = self.nodes.clone();
        for node in self.nodes.iter_mut() {
            if node.is_directory {
                node.child_ids.sort_by(|&a, &b| {
                    let size_a = nodes_copy.get(a).map(|n| n.size).unwrap_or(0);
                    let size_b = nodes_copy.get(b).map(|n| n.size).unwrap_or(0);
                    size_b.cmp(&size_a)
                });
            }
        }
    }
}
