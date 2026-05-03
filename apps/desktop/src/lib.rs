use tauri::Manager;
use voco_io::models::{BundleMeta, Package, Preset, Settings};
use voco_io::VocoStore;

#[tauri::command]
async fn read_settings(store: tauri::State<'_, VocoStore>) -> Result<Settings, String> {
    let store = store.inner().clone();
    tauri::async_runtime::spawn_blocking(move || store.read_settings().map_err(|e| e.to_string()))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn write_settings(
    store: tauri::State<'_, VocoStore>,
    settings: Settings,
) -> Result<(), String> {
    let store = store.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        store.write_settings(&settings).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn list_bundles(store: tauri::State<'_, VocoStore>) -> Result<Vec<BundleMeta>, String> {
    let store = store.inner().clone();
    tauri::async_runtime::spawn_blocking(move || store.list_bundles().map_err(|e| e.to_string()))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn read_bundle(
    store: tauri::State<'_, VocoStore>,
    slug: String,
) -> Result<BundleMeta, String> {
    let store = store.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        store.read_bundle(&slug).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn write_bundle(
    store: tauri::State<'_, VocoStore>,
    bundle: BundleMeta,
) -> Result<(), String> {
    let store = store.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        store.write_bundle(&bundle).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn delete_bundle(store: tauri::State<'_, VocoStore>, slug: String) -> Result<(), String> {
    let store = store.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        store.delete_bundle(&slug).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn list_packages(store: tauri::State<'_, VocoStore>) -> Result<Vec<Package>, String> {
    let store = store.inner().clone();
    tauri::async_runtime::spawn_blocking(move || store.list_packages().map_err(|e| e.to_string()))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn read_package(store: tauri::State<'_, VocoStore>, slug: String) -> Result<Package, String> {
    let store = store.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        store.read_package(&slug).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn write_package(store: tauri::State<'_, VocoStore>, package: Package) -> Result<(), String> {
    let store = store.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        store.write_package(&package).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn delete_package(store: tauri::State<'_, VocoStore>, slug: String) -> Result<(), String> {
    let store = store.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        store.delete_package(&slug).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn list_presets(store: tauri::State<'_, VocoStore>) -> Result<Vec<Preset>, String> {
    let store = store.inner().clone();
    tauri::async_runtime::spawn_blocking(move || store.list_presets().map_err(|e| e.to_string()))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn read_preset(store: tauri::State<'_, VocoStore>, id: String) -> Result<Preset, String> {
    let store = store.inner().clone();
    tauri::async_runtime::spawn_blocking(move || store.read_preset(&id).map_err(|e| e.to_string()))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn write_preset(store: tauri::State<'_, VocoStore>, preset: Preset) -> Result<(), String> {
    let store = store.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        store.write_preset(&preset).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn delete_preset(store: tauri::State<'_, VocoStore>, id: String) -> Result<(), String> {
    let store = store.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        store.delete_preset(&id).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[derive(serde::Deserialize)]
struct DialogFilter {
    name: String,
    extensions: Vec<String>,
}

#[tauri::command]
async fn open_file_dialog(
    app: tauri::AppHandle,
    filters: Vec<DialogFilter>,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let mut builder = app.dialog().file();
    for f in filters {
        let exts: Vec<&str> = f.extensions.iter().map(|s| s.as_str()).collect();
        builder = builder.add_filter(&f.name, &exts);
    }
    let file = builder.blocking_pick_file();
    Ok(file.map(|p| p.to_string()))
}

#[tauri::command]
async fn read_file_bytes(path: String) -> Result<Vec<u8>, String> {
    std::fs::read(&path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn open_picker_window(app: tauri::AppHandle) {
    {
        if let Some(win) = app.get_window("picker") {
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let base_path = app.path().app_data_dir()?;
            app.manage(VocoStore::new(base_path));

            #[cfg(desktop)]
            let _ = app
                .handle()
                .plugin(tauri_plugin_updater::Builder::new().build());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            read_settings,
            write_settings,
            list_bundles,
            read_bundle,
            write_bundle,
            delete_bundle,
            list_packages,
            read_package,
            write_package,
            delete_package,
            list_presets,
            read_preset,
            write_preset,
            delete_preset,
            open_file_dialog,
            read_file_bytes,
            open_picker_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
