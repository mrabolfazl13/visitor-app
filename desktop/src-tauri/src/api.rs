use std::time::Duration;

use reqwest::header::{HeaderName, HeaderValue};
use serde::{Deserialize, Serialize};
use tauri::State;

const DEFAULT_TIMEOUT_MS: u64 = 15_000;
const MAX_TIMEOUT_MS: u64 = 60_000;

#[derive(Debug, Deserialize)]
pub struct ApiRequest {
    pub method: String,
    pub url: String,
    #[serde(default)]
    pub headers: Vec<(String, String)>,
    #[serde(default)]
    pub body: Option<String>,
    #[serde(default)]
    pub timeout_ms: Option<u64>,
}

#[derive(Debug, Serialize)]
pub struct ApiResponse {
    pub status: u16,
    pub body: String,
}

pub struct ApiClient(pub reqwest::Client);

fn http_method(name: &str) -> Option<reqwest::Method> {
    match name.to_ascii_uppercase().as_str() {
        "GET" => Some(reqwest::Method::GET),
        "POST" => Some(reqwest::Method::POST),
        "PUT" => Some(reqwest::Method::PUT),
        "PATCH" => Some(reqwest::Method::PATCH),
        "DELETE" => Some(reqwest::Method::DELETE),
        _ => None,
    }
}

/// Proxies HTTP through Rust so the webview never depends on server CORS config.
#[tauri::command]
pub async fn api_request(client: State<'_, ApiClient>, req: ApiRequest) -> Result<ApiResponse, String> {
    let method = http_method(&req.method).ok_or_else(|| format!("Unsupported HTTP method: {}", req.method))?;

    let parsed = reqwest::Url::parse(&req.url).map_err(|e| format!("Invalid URL {}: {}", req.url, e))?;
    if !matches!(parsed.scheme(), "http" | "https") {
        return Err(format!("Unsupported URL scheme: {}", parsed.scheme()));
    }

    let timeout = Duration::from_millis(req.timeout_ms.unwrap_or(DEFAULT_TIMEOUT_MS).min(MAX_TIMEOUT_MS));

    let mut builder = client.0.request(method, parsed).timeout(timeout);
    for (name, value) in &req.headers {
        let header_name = HeaderName::from_bytes(name.as_bytes()).map_err(|e| e.to_string())?;
        let header_value = HeaderValue::from_str(value).map_err(|e| e.to_string())?;
        builder = builder.header(header_name, header_value);
    }
    if let Some(body) = req.body {
        builder = builder.body(body);
    }

    let response = builder.send().await.map_err(|e| format!("Request failed: {}", e))?;
    let status = response.status().as_u16();
    let body = response.text().await.map_err(|e| format!("Failed to read response: {}", e))?;

    Ok(ApiResponse { status, body })
}
