use std::path::Path;

pub fn delete_item(target_path: &str) -> Result<(), String> {
    let path = Path::new(target_path);
    if !path.exists() {
        return Err(format!("Item does not exist: {}", target_path));
    }

    trash::delete(path).map_err(|e| format!("Failed to move item to trash: {}", e))
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
