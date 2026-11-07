use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagDefinition {
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    pub order: i32,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "snake_case")]
pub enum ImageDisplayMethod {
    #[default]
    Right,
    Dialog,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionDisplaySettings {
    #[serde(default = "default_true")]
    pub original: bool,
    #[serde(default = "default_true")]
    pub translation: bool,
    #[serde(default)]
    pub original_description: bool,
    #[serde(default)]
    pub translation_description: bool,
    #[serde(default = "default_true")]
    pub original_description_follows_word: bool,
    #[serde(default = "default_true")]
    pub translation_description_follows_word: bool,
    #[serde(default)]
    pub image: bool,
    #[serde(default)]
    pub image_method: ImageDisplayMethod,
}

fn default_true() -> bool {
    true
}

impl Default for SessionDisplaySettings {
    fn default() -> Self {
        Self {
            original: true,
            translation: true,
            original_description: false,
            translation_description: false,
            original_description_follows_word: true,
            translation_description_follows_word: true,
            image: true,
            image_method: ImageDisplayMethod::Right,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub version: i32,
    pub language: String,
    #[serde(default)]
    pub tags: BTreeMap<String, TagDefinition>,
    #[serde(default)]
    pub session_display: SessionDisplaySettings,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            version: 1,
            language: "en-GB".to_string(),
            tags: BTreeMap::new(),
            session_display: SessionDisplaySettings::default(),
        }
    }
}
