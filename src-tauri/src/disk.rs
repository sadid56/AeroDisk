use serde::{Deserialize, Serialize};
use std::env;
use std::path::Path;
use sysinfo::Disks;

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
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserFolder {
    pub name: String,
    pub path: String,
    pub exists: bool,
}

pub fn get_disk_space(target_path: &str) -> Option<DiskSpaceInfo> {
    let disks = Disks::new_with_refreshed_list();
    let target = Path::new(target_path);

    let mut best_match: Option<(&sysinfo::Disk, usize)> = None;

    for disk in disks.iter() {
        let mount = disk.mount_point();
        if target.starts_with(mount) {
            let match_len = mount.to_string_lossy().len();
            if best_match.map_or(true, |(_, len)| match_len > len) {
                best_match = Some((disk, match_len));
            }
        }
    }

    if let Some((disk, _)) = best_match {
        return Some(DiskSpaceInfo {
            total: disk.total_space(),
            available: disk.available_space(),
        });
    }

    if let Some(disk) = disks.iter().next() {
        return Some(DiskSpaceInfo {
            total: disk.total_space(),
            available: disk.available_space(),
        });
    }

    None
}

pub fn get_system_drives() -> Vec<SystemDrive> {
    let disks = Disks::new_with_refreshed_list();
    let mut drives = Vec::new();

    for disk in disks.iter() {
        let raw_name = disk.name().to_string_lossy().to_string();
        let mount_str = disk.mount_point().to_string_lossy().to_string();

        let name = if raw_name.trim().is_empty() {
            if mount_str == "/" {
                "Root Drive (/)"
            } else {
                &mount_str
            }
            .to_string()
        } else {
            raw_name
        };

        drives.push(SystemDrive {
            name,
            mount_point: mount_str,
            total_space: disk.total_space(),
            available_space: disk.available_space(),
            file_system: disk.file_system().to_string_lossy().to_string(),
            is_removable: disk.is_removable(),
        });
    }

    drives
}

pub fn get_user_folders() -> Vec<UserFolder> {
    let home = env::var("HOME").or_else(|_| env::var("USERPROFILE")).unwrap_or_default();
    if home.is_empty() {
        return Vec::new();
    }

    let home_path = Path::new(&home);
    let candidates = vec![
        ("Home", home.clone()),
        ("Documents", home_path.join("Documents").to_string_lossy().to_string()),
        ("Downloads", home_path.join("Downloads").to_string_lossy().to_string()),
        ("Desktop", home_path.join("Desktop").to_string_lossy().to_string()),
        ("Pictures", home_path.join("Pictures").to_string_lossy().to_string()),
        ("Videos", home_path.join("Videos").to_string_lossy().to_string()),
        ("Music", home_path.join("Music").to_string_lossy().to_string()),
    ];

    let mut folders = Vec::new();
    for (name, path_str) in candidates {
        let p = Path::new(&path_str);
        if p.exists() && p.is_dir() {
            folders.push(UserFolder {
                name: name.to_string(),
                path: path_str,
                exists: true,
            });
        }
    }

    folders
}
