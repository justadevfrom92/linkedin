import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { DEFAULT_SETTINGS, Draft, HistoryEntry, Settings } from './types';

const SETTINGS_KEY = 'settings';
const DRAFTS_KEY = 'drafts';
const HISTORY_KEY = 'history';
const API_KEY_KEY = 'anthropicApiKey';

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): Promise<void> {
  return AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function loadSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...(await readJson<Partial<Settings>>(SETTINGS_KEY, {})) };
}

export const saveSettings = (settings: Settings) => writeJson(SETTINGS_KEY, settings);

export const loadDrafts = () => readJson<Draft[]>(DRAFTS_KEY, []);
export const saveDrafts = (drafts: Draft[]) => writeJson(DRAFTS_KEY, drafts);

export const loadHistory = () => readJson<HistoryEntry[]>(HISTORY_KEY, []);
export const saveHistory = (history: HistoryEntry[]) => writeJson(HISTORY_KEY, history);

export async function loadApiKey(): Promise<string> {
  return (await SecureStore.getItemAsync(API_KEY_KEY)) ?? '';
}

export async function saveApiKey(key: string): Promise<void> {
  if (key) await SecureStore.setItemAsync(API_KEY_KEY, key);
  else await SecureStore.deleteItemAsync(API_KEY_KEY);
}
