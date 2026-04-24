use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresetItem {
    pub label: String,
    pub picks_per_reset: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Preset {
    pub id: String,
    pub name: String,
    pub items: Vec<PresetItem>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresetsFile {
    pub version: i32,
    pub presets: Vec<Preset>,
}

impl Default for PresetsFile {
    fn default() -> Self {
        Self {
            version: 1,
            presets: vec![],
        }
    }
}
