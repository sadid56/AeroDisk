mod disk;
mod scanner;
mod trash;

use disk::{
    get_disk_space,
    get_system_drives,
    get_user_folders,
    list_directory_entries,
    DirectoryEntry,
    DiskSpaceInfo,
    SystemDrive,
    UserFolder,
};
use scanner::{FileNode, ScanCache, Scanner};
use std::env;
use std::thread;
use tauri::Emitter;

#[tauri::command]
async fn scan_folder(
    app: tauri::AppHandle,
    cache: tauri::State<'_, ScanCache>,
    target_path: String,
) -> Result<Vec<FileNode>, String> {
    let cache_ref = cache.inner().clone();
    tokio::task::spawn_blocking(move || {
        let mut scanner = Scanner::new();
        scanner.scan(&target_path, Some(&app), Some(&cache_ref))
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
fn scan_folder_live(
    app: tauri::AppHandle,
    cache: tauri::State<'_, ScanCache>,
    target_path: String,
    scan_id: String,
) -> Result<(), String> {
    let cache_ref = cache.inner().clone();
    thread::spawn(move || {
        let mut scanner = Scanner::new();
        if let Err(err) = scanner.scan_stream(&target_path, &app, Some(&cache_ref), scan_id.clone()) {
            let _ = app.emit(
                "scan-error",
                scanner::ScanErrorPayload {
                    scan_id,
                    message: err,
                },
            );
        }
    });

    Ok(())
}

#[tauri::command]
fn resolve_node_path(cache: tauri::State<'_, ScanCache>, node_id: usize) -> Option<String> {
    cache.get_path(node_id)
}

#[tauri::command]
fn get_disk_info(target_path: String) -> Option<DiskSpaceInfo> {
    get_disk_space(&target_path)
}

#[tauri::command]
fn fetch_system_drives() -> Vec<SystemDrive> {
    get_system_drives()
}

#[tauri::command]
fn fetch_user_folders() -> Vec<UserFolder> {
    get_user_folders()
}

#[tauri::command]
fn fetch_directory_entries(target_path: String) -> Result<Vec<DirectoryEntry>, String> {
    list_directory_entries(&target_path)
}

#[tauri::command]
fn get_home_folder() -> Result<String, String> {
    env::var("HOME")
        .or_else(|_| env::var("USERPROFILE"))
        .map_err(|_| "Could not determine home directory".to_string())
}

#[tauri::command]
fn delete_target_item(target_path: String) -> Result<(), String> {
    trash::delete_item(&target_path)
}

#[tauri::command]
fn reveal_target_item(target_path: String) -> Result<(), String> {
    trash::reveal_in_folder(&target_path)
}

#[tauri::command]
fn create_new_folder(parent_path: String, folder_name: String) -> Result<String, String> {
    trash::create_folder(&parent_path, &folder_name)
}

#[tauri::command]
fn check_is_protected_path(target_path: String) -> bool {
    trash::is_protected_system_path(&target_path)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(ScanCache::new())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            scan_folder,
            scan_folder_live,
            resolve_node_path,
            get_disk_info,
            fetch_system_drives,
            fetch_user_folders,
            fetch_directory_entries,
            get_home_folder,
            delete_target_item,
            reveal_target_item,
            create_new_folder,
            check_is_protected_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
