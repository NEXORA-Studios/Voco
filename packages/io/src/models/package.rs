use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VocabEntry {
    pub id: String,
    pub original: String,
    pub translation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Package {
    pub version: i32,
    pub id: String,
    pub bundle_slug: String,
    pub slug: String,
    pub name: String,
    pub description: String,
    pub sort_method: String,
    pub entries: Vec<VocabEntry>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
