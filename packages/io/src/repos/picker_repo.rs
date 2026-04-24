use crate::fs;
use crate::models::picker::PresetsFile;
use crate::models::Preset;
use std::path::PathBuf;

fn read_file(path: PathBuf) -> Result<PresetsFile, crate::Error> {
    if !path.exists() {
        return Ok(PresetsFile::default());
    }
    let content = fs::read_string(&path)?;
    let file: PresetsFile = serde_yaml::from_str(&content)?;
    Ok(file)
}

fn write_file(path: PathBuf, file: &PresetsFile) -> Result<(), crate::Error> {
    let content = serde_yaml::to_string(file)?;
    fs::write_string(path, &content)?;
    Ok(())
}

pub fn list(path: PathBuf) -> Result<Vec<Preset>, crate::Error> {
    let file = read_file(path)?;
    Ok(file.presets)
}

pub fn read(path: PathBuf, id: &str) -> Result<Preset, crate::Error> {
    let file = read_file(path)?;
    file.presets
        .into_iter()
        .find(|p| p.id == id)
        .ok_or_else(|| crate::Error::NotFound(format!("preset {}", id)))
}

pub fn write(path: PathBuf, preset: &Preset) -> Result<(), crate::Error> {
    let mut file = read_file(path.clone())?;
    let idx = file.presets.iter().position(|p| p.id == preset.id);
    match idx {
        Some(i) => file.presets[i] = preset.clone(),
        None => file.presets.push(preset.clone()),
    }
    write_file(path, &file)?;
    Ok(())
}

pub fn delete(path: PathBuf, id: &str) -> Result<(), crate::Error> {
    let mut file = read_file(path.clone())?;
    file.presets.retain(|p| p.id != id);
    write_file(path, &file)?;
    Ok(())
}
