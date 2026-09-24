use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VocabText {
    pub word: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VocabEntry {
    pub id: String,
    pub source: VocabText,
    pub translation: VocabText,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub image: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Package {
    pub format: String,
    pub format_version: i32,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub legacy_data_version: Option<i32>,
    pub id: String,
    pub slug: String,
    pub name: String,
    #[serde(default)]
    pub description: String,
    pub source_language: String,
    pub target_language: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub sort_order: std::collections::BTreeMap<String, i32>,
    pub files: PackageFiles,
    pub created: PackageCreated,
    pub updated: PackageUpdated,
    #[serde(skip, default)]
    pub sort_method: String,
    #[serde(default)]
    pub entries: Vec<VocabEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageFiles {
    pub rawdata: String,
    pub data: String,
    pub images: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageCreated {
    pub at: DateTime<Utc>,
    pub by: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageUpdated {
    pub at: DateTime<Utc>,
}
