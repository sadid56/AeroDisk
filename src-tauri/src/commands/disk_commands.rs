use crate::models::{
    DirectoryEntry, DiskSpaceInfo, SystemDrive, UserFolder, LargeFile, CleanupSuggestion, DuplicateGroup
};
use crate::services::{
    get_disk_space, get_system_drives, get_user_folders, list_directory_entries,
    get_large_files, get_cleanup_suggestions, get_duplicate_files, perform_system_cleanup,
    get_cleanup_details, search_system_directory,
};

#[tauri::command]
pub fn execute_system_cleanup(app: tauri::AppHandle, id: String) -> Result<(), String> {
    perform_system_cleanup(&app, id)
}

#[tauri::command]
pub fn fetch_cleanup_details(app: tauri::AppHandle, id: String) -> Vec<DirectoryEntry> {
    get_cleanup_details(&app, &id)
}

#[tauri::command]
pub fn search_system(app: tauri::AppHandle, query: String) -> Vec<DirectoryEntry> {
    search_system_directory(&app, &query)
}

#[tauri::command]
pub fn get_disk_info(target_path: String) -> Option<DiskSpaceInfo> {
    get_disk_space(&target_path)
}

#[tauri::command]
pub fn fetch_system_drives() -> Vec<SystemDrive> {
    get_system_drives()
}

#[tauri::command]
pub fn fetch_user_folders(app: tauri::AppHandle) -> Vec<UserFolder> {
    get_user_folders(&app)
}

#[tauri::command]
pub fn fetch_large_files(app: tauri::AppHandle) -> Vec<LargeFile> {
    get_large_files(&app)
}

#[tauri::command]
pub fn fetch_cleanup_suggestions(app: tauri::AppHandle) -> Vec<CleanupSuggestion> {
    get_cleanup_suggestions(&app)
}

#[tauri::command]
pub fn fetch_duplicate_files(app: tauri::AppHandle) -> Vec<DuplicateGroup> {
    get_duplicate_files(&app)
}

#[tauri::command]
pub fn fetch_directory_entries(target_path: String) -> Result<Vec<DirectoryEntry>, String> {
    list_directory_entries(&target_path)
}

#[tauri::command]
pub fn get_home_folder() -> Result<String, String> {
    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|_| "Could not determine home directory".to_string())
}
