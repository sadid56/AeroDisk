use super::node::FileNode;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProgressPayload {
    #[serde(default)]
    pub scan_id: Option<String>,
    pub path: String,
    pub count: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScanDeltaPayload {
    pub scan_id: String,
    pub added: Vec<FileNode>,
    pub updated: Vec<FileNode>,
    pub path: String,
    pub count: usize,
    pub done: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScanCompletePayload {
    pub scan_id: String,
    pub count: usize,
    pub total_nodes: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScanErrorPayload {
    pub scan_id: String,
    pub message: String,
}
