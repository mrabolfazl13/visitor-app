use std::path::PathBuf;
use std::sync::Mutex;

use rusqlite::{params, Connection};
use tauri::State;

pub struct KvStore {
    conn: Mutex<Connection>,
}

impl KvStore {
    pub fn new(path: PathBuf) -> Result<Self, String> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| format!("Cannot create data directory: {}", e))?;
        }
        let conn = Connection::open(&path).map_err(|e| format!("Cannot open local database: {}", e))?;
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS kv (
                key        TEXT PRIMARY KEY,
                value      TEXT NOT NULL,
                updated_at INTEGER NOT NULL
            );",
        )
        .map_err(|e| format!("Cannot migrate local database: {}", e))?;
        Ok(Self { conn: Mutex::new(conn) })
    }
}

#[tauri::command]
pub fn kv_set(store: State<'_, KvStore>, key: String, value: String) -> Result<(), String> {
    let conn = store.conn.lock().map_err(|_| "Local store is unavailable".to_string())?;
    conn.execute(
        "INSERT INTO kv (key, value, updated_at) VALUES (?1, ?2, strftime('%s','now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        params![key, value],
    )
    .map_err(|e| format!("Cannot store {}: {}", key, e))?;
    Ok(())
}

#[tauri::command]
pub fn kv_get(store: State<'_, KvStore>, key: String) -> Result<Option<String>, String> {
    let conn = store.conn.lock().map_err(|_| "Local store is unavailable".to_string())?;
    let mut stmt = conn
        .prepare("SELECT value FROM kv WHERE key = ?1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query(params![key]).map_err(|e| e.to_string())?;
    match rows.next().map_err(|e| e.to_string())? {
        Some(row) => row.get::<_, String>(0).map(Some).map_err(|e| e.to_string()),
        None => Ok(None),
    }
}

#[tauri::command]
pub fn kv_del(store: State<'_, KvStore>, key: String) -> Result<(), String> {
    let conn = store.conn.lock().map_err(|_| "Local store is unavailable".to_string())?;
    conn.execute("DELETE FROM kv WHERE key = ?1", params![key])
        .map_err(|e| format!("Cannot remove {}: {}", key, e))?;
    Ok(())
}
