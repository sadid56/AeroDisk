use crate::models::{FileNode, ScanErrorPayload};
use crate::services::{ScanCache, Scanner};
use std::thread;
use tauri::Emitter;

#[tauri::command]
pub async fn scan_folder(
    app: tauri::AppHandle,
    cache: tauri::State<'_, ScanCache>,
    target_path: String,
) -> Result<Vec<FileNode>, String> {
    let cache_ref = cache.inner().clone();
    tokio::task::spawn_blocking(move || {
        let mut scanner = Scanner::new();
        scanner.scan(&target_path, Some(&app), Some(&cache_ref), None)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub fn scan_folder_live(
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
                ScanErrorPayload {
                    scan_id,
                    message: err,
                },
            );
        }
    });

    Ok(())
}

#[tauri::command]
pub fn resolve_node_path(cache: tauri::State<'_, ScanCache>, node_id: usize) -> Option<String> {
    cache.get_path(node_id)
}
