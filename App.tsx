import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { PostCard } from './src/components/PostCard';
import { ScheduleModal } from './src/components/ScheduleModal';
import { SettingsModal } from './src/components/SettingsModal';
import { generatePosts } from './src/generate';
import { LinkedInBrowser, LinkedInBrowserHandle } from './src/linkedin/LinkedInBrowser';
import { BotAction } from './src/linkedin/script';
import * as storage from './src/storage';
import { theme } from './src/theme';
import { DEFAULT_SETTINGS, Draft, HistoryEntry, Settings } from './src/types';

type Tab = 'ideas' | 'history';

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** Formats a Date the way LinkedIn's scheduler fields expect (en-US). */
function linkedInDateTime(d: Date) {
  const hours = d.getHours() % 12 || 12;
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return {
    date: `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`,
    time: `${hours}:${minutes} ${d.getHours() < 12 ? 'AM' : 'PM'}`,
  };
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

function Main() {
  const browser = useRef<LinkedInBrowserHandle>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [apiKey, setApiKey] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [tab, setTab] = useState<Tab>('ideas');
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [showBrowser, setShowBrowser] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [scheduling, setScheduling] = useState<Draft | null>(null);
  const [generating, setGenerating] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([storage.loadSettings(), storage.loadApiKey(), storage.loadDrafts(), storage.loadHistory()]).then(
      ([s, k, d, h]) => {
        setSettings(s);
        setApiKey(k);
        // A post that was mid-flight when the app closed didn't finish.
        setDrafts(d.map((x) => (x.status === 'working' ? { ...x, status: 'idle', note: undefined } : x)));
        setHistory(h);
        setLoaded(true);
      },
    );
  }, []);

  useEffect(() => {
    if (loaded) storage.saveDrafts(drafts);
  }, [drafts, loaded]);

  useEffect(() => {
    if (loaded) storage.saveHistory(history);
  }, [history, loaded]);

  const updateDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const refresh = async () => {
    setGenerating(true);
    try {
      const posts = await generatePosts(
        settings,
        apiKey,
        history.map((h) => h.text),
      );
      setDrafts(posts.map((text) => ({ id: newId(), text, status: 'idle' })));
    } catch (e) {
      Alert.alert('Could not generate posts', e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  };

  const publish = async (draft: Draft, when?: Date) => {
    const action: BotAction = when
      ? { kind: 'schedule', text: draft.text, ...linkedInDateTime(when) }
      : { kind: 'post', text: draft.text };

    setBusy(true);
    updateDraft(draft.id, { status: 'working', note: 'Starting' });
    try {
      await browser.current!.run(action, (step) => updateDraft(draft.id, { note: step }));
      const iso = (when ?? new Date()).toISOString();
      const kind = when ? 'scheduled' : 'posted';
      updateDraft(draft.id, { status: kind, note: undefined, when: iso });
      setHistory((h) => [{ id: draft.id, text: draft.text, kind, when: iso }, ...h]);
    } catch (e) {
      updateDraft(draft.id, { status: 'failed', note: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  const saveSettings = async (s: Settings, key: string) => {
    setSettings(s);
    setApiKey(key);
    setShowSettings(false);
    await Promise.all([storage.saveSettings(s), storage.saveApiKey(key)]);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Post Generator</Text>
          <Pressable style={styles.loginPill} onPress={() => setShowBrowser(true)}>
            <View
              style={[
                styles.dot,
                { backgroundColor: loggedIn ? theme.success : loggedIn === false ? theme.danger : theme.muted },
              ]}
            />
            <Text style={styles.loginText}>{loggedIn ? 'LinkedIn' : loggedIn === false ? 'Log in' : 'Checking...'}</Text>
          </Pressable>
          <Pressable onPress={() => setShowSettings(true)} hitSlop={10}>
            <Text style={styles.settings}>Settings</Text>
          </Pressable>
        </View>

        <View style={styles.tabs}>
          {(['ideas', 'history'] as Tab[]).map((t) => (
            <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'ideas' ? 'Ideas' : `History (${history.length})`}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'ideas' ? (
          <FlatList
            data={drafts}
            keyExtractor={(d) => d.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <Pressable
                style={[styles.refresh, (generating || busy) && styles.disabled]}
                disabled={generating || busy}
                onPress={refresh}
              >
                {generating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.refreshText}>↻ Refresh ideas</Text>
                )}
              </Pressable>
            }
            ListEmptyComponent={
              <Text style={styles.empty}>
                Tap Refresh to get post ideas.{'\n'}
                {apiKey ? 'Claude will write them from your topics.' : 'Add an Anthropic API key in Settings for AI-written posts.'}
              </Text>
            }
            renderItem={({ item }) => (
              <PostCard
                draft={item}
                busy={busy}
                onChangeText={(text) => updateDraft(item.id, { text, status: 'idle', note: undefined })}
                onPost={() => publish(item)}
                onSchedule={() => setScheduling(item)}
                onDiscard={() => setDrafts((ds) => ds.filter((d) => d.id !== item.id))}
              />
            )}
          />
        ) : (
          <FlatList
            data={history}
            keyExtractor={(h) => h.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>Nothing posted yet.</Text>}
            renderItem={({ item }) => (
              <View style={styles.historyCard}>
                <Text style={[styles.historyKind, item.kind === 'scheduled' && { color: theme.accent }]}>
                  {item.kind === 'posted' ? 'Posted' : 'Scheduled for'}{' '}
                  {new Date(item.when).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
                <Text style={styles.historyText} numberOfLines={6}>
                  {item.text}
                </Text>
              </View>
            )}
          />
        )}
      </SafeAreaView>

      <ScheduleModal
        visible={!!scheduling}
        onCancel={() => setScheduling(null)}
        onConfirm={(when) => {
          const draft = scheduling!;
          setScheduling(null);
          publish(draft, when);
        }}
      />
      <SettingsModal
        visible={showSettings}
        settings={settings}
        apiKey={apiKey}
        onClose={() => setShowSettings(false)}
        onSave={saveSettings}
      />
      <LinkedInBrowser
        ref={browser}
        visible={showBrowser}
        onClose={() => setShowBrowser(false)}
        onLoginChange={setLoggedIn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.card,
  },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: theme.text },
  loginPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: theme.bg,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  loginText: { fontSize: 13, fontWeight: '600', color: theme.text },
  settings: { fontSize: 15, color: theme.accent, fontWeight: '600' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderColor: 'transparent' },
  tabActive: { borderColor: theme.accent },
  tabText: { fontSize: 14, color: theme.muted, fontWeight: '600' },
  tabTextActive: { color: theme.accent },
  list: { paddingTop: 12, paddingBottom: 40 },
  refresh: {
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: theme.accent,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  refreshText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  empty: { textAlign: 'center', color: theme.muted, marginTop: 40, lineHeight: 22, paddingHorizontal: 24 },
  historyCard: {
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  historyKind: { fontSize: 12, fontWeight: '700', color: theme.success, marginBottom: 6 },
  historyText: { fontSize: 14, color: theme.text, lineHeight: 20 },
});
