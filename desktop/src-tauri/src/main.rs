// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod api;
mod store;

use std::time::Duration;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let client = reqwest::Client::builder()
                .connect_timeout(Duration::from_secs(10))
                .user_agent("b2b-sales-desktop/1.0.0")
                .build()?;
            app.manage(api::ApiClient(client));

            let data_dir = app.path().app_data_dir()?;
            app.manage(store::KvStore::new(data_dir.join("desktop-state.db"))?);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            api::api_request,
            store::kv_set,
            store::kv_get,
            store::kv_del
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
