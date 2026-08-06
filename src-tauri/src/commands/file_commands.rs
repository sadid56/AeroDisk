use crate::services::trash;

#[tauri::command]
pub fn delete_target_item(target_path: String) -> Result<(), String> {
    trash::delete_item(&target_path)
}

#[tauri::command]
pub fn delete_item_permanently(target_path: String) -> Result<(), String> {
    if crate::services::trash::is_protected_system_path(&target_path) {
        return Err("Cannot delete system directory permanently".to_string());
    }
    let path = std::path::Path::new(&target_path);
    if !path.exists() {
        return Err("Target path does not exist".to_string());
    }
    if path.is_dir() {
        std::fs::remove_dir_all(path).map_err(|e| format!("Failed to delete folder: {}", e))
    } else {
        std::fs::remove_file(path).map_err(|e| format!("Failed to delete file: {}", e))
    }
}

#[tauri::command]
pub fn reveal_target_item(target_path: String) -> Result<(), String> {
    trash::reveal_in_folder(&target_path)
}

#[tauri::command]
pub fn create_new_folder(parent_path: String, folder_name: String) -> Result<String, String> {
    trash::create_folder(&parent_path, &folder_name)
}

#[tauri::command]
pub fn open_in_terminal(target_path: String) -> Result<(), String> {
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

        if let Ok(status) = std::process::Command::new("xdg-terminal-exec")
            .current_dir(&dir_path)
            .status()
        {
            if status.success() {
                return Ok(());
            }
        }

        if std::process::Command::new("sensible-terminal")
            .current_dir(&dir_path)
            .spawn()
            .is_ok()
        {
            return Ok(());
        }

        if std::process::Command::new("x-terminal-emulator")
            .current_dir(&dir_path)
            .spawn()
            .is_ok()
        {
            return Ok(());
        }

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
