use rlsx::parse_xlsx_to_json;
use std::path::Path;

#[tauri::command]
pub async fn load_xlsx(path: &str) -> Result<String, String> {
    let xlsx_path = Path::new(path);

    match parse_xlsx_to_json(xlsx_path) {
        Ok(json) => {
            return Ok(json);
        }
        Err(e) => {
            return Err(format!("Error parsing XLSX file: {}", e));
        }
    }
}

use tauri::Manager;

#[tauri::command]
pub async fn open_select_window(app: tauri::AppHandle) {
    {
        if let Some(win) = app.get_window("select") {
            let _ = win.set_focus();
            return;
        }

        let _webview_window = tauri::WebviewWindowBuilder::from_config(
            &app,
            &app.config().app.windows.get(1).unwrap(),
        )
        .unwrap()
        .build()
        .unwrap();
    }
}

#[tauri::command]
pub async fn close_select_window(app: tauri::AppHandle) {
    if let Some(win) = app.get_window("select") {
        let _ = win.close();
    }
    if let Some(win) = app.get_window("main") {
        let _ = win.set_focus();
    }
}

use serde_json::Value;
use tauri::{AppHandle, Emitter};

#[tauri::command]
pub async fn multi_window_bridge_send(
    app: AppHandle,
    payload: Option<Value>,
) -> Result<(), String> {
    // Early exit if payload is missing
    let Some(payload) = payload else {
        return Err("Missing payload".into());
    };

    // Try extracting required fields from the JSON payload
    let target = payload
        .get("target")
        .and_then(|v| v.as_str())
        .ok_or("Missing 'target' in payload")?;
    let event = payload
        .get("event")
        .and_then(|v| v.as_str())
        .ok_or("Missing 'event' in payload")?;
    let event_payload = payload.get("payload").cloned().unwrap_or(Value::Null);

    println!(
        "[Bridge] target='{}', event='{}', payload={:?}",
        target, event, event_payload
    );

    // Handle special case: broadcast to all windows
    if target == "announce" {
        app.emit(event, event_payload)
            .map_err(|e| format!("Emit failed: {}", e))?;
        println!("[Bridge] Broadcasted '{}' to all windows", event);
    } else {
        // Emit only to the target window
        app.emit_to(target, event, event_payload)
            .map_err(|e| format!("Emit_to failed: {}", e))?;
        println!("[Bridge] Sent '{}' to window '{}'", event, target);
    }

    Ok(())
}
