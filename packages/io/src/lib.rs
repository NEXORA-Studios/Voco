pub mod fs;
pub mod models;
pub mod repos;

use models::{BundleMeta, Package, Preset, Settings};
use std::path::PathBuf;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("YAML error: {0}")]
    Yaml(#[from] serde_yaml::Error),
    #[error("Not found: {0}")]
    NotFound(String),
}

#[derive(Debug, Clone)]
pub struct VocoStore {
    base_path: PathBuf,
}

impl VocoStore {
    pub fn new(base_path: PathBuf) -> Self {
        Self { base_path }
    }

    fn settings_path(&self) -> PathBuf {
        self.base_path.join("settings.yml")
    }

    fn bundles_dir(&self) -> PathBuf {
        self.base_path.join("packages").join("bundles")
    }

    fn packages_dir(&self) -> PathBuf {
        self.base_path.join("packages").join("source")
    }

    fn presets_path(&self) -> PathBuf {
        self.base_path.join("picker").join("presets.yml")
    }

    // Settings
    pub fn read_settings(&self) -> Result<Settings, Error> {
        repos::settings_repo::read(self.settings_path())
    }

    pub fn write_settings(&self, s: &Settings) -> Result<(), Error> {
        repos::settings_repo::write(self.settings_path(), s)
    }

    // Bundles
    pub fn list_bundles(&self) -> Result<Vec<BundleMeta>, Error> {
        repos::bundle_repo::list(self.bundles_dir())
    }

    pub fn read_bundle(&self, slug: &str) -> Result<BundleMeta, Error> {
        repos::bundle_repo::read(self.bundles_dir(), slug)
    }

    pub fn write_bundle(&self, b: &BundleMeta) -> Result<(), Error> {
        repos::bundle_repo::write(self.bundles_dir(), b)
    }

    pub fn delete_bundle(&self, slug: &str) -> Result<(), Error> {
        repos::bundle_repo::delete(self.bundles_dir(), slug)
    }

    // Packages
    pub fn list_packages(&self) -> Result<Vec<Package>, Error> {
        repos::package_repo::list(self.packages_dir())
    }

    pub fn read_package(&self, slug: &str) -> Result<Package, Error> {
        repos::package_repo::read(self.packages_dir(), slug)
    }

    pub fn write_package(&self, p: &Package) -> Result<(), Error> {
        repos::package_repo::write(self.packages_dir(), p)
    }

    pub fn delete_package(&self, slug: &str) -> Result<(), Error> {
        repos::package_repo::delete(self.packages_dir(), slug)
    }

    // Presets
    pub fn list_presets(&self) -> Result<Vec<Preset>, Error> {
        repos::picker_repo::list(self.presets_path())
    }

    pub fn read_preset(&self, id: &str) -> Result<Preset, Error> {
        repos::picker_repo::read(self.presets_path(), id)
    }

    pub fn write_preset(&self, p: &Preset) -> Result<(), Error> {
        repos::picker_repo::write(self.presets_path(), p)
    }

    pub fn delete_preset(&self, id: &str) -> Result<(), Error> {
        repos::picker_repo::delete(self.presets_path(), id)
    }
}
