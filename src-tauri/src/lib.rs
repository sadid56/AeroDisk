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
        scanner.scan(&target_path, Some(&app), Some(&cache_ref), None)
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
fn open_in_terminal(target_path: String) -> Result<(), String> {
    let dir_path = {
        let p = std::path::Path::new(&target_path);
        if p.is_dir() {
            target_path.clone()
        } else {
            p.parent()
                .map(|pp| pp.to_string_lossy().to_string())
                .unwrap_or(target_path.clone())
        }
    };

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(["-a", "Terminal", &dir_path])
            .spawn()
            .map_err(|e| format!("Failed to open Terminal: {}", e))?;
        Ok(())
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/c", "start", "cmd", "/k", &format!("cd /d \"{}\"", dir_path)])
            .spawn()
            .map_err(|e| format!("Failed to open terminal: {}", e))?;
        Ok(())
    }

    #[cfg(target_os = "linux")]
    {
        // 1. Try $TERMINAL environment variable if set by user
        if let Ok(env_term) = std::env::var("TERMINAL") {
            if !env_term.trim().is_empty() {
                if let Ok(status) = std::process::Command::new(&env_term)
                    .current_dir(&dir_path)
                    .status()
                {
                    if status.success() {
                        return Ok(());
                    }
                }
            }
        }

        // 2. Try xdg-terminal-exec (Freedesktop default terminal specification)
        if let Ok(status) = std::process::Command::new("xdg-terminal-exec")
            .current_dir(&dir_path)
            .status()
        {
            if status.success() {
                return Ok(());
            }
        }

        // 3. Try sensible-terminal
        if std::process::Command::new("sensible-terminal")
            .current_dir(&dir_path)
            .spawn()
            .is_ok()
        {
            return Ok(());
        }

        // 4. Try x-terminal-emulator
        if std::process::Command::new("x-terminal-emulator")
            .current_dir(&dir_path)
            .spawn()
            .is_ok()
        {
            return Ok(());
        }

        // 5. Fallback list of popular Linux terminal emulators
        let fallback_terminals = [
            "ptyxis",
            "gnome-terminal",
            "konsole",
            "xfce4-terminal",
            "alacritty",
            "kitty",
            "foot",
            "terminator",
            "tilix",
            "xterm",
        ];

        for term in fallback_terminals.iter() {
            if std::process::Command::new(term)
                .current_dir(&dir_path)
                .spawn()
                .is_ok()
            {
                return Ok(());
            }
        }

        Err("Failed to open terminal: Could not launch system terminal emulator".to_string())
    }
}

#[tauri::command]
fn check_is_protected_path(target_path: String) -> bool {
    trash::is_protected_system_path(&target_path)
}

#[tauri::command]
fn check_full_disk_access() -> bool {
    #[cfg(target_os = "macos")]
    {
        if let Ok(home) = std::env::var("HOME") {
            let path = std::path::Path::new(&home).join("Library/Mail");
            match std::fs::read_dir(path) {
                Ok(_) => true,
                Err(err) => err.kind() != std::io::ErrorKind::PermissionDenied,
            }
        } else {
            false
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        true
    }
}

#[tauri::command]
fn request_full_disk_access(app: tauri::AppHandle) -> Result<(), String> {
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
            check_is_protected_path,
            check_full_disk_access,
            request_full_disk_access,
            open_in_terminal
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
