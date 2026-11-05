use base64::engine::general_purpose::STANDARD;
use base64::Engine;
use quick_xml::events::Event;
use quick_xml::Reader;
use serde::Serialize;
use std::collections::HashMap;
use std::io::{Cursor, Read};
use zip::ZipArchive;

#[derive(Debug, Clone, Serialize)]
pub struct ExtractedImage {
    pub id: String,
    pub name: String,
    pub row: usize,
    pub mime_type: String,
    pub data_base64: String,
}

fn local_name(name: &str) -> &str {
    name.rsplit(':').next().unwrap_or(name)
}

fn attributes(event: &quick_xml::events::BytesStart<'_>) -> HashMap<String, String> {
    event
        .attributes()
        .with_checks(false)
        .filter_map(Result::ok)
        .filter_map(|attribute| {
            let key = String::from(local_name(attribute.key.as_ref()));
            let value = attribute
                .normalized_value(quick_xml::XmlVersion::Implicit1_0)
                .ok()?
                .into_owned();
            Some((key, value))
        })
        .collect()
}

fn relationships(xml: &str) -> Result<HashMap<String, String>, crate::Error> {
    let mut reader = Reader::from_str(xml);
    let mut result = HashMap::new();
    loop {
        match reader.read_event() {
            Ok(Event::Start(event)) | Ok(Event::Empty(event))
                if local_name(event.name().as_ref()) == "Relationship" =>
            {
                let attrs = attributes(&event);
                if let (Some(id), Some(target)) = (attrs.get("Id"), attrs.get("Target")) {
                    result.insert(id.clone(), target.clone());
                }
            }
            Ok(Event::Eof) => break,
            Err(error) => return Err(crate::Error::InvalidData(error.to_string())),
            _ => {}
        }
    }
    Ok(result)
}

fn resolve_target(source: &str, target: &str) -> String {
    let joined = if target.starts_with('/') {
        target.trim_start_matches('/').to_string()
    } else {
        format!(
            "{}/{}",
            source.rsplit_once('/').map(|(dir, _)| dir).unwrap_or(""),
            target
        )
    };
    let mut parts = Vec::new();
    for part in joined.split('/') {
        match part {
            "" | "." => {}
            ".." => {
                parts.pop();
            }
            value => parts.push(value),
        }
    }
    parts.join("/")
}

fn read_zip_text<R: Read + std::io::Seek>(
    archive: &mut ZipArchive<R>,
    path: &str,
) -> Result<String, crate::Error> {
    let mut file = archive
        .by_name(path)
        .map_err(|error| crate::Error::InvalidData(format!("Missing {path}: {error}")))?;
    let mut text = String::new();
    file.read_to_string(&mut text)?;
    Ok(text)
}

fn relationship_path(source: &str) -> String {
    let (directory, filename) = source.rsplit_once('/').unwrap_or(("", source));
    format!("{directory}/_rels/{filename}.rels")
}

pub fn extract_for_sheet(
    bytes: &[u8],
    sheet_name: &str,
    anchor_column: usize,
) -> Result<Vec<ExtractedImage>, crate::Error> {
    let mut archive = ZipArchive::new(Cursor::new(bytes))
        .map_err(|error| crate::Error::InvalidData(format!("Not an XLSX workbook: {error}")))?;
    let workbook = read_zip_text(&mut archive, "xl/workbook.xml")?;
    let workbook_rels = relationships(&read_zip_text(&mut archive, "xl/_rels/workbook.xml.rels")?)?;

    let mut reader = Reader::from_str(&workbook);
    let mut selected_rel = None;
    loop {
        match reader.read_event() {
            Ok(Event::Start(event)) | Ok(Event::Empty(event))
                if local_name(event.name().as_ref()) == "sheet" =>
            {
                let attrs = attributes(&event);
                if attrs.get("name").map(String::as_str) == Some(sheet_name) {
                    selected_rel = attrs.get("id").cloned();
                    break;
                }
            }
            Ok(Event::Eof) => break,
            Err(error) => return Err(crate::Error::InvalidData(error.to_string())),
            _ => {}
        }
    }
    let sheet_target = selected_rel
        .and_then(|id| workbook_rels.get(&id).cloned())
        .ok_or_else(|| crate::Error::InvalidData(format!("Worksheet not found: {sheet_name}")))?;
    let sheet_path = resolve_target("xl/workbook.xml", &sheet_target);
    let sheet_xml = read_zip_text(&mut archive, &sheet_path)?;
    let sheet_rels = relationships(&read_zip_text(
        &mut archive,
        &relationship_path(&sheet_path),
    )?)?;

    let mut reader = Reader::from_str(&sheet_xml);
    let mut drawing_rel = None;
    loop {
        match reader.read_event() {
            Ok(Event::Start(event)) | Ok(Event::Empty(event))
                if local_name(event.name().as_ref()) == "drawing" =>
            {
                drawing_rel = attributes(&event).get("id").cloned();
                break;
            }
            Ok(Event::Eof) => break,
            Err(error) => return Err(crate::Error::InvalidData(error.to_string())),
            _ => {}
        }
    }
    let Some(drawing_rel) = drawing_rel else {
        return Ok(Vec::new());
    };
    let drawing_target = sheet_rels.get(&drawing_rel).ok_or_else(|| {
        crate::Error::InvalidData("Worksheet drawing relationship is missing".into())
    })?;
    let drawing_path = resolve_target(&sheet_path, drawing_target);
    let drawing_rels = relationships(&read_zip_text(
        &mut archive,
        &relationship_path(&drawing_path),
    )?)?;
    let drawing_xml = read_zip_text(&mut archive, &drawing_path)?;

    let mut reader = Reader::from_str(&drawing_xml);
    let mut in_anchor = false;
    let mut in_from = false;
    let mut in_row = false;
    let mut in_col = false;
    let mut row = None;
    let mut col = None;
    let mut image_rel = None;
    let mut anchors = Vec::new();
    loop {
        match reader.read_event() {
            Ok(Event::Start(event)) => match local_name(event.name().as_ref()) {
                "oneCellAnchor" | "twoCellAnchor" => {
                    in_anchor = true;
                    row = None;
                    col = None;
                    image_rel = None;
                }
                "from" if in_anchor => in_from = true,
                "row" if in_from => in_row = true,
                "col" if in_from => in_col = true,
                "blip" if in_anchor => image_rel = attributes(&event).get("embed").cloned(),
                _ => {}
            },
            Ok(Event::Empty(event)) if local_name(event.name().as_ref()) == "blip" && in_anchor => {
                image_rel = attributes(&event).get("embed").cloned();
            }
            Ok(Event::Text(text)) if in_row => {
                row = text
                    .as_ref()
                    .parse::<usize>()
                    .ok()
                    .map(|zero_based| zero_based + 1);
            }
            Ok(Event::Text(text)) if in_col => {
                col = text.as_ref().parse::<usize>().ok();
            }
            Ok(Event::End(event)) => match local_name(event.name().as_ref()) {
                "row" => in_row = false,
                "col" => in_col = false,
                "from" => in_from = false,
                "oneCellAnchor" | "twoCellAnchor" => {
                    if let (Some(row), Some(col), Some(rel)) = (row, col, image_rel.take()) {
                        if col == anchor_column {
                            if let Some(target) = drawing_rels.get(&rel) {
                                anchors.push((row, col, resolve_target(&drawing_path, target)));
                            }
                        }
                    }
                    in_anchor = false;
                }
                _ => {}
            },
            Ok(Event::Eof) => break,
            Err(error) => return Err(crate::Error::InvalidData(error.to_string())),
            _ => {}
        }
    }

    let mut images = Vec::with_capacity(anchors.len());
    for (index, (row, _col, path)) in anchors.into_iter().enumerate() {
        let extension = path
            .rsplit_once('.')
            .map(|(_, ext)| ext.to_ascii_lowercase())
            .unwrap_or_default();
        let mime_type = match extension.as_str() {
            "png" => "image/png",
            "jpg" | "jpeg" => "image/jpeg",
            "gif" => "image/gif",
            "webp" => "image/webp",
            "bmp" => "image/bmp",
            _ => continue,
        };
        let mut media = archive
            .by_name(&path)
            .map_err(|error| crate::Error::InvalidData(format!("Missing image {path}: {error}")))?;
        let mut data = Vec::new();
        media.read_to_end(&mut data)?;
        let name = path.rsplit('/').next().unwrap_or(&path).to_string();
        images.push(ExtractedImage {
            id: format!("excel-{row}-{index}"),
            name,
            row,
            mime_type: mime_type.into(),
            data_base64: STANDARD.encode(data),
        });
    }
    Ok(images)
}

#[cfg(test)]
mod sample_validation {
    #[test]
    fn extracts_accessim_images_at_their_anchor_rows() {
        let path =
            std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../temp/accessim.xlsx");
        if !path.exists() {
            return;
        }
        let bytes = std::fs::read(path).unwrap();
        let images = super::extract_for_sheet(&bytes, "总表 A-Z", 4).unwrap();
        assert_eq!(images.len(), 431);
        assert_eq!(images.first().unwrap().row, 4);
        assert_eq!(images.last().unwrap().row, 434);
    }
}
