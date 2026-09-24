pub mod fs;
pub mod models;
pub mod repos;

use models::{Package, Preset, Settings};
use sha2::{Digest, Sha256};
use std::path::PathBuf;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("YAML error: {0}")]
    Yaml(#[from] serde_yaml::Error),
    #[error("TOML error: {0}")]
    Toml(#[from] toml::de::Error),
    #[error("TOML encode error: {0}")]
    TomlEncode(#[from] toml::ser::Error),
    #[error("Invalid data: {0}")]
    InvalidData(String),
    #[error("Not found: {0}")]
    NotFound(String),
}

#[derive(Debug, Clone)]
pub struct VocoStore {
    base_path: PathBuf,
    migration_error: Option<String>,
}

impl VocoStore {
    pub fn new(base_path: PathBuf) -> Self {
        let candidate = Self {
            base_path,
            migration_error: None,
        };
        match candidate.migrate_legacy() {
            Ok(()) => candidate,
            Err(error) => Self {
                migration_error: Some(error.to_string()),
                ..candidate
            },
        }
    }

    fn ensure_ready(&self) -> Result<(), Error> {
        match &self.migration_error {
            Some(error) => Err(Error::InvalidData(format!("迁移错误: {error}"))),
            None => Ok(()),
        }
    }

    fn settings_path(&self) -> PathBuf {
        self.base_path.join("settings.toml")
    }

    fn packages_dir(&self) -> PathBuf {
        self.base_path.join("packages")
    }

    fn presets_path(&self) -> PathBuf {
        self.base_path.join("picker").join("presets.toml")
    }

    fn migrate_legacy(&self) -> Result<(), Error> {
        use std::collections::BTreeMap;
        use std::fs;
        use std::io::Read;
        if self.settings_path().exists() || !self.base_path.join("settings.yml").exists() {
            return Ok(());
        }
        let started = chrono::Utc::now();
        let stamp = started.format("%Y%m%dT%H%M%S%.fZ").to_string();
        let backup_root = self
            .base_path
            .join("backups/migration-data-format")
            .join(stamp);
        fs::create_dir_all(&backup_root)?;
        let mut records = Vec::new();
        fn copy_tree(
            src: &std::path::Path,
            dst: &std::path::Path,
            source_root: &std::path::Path,
            records: &mut Vec<(String, u64, String)>,
        ) -> Result<(), Error> {
            if !src.exists() {
                return Ok(());
            }
            fs::create_dir_all(dst)?;
            for entry in fs::read_dir(src)? {
                let entry = entry?;
                let path = entry.path();
                let name = entry.file_name();
                let name = name.to_string_lossy();
                if name == "backups" || name.starts_with('.') {
                    continue;
                }
                let target = dst.join(entry.file_name());
                if entry.file_type()?.is_dir() {
                    copy_tree(&path, &target, source_root, records)?;
                } else if entry.file_type()?.is_file() {
                    fs::copy(&path, &target)?;
                    let mut f = fs::File::open(&target)?;
                    let mut bytes = Vec::new();
                    f.read_to_end(&mut bytes)?;
                    records.push((
                        path.strip_prefix(source_root)
                            .unwrap_or(&path)
                            .to_string_lossy()
                            .into_owned(),
                        bytes.len() as u64,
                        format!("{:x}", Sha256::digest(&bytes)),
                    ));
                }
            }
            Ok(())
        }
        // Preserve the original relative tree in the snapshot.
        copy_tree(&self.base_path, &backup_root, &self.base_path, &mut records)
            .map_err(|e| Error::InvalidData(format!("迁移错误：备份阶段失败: {e}")))?;
        for (rel, len, hash) in &records {
            let p = backup_root.join(rel);
            if !p.exists() || fs::metadata(&p)?.len() != *len {
                return Err(Error::InvalidData(format!("迁移错误：备份校验失败: {rel}")));
            }
            let mut f = fs::File::open(p)?;
            let mut bytes = Vec::new();
            f.read_to_end(&mut bytes)?;
            let actual = format!("{:x}", Sha256::digest(&bytes));
            if &actual != hash {
                return Err(Error::InvalidData(format!("迁移错误：备份校验失败: {rel}")));
            }
        }
        #[derive(serde::Serialize)]
        struct SnapshotFile<'a> {
            path: &'a str,
            size: u64,
            checksum: &'a str,
        }
        #[derive(serde::Serialize)]
        struct Manifest<'a> {
            version: i32,
            source_root: String,
            files: Vec<SnapshotFile<'a>>,
        }
        let files = records
            .iter()
            .map(|(p, s, h)| SnapshotFile {
                path: p,
                size: *s,
                checksum: h,
            })
            .collect();
        fs::write(
            backup_root.join("manifest.toml"),
            toml::to_string_pretty(&Manifest {
                version: 1,
                source_root: self.base_path.to_string_lossy().into_owned(),
                files,
            })?,
        )?;
        let settings_text = fs::read_to_string(self.base_path.join("settings.yml"))?;
        let old_settings: serde_yaml::Value = serde_yaml::from_str(&settings_text)?;
        let language = old_settings
            .get("language")
            .and_then(|v| v.as_str())
            .unwrap_or("en-GB")
            .to_string();
        let mut settings = Settings {
            language,
            ..Settings::default()
        };
        let bundles_dir = self.base_path.join("packages/bundles");
        let mut bundles: BTreeMap<String, serde_yaml::Value> = BTreeMap::new();
        if bundles_dir.exists() {
            for file in fs::read_dir(&bundles_dir)? {
                let file = file?;
                if file.path().extension().and_then(|x| x.to_str()) == Some("yml") {
                    let v: serde_yaml::Value =
                        serde_yaml::from_str(&fs::read_to_string(file.path())?)?;
                    let slug = v
                        .get("slug")
                        .and_then(|x| x.as_str())
                        .unwrap_or("")
                        .to_string();
                    if !slug.is_empty() {
                        bundles.insert(slug, v);
                    }
                }
            }
        }
        let mut relation: BTreeMap<String, Vec<(String, i32)>> = BTreeMap::new();
        for (slug, b) in &bundles {
            let name = b
                .get("name")
                .and_then(|v| v.as_str())
                .unwrap_or(slug)
                .to_string();
            settings.tags.insert(
                slug.clone(),
                models::TagDefinition {
                    name,
                    color: None,
                    order: (settings.tags.len() as i32 + 1) * 10,
                },
            );
            if let Some(arr) = b.get("package_slugs").and_then(|v| v.as_sequence()) {
                for (i, p) in arr.iter().enumerate() {
                    if let Some(p) = p.as_str() {
                        relation
                            .entry(p.into())
                            .or_default()
                            .push((slug.clone(), (i as i32 + 1) * 10));
                    }
                }
            }
        }
        let source_dir = self.base_path.join("packages/source");
        let target_dir = self.packages_dir();
        fs::create_dir_all(&target_dir)?;
        if source_dir.exists() {
            for file in fs::read_dir(&source_dir)? {
                let file = file?;
                if file.path().extension().and_then(|x| x.to_str()) != Some("yml") {
                    continue;
                }
                let old: serde_yaml::Value =
                    serde_yaml::from_str(&fs::read_to_string(file.path())?)?;
                let getstr = |key: &str| {
                    old.get(key)
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string()
                };
                let slug = getstr("slug");
                let id = if getstr("id").is_empty() {
                    uuid::Uuid::new_v4().to_string()
                } else {
                    getstr("id")
                };
                let relations = relation.remove(&slug).unwrap_or_default();
                let mut tags = relations
                    .iter()
                    .map(|(tag, _)| tag.clone())
                    .collect::<Vec<_>>();
                let legacy_tag = getstr("bundle_slug");
                if !legacy_tag.is_empty() && !tags.contains(&legacy_tag) {
                    tags.push(legacy_tag.clone());
                }
                let mut sort_order = relations.into_iter().collect::<BTreeMap<_, _>>();
                if !legacy_tag.is_empty() {
                    sort_order.entry(legacy_tag).or_insert(10);
                }
                let mut entries = Vec::new();
                if let Some(arr) = old.get("entries").and_then(|v| v.as_sequence()) {
                    for e in arr {
                        let eid = e
                            .get("id")
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string();
                        let original = e
                            .get("original")
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string();
                        let translation = e
                            .get("translation")
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string();
                        entries.push(repos::package_repo::blank_entry(eid, original, translation));
                    }
                }
                let now = chrono::Utc::now();
                let parse_date = |v: serde_yaml::Value| {
                    v.as_str()
                        .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
                        .map(|d| d.with_timezone(&chrono::Utc))
                        .unwrap_or(now)
                };
                let created = parse_date(old.get("created_at").cloned().unwrap_or_default());
                let updated = parse_date(old.get("updated_at").cloned().unwrap_or_default());
                let mut p = repos::package_repo::from_legacy(
                    old.get("version").and_then(|v| v.as_i64()).unwrap_or(1) as i32,
                    id,
                    slug,
                    getstr("name"),
                    getstr("description"),
                    getstr("sort_method"),
                    entries,
                    created,
                    updated,
                    tags,
                );
                p.sort_order = sort_order;
                if target_dir.join(&p.slug).exists() {
                    return Err(Error::InvalidData(format!(
                        "Package target conflict: {}",
                        p.slug
                    )));
                }
                repos::package_repo::write(target_dir.clone(), &p)?;
            }
        }
        self.write_settings(&settings)?;
        let old_presets = self.base_path.join("picker/presets.yml");
        if old_presets.exists() {
            let value: serde_yaml::Value = serde_yaml::from_str(&fs::read_to_string(old_presets)?)?;
            let presets: models::picker::PresetsFile = serde_yaml::from_value(value)?;
            fs::create_dir_all(self.base_path.join("picker"))?;
            fs::write(self.presets_path(), toml::to_string_pretty(&presets)?)?;
        }
        #[derive(serde::Serialize)]
        struct Report {
            migration: &'static str,
            version: i32,
            started_at: chrono::DateTime<chrono::Utc>,
            completed_at: chrono::DateTime<chrono::Utc>,
            packages_total: usize,
            packages_migrated: usize,
            entries_total: usize,
        }
        let migrated = self.list_packages()?;
        let report = Report {
            migration: "legacy-to-voco-package-toml",
            version: 1,
            started_at: started,
            completed_at: chrono::Utc::now(),
            packages_total: migrated.len(),
            packages_migrated: migrated.len(),
            entries_total: migrated.iter().map(|p| p.entries.len()).sum(),
        };
        let report_path = self.base_path.join("packages/migration-report.toml");
        fs::write(&report_path, toml::to_string_pretty(&report)?)?;

        // The verified backup remains the rollback source after legacy files are removed.
        let remove_legacy_files = |dir: &std::path::Path| -> Result<(), Error> {
            if !dir.exists() {
                return Ok(());
            }
            for entry in fs::read_dir(dir)? {
                let entry = entry?;
                if entry.file_type()?.is_file()
                    && entry.path().extension().and_then(|v| v.to_str()) == Some("yml")
                {
                    fs::remove_file(entry.path())?;
                }
            }
            if fs::read_dir(dir)?.next().is_none() {
                fs::remove_dir(dir)?;
            }
            Ok(())
        };
        fs::remove_file(self.base_path.join("settings.yml"))?;
        remove_legacy_files(&self.base_path.join("packages/bundles"))?;
        remove_legacy_files(&self.base_path.join("packages/source"))?;
        let old_presets = self.base_path.join("picker/presets.yml");
        if old_presets.exists() {
            fs::remove_file(old_presets)?;
        }
        Ok(())
    }

    // Settings
    pub fn read_settings(&self) -> Result<Settings, Error> {
        self.ensure_ready()?;
        repos::settings_repo::read(self.settings_path())
    }

    pub fn write_settings(&self, s: &Settings) -> Result<(), Error> {
        self.ensure_ready()?;
        repos::settings_repo::write(self.settings_path(), s)
    }

    // Packages
    pub fn list_packages(&self) -> Result<Vec<Package>, Error> {
        self.ensure_ready()?;
        repos::package_repo::list(self.packages_dir())
    }

    pub fn read_package(&self, slug: &str) -> Result<Package, Error> {
        self.ensure_ready()?;
        repos::package_repo::read(self.packages_dir(), slug)
    }

    pub fn write_package(&self, p: &Package) -> Result<(), Error> {
        self.ensure_ready()?;
        repos::package_repo::write(self.packages_dir(), p)
    }

    pub fn delete_package(&self, slug: &str) -> Result<(), Error> {
        self.ensure_ready()?;
        repos::package_repo::delete(self.packages_dir(), slug)
    }

    // Presets
    pub fn list_presets(&self) -> Result<Vec<Preset>, Error> {
        self.ensure_ready()?;
        repos::picker_repo::list(self.presets_path())
    }

    pub fn read_preset(&self, id: &str) -> Result<Preset, Error> {
        self.ensure_ready()?;
        repos::picker_repo::read(self.presets_path(), id)
    }

    pub fn write_preset(&self, p: &Preset) -> Result<(), Error> {
        self.ensure_ready()?;
        repos::picker_repo::write(self.presets_path(), p)
    }

    pub fn delete_preset(&self, id: &str) -> Result<(), Error> {
        self.ensure_ready()?;
        repos::picker_repo::delete(self.presets_path(), id)
    }
}

#[cfg(test)]
mod tests {
    use super::VocoStore;
    use std::fs;
    use std::path::PathBuf;

    fn temp_data_dir() -> PathBuf {
        std::env::temp_dir().join(format!("voco-io-migration-{}", uuid::Uuid::new_v4()))
    }

    #[test]
    fn migration_validates_picker_backup_using_source_relative_path() {
        let base = temp_data_dir();
        fs::create_dir_all(base.join("picker")).unwrap();
        fs::write(base.join("settings.yml"), "language: zh-CN\n").unwrap();
        fs::write(
            base.join("picker/presets.yml"),
            "version: 1\npresets:\n  - id: preset-1\n    name: Students\n    items:\n      - label: Alice\n        picks_per_reset: 1\n    created_at: 2025-04-01T10:00:00Z\n    updated_at: 2025-04-01T10:00:00Z\n",
        )
        .unwrap();

        let store = VocoStore::new(base.clone());
        let presets = store.list_presets().unwrap();
        assert_eq!(presets.len(), 1);
        assert_eq!(presets[0].id, "preset-1");

        let backup_root = fs::read_dir(base.join("backups/migration-data-format"))
            .unwrap()
            .next()
            .unwrap()
            .unwrap()
            .path();
        assert!(backup_root.join("picker/presets.yml").is_file());
        let manifest: toml::Value =
            toml::from_str(&fs::read_to_string(backup_root.join("manifest.toml")).unwrap())
                .unwrap();
        let files = manifest.get("files").unwrap().as_array().unwrap();
        assert!(files.iter().any(|file| {
            file.get("path").and_then(toml::Value::as_str) == Some("picker/presets.yml")
        }));

        assert!(!base.join("settings.yml").exists());
        assert!(!base.join("picker/presets.yml").exists());
        assert!(backup_root.join("settings.yml").is_file());

        fs::remove_dir_all(base).unwrap();
    }
}
