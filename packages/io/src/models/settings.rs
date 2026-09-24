use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagDefinition {
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    pub order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub version: i32,
    pub language: String,
    #[serde(default)]
    pub tags: BTreeMap<String, TagDefinition>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            version: 1,
            language: "en-GB".to_string(),
            tags: BTreeMap::new(),
        }
    }
}
