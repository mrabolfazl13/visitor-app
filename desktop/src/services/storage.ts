import { invoke } from '@tauri-apps/api/core';

export const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const memory = new Map<string, string>();

export async function getItem(key: string): Promise<string | null> {
  if (isTauri) {
    return invoke<string | null>('kv_get', { key });
  }
  return window.localStorage ? window.localStorage.getItem(key) ?? memory.get(key) ?? null : memory.get(key) ?? null;
}

export async function setItem(key: string, value: string): Promise<void> {
  if (isTauri) {
    await invoke('kv_set', { key, value });
    return;
  }
  if (window.localStorage) {
    window.localStorage.setItem(key, value);
    return;
  }
  memory.set(key, value);
}

export async function removeItem(key: string): Promise<void> {
  if (isTauri) {
    await invoke('kv_del', { key });
    return;
  }
  if (window.localStorage) {
    window.localStorage.removeItem(key);
  }
  memory.delete(key);
}
