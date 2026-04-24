use crate::fs;
use crate::models::Settings;
use std::path::PathBuf;

pub fn read(path: PathBuf) -> Result<Settings, crate::Error> {
    if !path.exists() {
        return Ok(Settings::default());
    }
    let content = fs::read_string(&path)?;
    let settings: Settings = serde_yaml::from_str(&content)?;
    Ok(settings)
}

pub fn write(path: PathBuf, settings: &Settings) -> Result<(), crate::Error> {
    let content = serde_yaml::to_string(settings)?;
    fs::write_string(path, &content)?;
    Ok(())
}
