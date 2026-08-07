use serde::{Deserialize, Serialize};

fn is_empty_vec<T>(v: &Vec<T>) -> bool {
    v.is_empty()
}

fn is_false(b: &bool) -> bool {
    !*b
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileNode {
    pub id: usize,
    pub name: String,
    #[serde(skip_serializing_if = "String::is_empty")]
    pub path: String,
    #[serde(skip_serializing_if = "is_false")]
    pub is_directory: bool,
    #[serde(default, skip_serializing_if = "is_false")]
    pub is_symlink: bool,
    pub size: u64,
    #[serde(skip_serializing_if = "is_empty_vec")]
    pub child_ids: Vec<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<u64>,
}
