use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiskSpaceInfo {
    pub total: u64,
    pub available: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemDrive {
    pub name: String,
    pub mount_point: String,
    pub total_space: u64,
    pub available_space: u64,
    pub file_system: String,
    pub is_removable: bool,
    pub is_read_only: bool,
    pub smart_status: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserFolder {
    pub name: String,
    pub path: String,
    pub exists: bool,
    pub size: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DirectoryEntry {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub size: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LargeFile {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub file_type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CleanupSuggestion {
    pub id: String,
    pub title: String,
    pub desc: String,
    pub size: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DuplicateGroup {
    pub name: String,
    pub size: u64,
    pub count: u32,
    pub total_waste: u64,
    pub paths: Vec<String>,
}
