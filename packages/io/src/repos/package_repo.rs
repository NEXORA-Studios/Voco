use crate::models::{Package, PackageCreated, PackageFiles, PackageUpdated, VocabEntry, VocabText};
use chrono::Utc;
use std::collections::BTreeMap;
use std::fs;
use std::path::{Component, Path, PathBuf};

#[derive(serde::Serialize, serde::Deserialize)]
struct DataFile {
    format: String,
    format_version: i32,
    package_id: String,
    sort_method: String,
    rows: Vec<DataRow>,
}

#[derive(serde::Serialize, serde::Deserialize)]
struct DataRow {
    id: String,
    original_index: i32,
    runtime_index: i32,
    source_word: String,
    source_description: String,
    translation_word: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    translation_description: Option<String>,
}

fn valid_slug(slug: &str) -> bool {
    !slug.is_empty()
        && slug
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"-_.".contains(&b))
}
fn safe_relative(value: &str) -> bool {
    let path = Path::new(value);
    !path.is_absolute() && path.components().all(|c| matches!(c, Component::Normal(_)))
}
fn read_package_dir(path: &Path, enforce_dir_slug: bool) -> Result<Package, crate::Error> {
    let manifest_path = path.join("package.toml");
    let manifest: toml::Value = toml::from_str(&std::fs::read_to_string(&manifest_path)?)?;
    if manifest.get("format").and_then(toml::Value::as_str) != Some("voco-package")
        || manifest
            .get("format_version")
            .and_then(toml::Value::as_integer)
            != Some(1)
    {
        return Err(crate::Error::InvalidData(format!(
            "Unsupported package format: {}",
            path.display()
        )));
    }
    let slug = manifest
        .get("slug")
        .and_then(toml::Value::as_str)
        .unwrap_or_default();
    if !valid_slug(slug)
        || (enforce_dir_slug && path.file_name().and_then(|v| v.to_str()) != Some(slug))
    {
        return Err(crate::Error::InvalidData(format!(
            "Package slug does not match directory: {}",
            path.display()
        )));
    }
    let files = manifest
        .get("files")
        .ok_or_else(|| crate::Error::InvalidData("Missing files table".into()))?;
    let relative = |key: &str, fallback: &str| -> Result<String, crate::Error> {
        let value = files
            .get(key)
            .and_then(toml::Value::as_str)
            .unwrap_or(fallback)
            .to_string();
        if !safe_relative(&value) {
            return Err(crate::Error::InvalidData(format!(
                "Unsafe package path: {value}"
            )));
        }
        Ok(value)
    };
    let data_path = relative("data", "data.toml")?;
    let images = relative("images", "images")?;
    let mut package: Package = toml::from_str(&std::fs::read_to_string(manifest_path)?)?;
    let mut data: DataFile = toml::from_str(&std::fs::read_to_string(path.join(&data_path))?)?;
    if data.format != "voco-package-data"
        || data.format_version != 1
        || data.package_id != package.id
    {
        return Err(crate::Error::InvalidData(format!(
            "Package data metadata mismatch: {slug}"
        )));
    }
    let sort_method = match data.sort_method.as_str() {
        "" => "shuffle".to_string(),
        "original" | "alphabetical" | "shuffle" => data.sort_method.clone(),
        _ => {
            return Err(crate::Error::InvalidData(format!(
                "Unsupported sort method: {}",
                data.sort_method
            )))
        }
    };
    let mut seen = std::collections::HashSet::new();
    for row in &data.rows {
        if !seen.insert(row.id.clone()) {
            return Err(crate::Error::InvalidData(format!(
                "Duplicate entry id: {}",
                row.id
            )));
        }
    }
    data.rows.sort_by_key(|row| row.runtime_index);
    let mut by_id = BTreeMap::new();
    let image_dir = path.join(&images);
    if image_dir.exists() {
        for item in fs::read_dir(&image_dir)? {
            let item = item?;
            if !item.file_type()?.is_file() {
                continue;
            }
            let p = item.path();
            let ext = p
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("")
                .to_ascii_lowercase();
            let rank = match ext.as_str() {
                "webp" => 0,
                "png" => 1,
                "jpg" => 2,
                "jpeg" => 3,
                "gif" => 4,
                _ => continue,
            };
            let Some(stem) = p.file_stem().and_then(|s| s.to_str()) else {
                continue;
            };
            let rel = format!("{images}/{}", item.file_name().to_string_lossy());
            if by_id
                .get(stem)
                .map(|(r, _): &(usize, String)| rank < *r)
                .unwrap_or(true)
            {
                by_id.insert(stem.to_string(), (rank, rel));
            }
        }
    }
    package.files = PackageFiles {
        data: data_path.clone(),
        images,
    };
    package.sort_method = sort_method;
    package.entries = data
        .rows
        .into_iter()
        .map(|row| {
            let image = by_id.get(&row.id).map(|(_, p)| p.clone());
            VocabEntry {
                id: row.id,
                original_index: row.original_index,
                runtime_index: row.runtime_index,
                source: VocabText {
                    word: row.source_word,
                    description: row.source_description,
                },
                translation: VocabText {
                    word: row.translation_word,
                    description: row.translation_description.unwrap_or_default(),
                },
                image_source: None,
                image_data: None,
                image_name: None,
                image,
            }
        })
        .collect();
    if package
        .tags
        .iter()
        .collect::<std::collections::HashSet<_>>()
        .len()
        != package.tags.len()
    {
        return Err(crate::Error::InvalidData(format!(
            "Duplicate package tag: {slug}"
        )));
    }
    Ok(package)
}

pub fn list(dir: PathBuf) -> Result<Vec<Package>, crate::Error> {
    let mut packages = Vec::new();
    if !dir.exists() {
        return Ok(packages);
    }
    let mut paths = fs::read_dir(dir)?
        .filter_map(Result::ok)
        .filter(|e| e.file_type().map(|t| t.is_dir()).unwrap_or(false))
        .map(|e| e.path())
        .collect::<Vec<_>>();
    paths.sort();
    for path in paths {
        if path.join("package.toml").exists() {
            packages.push(read_package_dir(&path, true)?);
        }
    }
    Ok(packages)
}
pub fn read(dir: PathBuf, slug: &str) -> Result<Package, crate::Error> {
    if !valid_slug(slug) {
        return Err(crate::Error::InvalidData(format!(
            "Invalid package slug: {slug}"
        )));
    }
    read_package_dir(&dir.join(slug), true)
}
pub fn write(dir: PathBuf, package: &Package) -> Result<(), crate::Error> {
    if !valid_slug(&package.slug) {
        return Err(crate::Error::InvalidData(format!(
            "Invalid package slug: {}",
            package.slug
        )));
    }
    fs::create_dir_all(&dir)?;
    let target = dir.join(&package.slug);
    let temporary = dir.join(format!(".tmp-{}", uuid::Uuid::new_v4()));
    fs::create_dir(&temporary)?;
    let result = (|| -> Result<(), crate::Error> {
        fs::create_dir(temporary.join("images"))?;
        for entry in &package.entries {
            if let Some(encoded) = entry.image_data.as_deref() {
                let extension = entry
                    .image_name
                    .as_deref()
                    .and_then(|name| Path::new(name).extension())
                    .and_then(|value| value.to_str())
                    .map(str::to_ascii_lowercase)
                    .unwrap_or_else(|| "png".into());
                if !matches!(
                    extension.as_str(),
                    "webp" | "png" | "jpg" | "jpeg" | "gif" | "bmp"
                ) {
                    return Err(crate::Error::InvalidData(format!(
                        "Unsupported image format: {extension}"
                    )));
                }
                let bytes =
                    base64::Engine::decode(&base64::engine::general_purpose::STANDARD, encoded)
                        .map_err(|error| {
                            crate::Error::InvalidData(format!("Invalid image data: {error}"))
                        })?;
                fs::write(
                    temporary
                        .join("images")
                        .join(format!("{}.{}", entry.id, extension)),
                    bytes,
                )?;
            } else if let Some(source) = entry.image_source.as_deref() {
                let extension = Path::new(source)
                    .extension()
                    .and_then(|value| value.to_str())
                    .map(str::to_ascii_lowercase)
                    .ok_or_else(|| {
                        crate::Error::InvalidData(format!(
                            "Image source has no extension: {source}"
                        ))
                    })?;
                if !matches!(
                    extension.as_str(),
                    "webp" | "png" | "jpg" | "jpeg" | "gif" | "bmp"
                ) {
                    return Err(crate::Error::InvalidData(format!(
                        "Unsupported image format: {source}"
                    )));
                }
                fs::copy(
                    source,
                    temporary
                        .join("images")
                        .join(format!("{}.{}", entry.id, extension)),
                )?;
            }
        }
        let mut manifest_package = package.clone();
        manifest_package.entries.clear();
        let manifest = toml::to_string_pretty(&manifest_package)?;
        crate::fs::write_string(temporary.join("package.toml"), &manifest)?;
        let sort_method = match package.sort_method.as_str() {
            "" => "shuffle".to_string(),
            "original" | "alphabetical" | "shuffle" => package.sort_method.clone(),
            _ => {
                return Err(crate::Error::InvalidData(format!(
                    "Unsupported sort method: {}",
                    package.sort_method
                )))
            }
        };
        let mut rows = Vec::with_capacity(package.entries.len());
        for (index, entry) in package.entries.iter().enumerate() {
            let index = index as i32 + 1;
            rows.push(DataRow {
                id: entry.id.clone(),
                original_index: if entry.original_index > 0 {
                    entry.original_index
                } else {
                    index
                },
                runtime_index: index,
                source_word: entry.source.word.clone(),
                source_description: entry.source.description.clone(),
                translation_word: entry.translation.word.clone(),
                translation_description: if entry.translation.description.is_empty() {
                    None
                } else {
                    Some(entry.translation.description.clone())
                },
            });
        }
        let data = DataFile {
            format: "voco-package-data".into(),
            format_version: 1,
            package_id: package.id.clone(),
            sort_method,
            rows,
        };
        crate::fs::write_string(temporary.join("data.toml"), &toml::to_string_pretty(&data)?)?;
        // Re-parse the generated package before publication.
        read_package_dir(&temporary, false)?;
        if target.exists() {
            let previous = dir.join(format!(".previous-{}", uuid::Uuid::new_v4()));
            fs::rename(&target, &previous)?;
            if let Err(error) = fs::rename(&temporary, &target) {
                let _ = fs::rename(&previous, &target);
                return Err(error.into());
            }
            fs::remove_dir_all(previous)?;
        } else {
            fs::rename(&temporary, &target)?;
        }
        Ok(())
    })();
    if result.is_err() {
        let _ = fs::remove_dir_all(&temporary);
    }
    result
}
pub fn delete(dir: PathBuf, slug: &str) -> Result<(), crate::Error> {
    if !valid_slug(slug) {
        return Err(crate::Error::InvalidData(format!(
            "Invalid package slug: {slug}"
        )));
    }
    let path = dir.join(slug);
    if !path.exists() {
        return Err(crate::Error::NotFound(format!("package {slug}")));
    }
    fs::remove_dir_all(path)?;
    Ok(())
}

pub fn from_legacy(
    version: i32,
    id: String,
    slug: String,
    name: String,
    description: String,
    sort_method: String,
    entries: Vec<VocabEntry>,
    created_at: chrono::DateTime<Utc>,
    updated_at: chrono::DateTime<Utc>,
    tags: Vec<String>,
) -> Package {
    Package {
        format: "voco-package".into(),
        format_version: 1,
        legacy_data_version: Some(version),
        id,
        slug,
        name,
        description,
        source_language: "und".into(),
        target_language: "und".into(),
        sort_order: Default::default(),
        tags,
        files: PackageFiles {
            data: "data.toml".into(),
            images: "images".into(),
        },
        created: PackageCreated {
            at: created_at,
            by: "migration".into(),
        },
        updated: PackageUpdated { at: updated_at },
        sort_method,
        entries,
    }
}
pub fn blank_entry(
    id: String,
    original: String,
    translation: String,
    original_index: i32,
) -> VocabEntry {
    VocabEntry {
        id,
        original_index,
        runtime_index: original_index,
        source: VocabText {
            word: original,
            description: String::new(),
        },
        translation: VocabText {
            word: translation,
            description: String::new(),
        },
        image: None,
        image_source: None,
        image_data: None,
        image_name: None,
    }
}
