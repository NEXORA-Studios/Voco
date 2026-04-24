use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub version: i32,
    pub language: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            version: 1,
            language: "en-GB".to_string(),
        }
    }
}
