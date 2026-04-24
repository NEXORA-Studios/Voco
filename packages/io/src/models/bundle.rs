use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BundleMeta {
    pub version: i32,
    pub id: String,
    pub slug: String,
    pub name: String,
    pub package_slugs: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
