use crate::fs;
use crate::models::BundleMeta;
use std::path::PathBuf;

pub fn list(dir: PathBuf) -> Result<Vec<BundleMeta>, crate::Error> {
    let names = fs::list_files(&dir)?;
    let mut bundles = vec![];
    for name in names {
        let path = dir.join(&name);
        let content = fs::read_string(&path)?;
        let bundle: BundleMeta = serde_yaml::from_str(&content)?;
        bundles.push(bundle);
    }
    Ok(bundles)
}

pub fn read(dir: PathBuf, slug: &str) -> Result<BundleMeta, crate::Error> {
    let path = dir.join(format!("{}.yml", slug));
    let content = fs::read_string(&path)?;
    let bundle: BundleMeta = serde_yaml::from_str(&content)?;
    Ok(bundle)
}

pub fn write(dir: PathBuf, bundle: &BundleMeta) -> Result<(), crate::Error> {
    let path = dir.join(format!("{}.yml", bundle.slug));
    let content = serde_yaml::to_string(bundle)?;
    fs::write_string(path, &content)?;
    Ok(())
}

pub fn delete(dir: PathBuf, slug: &str) -> Result<(), crate::Error> {
    let path = dir.join(format!("{}.yml", slug));
    fs::remove_file(&path)?;
    Ok(())
}
