import AsyncStorage from '@react-native-async-storage/async-storage';

import { HistoryEntry } from './types';

const HISTORY_KEY = 'history';

/** Posts already published or scheduled, newest first. Used to avoid repeats. */
export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export async function addToHistory(entry: HistoryEntry): Promise<void> {
  const history = await loadHistory();
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...history].slice(0, 100)));
}
