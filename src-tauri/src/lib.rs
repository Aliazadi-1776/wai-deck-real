use futures::future::join_all;
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::time::Instant;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIConnection {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub ai_type: String,
    pub provider: String,
    pub base_url: String,
    pub model: String,
    pub purpose: String,
    pub system_instructions: String,
    pub status: String,
    pub api_key: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChallengeOutput {
    pub id: String,
    pub ai_id: String,
    pub ai_name: String,
    pub status: String,
    pub output: String,
    pub latency_ms: u64,
}

fn clean_base_url(base_url: &str) -> String {
    base_url.trim().trim_end_matches('/').to_string()
}

fn bearer_headers(ai: &AIConnection) -> Result<HeaderMap, String> {
    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

    if let Some(api_key) = ai.api_key.as_ref().filter(|value| !value.trim().is_empty()) {
        let value = format!("Bearer {}", api_key.trim());
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&value).map_err(|error| format!("Invalid API key header: {error}"))?,
        );
    }

    Ok(headers)
}

fn require_api_key(ai: &AIConnection) -> Result<String, String> {
    ai.api_key
        .as_ref()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .ok_or_else(|| format!("{} requires an API key.", ai.name))
}

async fn send_ollama_message(client: &reqwest::Client, ai: &AIConnection, prompt: &str) -> Result<String, String> {
    let url = format!("{}/api/chat", clean_base_url(&ai.base_url));
    let body = json!({
        "model": ai.model,
        "stream": false,
        "messages": [
            { "role": "system", "content": ai.system_instructions },
            { "role": "user", "content": prompt }
        ]
    });

    let response = client
        .post(url)
        .json(&body)
        .send()
        .await
        .map_err(|error| format!("Could not reach Ollama: {error}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Ollama request failed ({status}): {text}"));
    }

    let value: Value = response.json().await.map_err(|error| format!("Invalid Ollama response: {error}"))?;
    value
        .get("message")
        .and_then(|message| message.get("content"))
        .and_then(Value::as_str)
        .map(ToString::to_string)
        .ok_or_else(|| format!("Ollama response did not include message.content: {value}"))
}

async fn send_openai_compatible_message(client: &reqwest::Client, ai: &AIConnection, prompt: &str) -> Result<String, String> {
    let url = format!("{}/chat/completions", clean_base_url(&ai.base_url));
    let body = json!({
        "model": ai.model,
        "messages": [
            { "role": "system", "content": ai.system_instructions },
            { "role": "user", "content": prompt }
        ],
        "temperature": 0.7
    });

    let response = client
        .post(url)
        .headers(bearer_headers(ai)?)
        .json(&body)
        .send()
        .await
        .map_err(|error| format!("Could not reach OpenAI-compatible provider: {error}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Provider request failed ({status}): {text}"));
    }

    let value: Value = response.json().await.map_err(|error| format!("Invalid provider response: {error}"))?;
    value
        .get("choices")
        .and_then(Value::as_array)
        .and_then(|choices| choices.first())
        .and_then(|choice| choice.get("message"))
        .and_then(|message| message.get("content"))
        .and_then(Value::as_str)
        .map(ToString::to_string)
        .ok_or_else(|| format!("Provider response did not include choices[0].message.content: {value}"))
}

async fn send_anthropic_message(client: &reqwest::Client, ai: &AIConnection, prompt: &str) -> Result<String, String> {
    let api_key = require_api_key(ai)?;
    let base = clean_base_url(&ai.base_url);
    let url = if base.ends_with("/v1") { format!("{base}/messages") } else { format!("{base}/v1/messages") };

    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert("x-api-key", HeaderValue::from_str(&api_key).map_err(|error| format!("Invalid Anthropic key: {error}"))?);
    headers.insert("anthropic-version", HeaderValue::from_static("2023-06-01"));

    let body = json!({
        "model": ai.model,
        "max_tokens": 2048,
        "system": ai.system_instructions,
        "messages": [{ "role": "user", "content": prompt }]
    });

    let response = client
        .post(url)
        .headers(headers)
        .json(&body)
        .send()
        .await
        .map_err(|error| format!("Could not reach Anthropic: {error}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Anthropic request failed ({status}): {text}"));
    }

    let value: Value = response.json().await.map_err(|error| format!("Invalid Anthropic response: {error}"))?;
    value
        .get("content")
        .and_then(Value::as_array)
        .and_then(|content| content.iter().find_map(|part| part.get("text").and_then(Value::as_str)))
        .map(ToString::to_string)
        .ok_or_else(|| format!("Anthropic response did not include text content: {value}"))
}

async fn send_gemini_message(client: &reqwest::Client, ai: &AIConnection, prompt: &str) -> Result<String, String> {
    let api_key = require_api_key(ai)?;
    let base = clean_base_url(&ai.base_url);
    let url = if base.ends_with("/v1beta") || base.ends_with("/v1") {
        format!("{base}/models/{}:generateContent?key={}", ai.model, api_key)
    } else {
        format!("{base}/v1beta/models/{}:generateContent?key={}", ai.model, api_key)
    };

    let body = json!({
        "systemInstruction": {
            "parts": [{ "text": ai.system_instructions }]
        },
        "contents": [{
            "role": "user",
            "parts": [{ "text": prompt }]
        }]
    });

    let response = client
        .post(url)
        .header(CONTENT_TYPE, "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|error| format!("Could not reach Gemini: {error}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Gemini request failed ({status}): {text}"));
    }

    let value: Value = response.json().await.map_err(|error| format!("Invalid Gemini response: {error}"))?;
    value
        .get("candidates")
        .and_then(Value::as_array)
        .and_then(|candidates| candidates.first())
        .and_then(|candidate| candidate.get("content"))
        .and_then(|content| content.get("parts"))
        .and_then(Value::as_array)
        .and_then(|parts| parts.first())
        .and_then(|part| part.get("text"))
        .and_then(Value::as_str)
        .map(ToString::to_string)
        .ok_or_else(|| format!("Gemini response did not include candidates[0].content.parts[0].text: {value}"))
}

async fn send_message_core(client: &reqwest::Client, ai: &AIConnection, prompt: &str) -> Result<String, String> {
    match ai.provider.as_str() {
        "ollama" => send_ollama_message(client, ai, prompt).await,
        "anthropic" => send_anthropic_message(client, ai, prompt).await,
        "gemini" => send_gemini_message(client, ai, prompt).await,
        "openai" | "openai-compatible" | "lmstudio" | "jan" | "custom" | "local-test" => send_openai_compatible_message(client, ai, prompt).await,
        other => Err(format!("Unsupported provider: {other}")),
    }
}

async fn test_ollama_connection(client: &reqwest::Client, ai: &AIConnection) -> Result<(), String> {
    let url = format!("{}/api/tags", clean_base_url(&ai.base_url));
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|error| format!("Could not reach Ollama: {error}"))?;

    if response.status().is_success() {
        Ok(())
    } else {
        Err(format!("Ollama health check failed: {}", response.status()))
    }
}

async fn test_openai_compatible_connection(client: &reqwest::Client, ai: &AIConnection) -> Result<(), String> {
    let url = format!("{}/models", clean_base_url(&ai.base_url));
    let response = client
        .get(url)
        .headers(bearer_headers(ai)?)
        .send()
        .await
        .map_err(|error| format!("Could not reach provider: {error}"))?;

    if response.status().is_success() {
        Ok(())
    } else {
        Err(format!(
            "Provider model-list check failed: {}. WAI did not send a chat completion test to avoid using tokens. You can still save this AI and test it with a real message.",
            response.status()
        ))
    }
}

async fn test_anthropic_connection(client: &reqwest::Client, ai: &AIConnection) -> Result<(), String> {
    let api_key = require_api_key(ai)?;
    let base = clean_base_url(&ai.base_url);
    let url = if base.ends_with("/v1") { format!("{base}/models") } else { format!("{base}/v1/models") };

    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert("x-api-key", HeaderValue::from_str(&api_key).map_err(|error| format!("Invalid Anthropic key: {error}"))?);
    headers.insert("anthropic-version", HeaderValue::from_static("2023-06-01"));

    let response = client
        .get(url)
        .headers(headers)
        .send()
        .await
        .map_err(|error| format!("Could not reach Anthropic: {error}"))?;

    if response.status().is_success() {
        Ok(())
    } else {
        Err(format!("Anthropic model-list check failed: {}", response.status()))
    }
}

async fn test_gemini_connection(client: &reqwest::Client, ai: &AIConnection) -> Result<(), String> {
    let api_key = require_api_key(ai)?;
    let base = clean_base_url(&ai.base_url);
    let url = if base.ends_with("/v1beta") || base.ends_with("/v1") {
        format!("{base}/models?key={api_key}")
    } else {
        format!("{base}/v1beta/models?key={api_key}")
    };

    let response = client
        .get(url)
        .header(CONTENT_TYPE, "application/json")
        .send()
        .await
        .map_err(|error| format!("Could not reach Gemini: {error}"))?;

    if response.status().is_success() {
        Ok(())
    } else {
        Err(format!("Gemini model-list check failed: {}", response.status()))
    }
}

async fn test_connection_core(client: &reqwest::Client, ai: &AIConnection) -> Result<(), String> {
    match ai.provider.as_str() {
        "ollama" => test_ollama_connection(client, ai).await,
        "openai" | "openai-compatible" | "lmstudio" | "jan" | "custom" | "local-test" => test_openai_compatible_connection(client, ai).await,
        "anthropic" => test_anthropic_connection(client, ai).await,
        "gemini" => test_gemini_connection(client, ai).await,
        other => Err(format!("Unsupported provider: {other}")),
    }
}

#[tauri::command]
async fn test_ai_connection(ai: AIConnection) -> Result<AIConnection, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(45))
        .build()
        .map_err(|error| format!("Could not create HTTP client: {error}"))?;

    let mut updated = ai;
    match test_connection_core(&client, &updated).await {
        Ok(()) => updated.status = "connected".to_string(),
        Err(error) => {
            updated.status = "offline".to_string();
            return Err(error);
        }
    }

    Ok(updated)
}

#[tauri::command]
async fn send_message(ai: AIConnection, prompt: String) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(120))
        .build()
        .map_err(|error| format!("Could not create HTTP client: {error}"))?;

    send_message_core(&client, &ai, &prompt).await
}

#[tauri::command]
async fn run_challenge(ais: Vec<AIConnection>, prompt: String) -> Result<Vec<ChallengeOutput>, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(120))
        .build()
        .map_err(|error| format!("Could not create HTTP client: {error}"))?;

    let tasks = ais.into_iter().map(|ai| {
        let client = client.clone();
        let prompt = prompt.clone();
        async move {
            let started = Instant::now();
            let result = send_message_core(&client, &ai, &prompt).await;
            let latency_ms = started.elapsed().as_millis() as u64;

            match result {
                Ok(output) => ChallengeOutput {
                    id: format!("challenge-{}", ai.id),
                    ai_id: ai.id,
                    ai_name: ai.name,
                    status: "completed".to_string(),
                    output,
                    latency_ms,
                },
                Err(error) => ChallengeOutput {
                    id: format!("challenge-{}", ai.id),
                    ai_id: ai.id,
                    ai_name: ai.name,
                    status: "failed".to_string(),
                    output: error,
                    latency_ms,
                },
            }
        }
    });

    Ok(join_all(tasks).await)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            test_ai_connection,
            send_message,
            run_challenge
        ])
        .run(tauri::generate_context!())
        .expect("error while running WAI Deck");
}
