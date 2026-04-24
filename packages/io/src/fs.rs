use std::fs;
use std::io::{self, Write};
use std::path::Path;

pub fn read_string<P: AsRef<Path>>(path: P) -> io::Result<String> {
    fs::read_to_string(path)
}

pub fn write_string<P: AsRef<Path>>(path: P, content: &str) -> io::Result<()> {
    if let Some(parent) = path.as_ref().parent() {
        fs::create_dir_all(parent)?;
    }
    let mut file = fs::File::create(path)?;
    file.write_all(content.as_bytes())?;
    Ok(())
}

pub fn remove_file<P: AsRef<Path>>(path: P) -> io::Result<()> {
    fs::remove_file(path)
}

pub fn list_files<P: AsRef<Path>>(dir: P) -> io::Result<Vec<String>> {
    let mut names = vec![];
    if dir.as_ref().exists() {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            if entry.file_type()?.is_file() {
                if let Some(name) = entry.file_name().to_str() {
                    names.push(name.to_string());
                }
            }
        }
    }
    names.sort();
    Ok(names)
}
