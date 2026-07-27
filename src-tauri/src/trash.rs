use std::fs;
use std::path::Path;

const PROTECTED_PATHS: &[&str] = &[
    "/",
    "/boot",
    "/boot/efi",
    "/etc",
    "/usr",
    "/var",
    "/sys",
    "/proc",
    "/dev",
    "/run",
    "/bin",
    "/sbin",
    "/lib",
    "/lib64",
    "c:\\",
    "c:\\windows",
    "c:\\windows\\system32",
    "c:\\program files",
    "c:\\program files (x86)",
];

pub fn is_protected_system_path(target_path: &str) -> bool {
    let clean_path = target_path.trim().to_lowercase();
    let normalized = clean_path.trim_end_matches('/');

    for protected in PROTECTED_PATHS {
        let p_clean = protected.to_lowercase();
        let p_norm = p_clean.trim_end_matches('/');
        if normalized == p_norm || clean_path == p_clean {
            return true;
        }
    }
    false
}

pub fn delete_item(target_path: &str) -> Result<(), String> {
    if is_protected_system_path(target_path) {
        return Err(format!(
            "Protected System Path: Deletion disabled for critical system path ({})",
            target_path
        ));
    }

    let path = Path::new(target_path);
    if !path.exists() {
        return Err(format!("Item does not exist: {}", target_path));
    }

    trash::delete(path).map_err(|e| format!("Failed to move item to trash: {}", e))
}

pub fn create_folder(parent_path: &str, folder_name: &str) -> Result<String, String> {
    let parent = Path::new(parent_path);
    if !parent.exists() {
        return Err(format!("Parent path does not exist: {}", parent_path));
    }

    let clean_name = folder_name.trim();
    if clean_name.is_empty() {
        return Err("Folder name cannot be empty".to_string());
    }

    let new_folder_path = parent.join(clean_name);
    if new_folder_path.exists() {
        return Err(format!("Folder already exists: {}", new_folder_path.display()));
    }

    fs::create_dir_all(&new_folder_path).map_err(|e| format!("Failed to create folder: {}", e))?;

    Ok(new_folder_path.to_string_lossy().to_string())
}

pub fn reveal_in_folder(target_path: &str) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        Command::new("explorer")
            .args(["/select,", target_path])
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        Command::new("open")
            .args(["-R", target_path])
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        let path = Path::new(target_path);
        let dir = if path.is_dir() {
            target_path
        } else {
            path.parent()
                .map(|p| p.to_str().unwrap_or("."))
                .unwrap_or(".")
        };

        Command::new("xdg-open")
            .arg(dir)
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
}
