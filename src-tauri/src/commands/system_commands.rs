use crate::services::trash;

#[tauri::command]
pub fn check_is_protected_path(target_path: String) -> bool {
    trash::is_protected_system_path(&target_path)
}

#[tauri::command]
pub fn check_full_disk_access() -> bool {
    crate::services::has_full_disk_access()
}

#[tauri::command]
pub fn request_full_disk_access(app: tauri::AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use tauri_plugin_opener::OpenerExt;
        let url = "x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles";
        app.opener().open_url(url, None::<String>).map_err(|e| e.to_string())
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = app;
        Ok(())
    }
}
