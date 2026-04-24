use crate::fs;
use crate::models::Package;
use std::path::PathBuf;

pub fn list(dir: PathBuf) -> Result<Vec<Package>, crate::Error> {
    let names = fs::list_files(&dir)?;
    let mut packages = vec![];
    for name in names {
        let path = dir.join(&name);
        let content = fs::read_string(&path)?;
        let package: Package = serde_yaml::from_str(&content)?;
        packages.push(package);
    }
    Ok(packages)
}

pub fn read(dir: PathBuf, slug: &str) -> Result<Package, crate::Error> {
    let path = dir.join(format!("{}.yml", slug));
    let content = fs::read_string(&path)?;
    let package: Package = serde_yaml::from_str(&content)?;
    Ok(package)
}

pub fn write(dir: PathBuf, package: &Package) -> Result<(), crate::Error> {
    let path = dir.join(format!("{}.yml", package.slug));
    let content = serde_yaml::to_string(package)?;
    fs::write_string(path, &content)?;
    Ok(())
}

pub fn delete(dir: PathBuf, slug: &str) -> Result<(), crate::Error> {
    let path = dir.join(format!("{}.yml", slug));
    fs::remove_file(&path)?;
    Ok(())
}
