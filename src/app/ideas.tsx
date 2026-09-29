import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PostCard } from '../components/PostCard';
import { ScheduleModal } from '../components/ScheduleModal';
import { generatePosts, POSTS_PER_PROMPT } from '../generate';
import { useLinkedIn } from '../linkedin/LinkedInProvider';
import { BotAction } from '../linkedin/script';
import { findPrompt, getPrompt, Prompt, PROMPTS } from '../prompts';
import { addToHistory, loadHistory } from '../storage';
import { theme } from '../theme';
import { Draft } from '../types';

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
/** Scrolling loads more ideas in batches until a prompt has this many. */
const MAX_IDEAS = 25;

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

function goHome() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export default function Ideas() {
  const params = useLocalSearchParams<{ prompt: string }>();
  // Built-in prompts resolve immediately; ones you created load from storage.
  const [prompt, setPrompt] = useState<Prompt | undefined>(() => findPrompt(params.prompt ?? ''));
  const linkedIn = useLinkedIn();

  useEffect(() => {
    if (!prompt) getPrompt(params.prompt ?? '').then((p) => setPrompt(p ?? PROMPTS[0]));
  }, [prompt, params.prompt]);

  const [drafts, setDrafts] = useState<Draft[]>([]);
  // Counts every idea generated for this prompt, including discarded ones, so the cap holds.
  const [generated, setGenerated] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scheduling, setScheduling] = useState<Draft | null>(null);
  const inFlight = useRef(false);

  const loadMore = useCallback(async () => {
    if (!prompt || inFlight.current || generated >= MAX_IDEAS) return;
    inFlight.current = true;
    setLoading(true);
    setError('');
    try {
      const history = await loadHistory();
      const avoid = [...drafts.map((d) => d.text), ...history.map((h) => h.text)];
      const posts = (await generatePosts(prompt, API_KEY, avoid, generated)).slice(0, MAX_IDEAS - generated);
      setDrafts((ds) => [...ds, ...posts.map((text): Draft => ({ id: newId(), text, status: 'idle' }))]);
      setGenerated((n) => n + POSTS_PER_PROMPT);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [prompt, drafts, generated]);

  useEffect(() => {
    loadMore();
    // Load the first batch once per prompt; later batches come from scrolling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt?.id]);

  const updateDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const publish = async (draft: Draft, when?: Date) => {
    const action: BotAction = when
      ? { kind: 'schedule', text: draft.text, ...linkedInDateTime(when) }
      : { kind: 'post', text: draft.text };
    updateDraft(draft.id, { status: 'working', note: 'Starting' });
    try {
      await linkedIn.publish(action, (step) => updateDraft(draft.id, { note: step }));
      const iso = (when ?? new Date()).toISOString();
      const kind = when ? 'scheduled' : 'posted';
      updateDraft(draft.id, { status: kind, note: undefined, when: iso });
      await addToHistory({ id: draft.id, text: draft.text, kind, when: iso });
    } catch (e) {
      updateDraft(draft.id, { status: 'failed', note: e instanceof Error ? e.message : String(e) });
    }
  };

  return (
    <SafeAreaView style={styles.fill} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.prompt} numberOfLines={2}>
          {prompt?.text}
        </Text>
        <Pressable style={styles.home} onPress={goHome} hitSlop={10} accessibilityRole="button">
          <Text style={styles.homeText}>Home</Text>
        </Pressable>
      </View>

      {drafts.length === 0 ? (
        <View style={styles.center}>
          {error ? (
            <>
              <Text style={styles.error}>{error}</Text>
              <Pressable style={styles.retry} onPress={loadMore}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={styles.muted}>Writing {POSTS_PER_PROMPT} post ideas...</Text>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={drafts}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          onEndReached={() => {
            if (!error) loadMore();
          }}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => (
            <PostCard
              draft={item}
              busy={linkedIn.busy}
              onChangeText={(text) => updateDraft(item.id, { text, status: 'idle', note: undefined })}
              onPost={() => publish(item)}
              onSchedule={() => setScheduling(item)}
              onDiscard={() => setDrafts((ds) => ds.filter((d) => d.id !== item.id))}
            />
          )}
          ListFooterComponent={
            <View style={styles.footer}>
              {loading ? (
                <>
                  <ActivityIndicator color={theme.accent} />
                  <Text style={styles.muted}>Writing {POSTS_PER_PROMPT} more...</Text>
                </>
              ) : error ? (
                <>
                  <Text style={styles.error}>{error}</Text>
                  <Pressable style={styles.retry} onPress={loadMore}>
                    <Text style={styles.retryText}>Try again</Text>
                  </Pressable>
                </>
              ) : generated >= MAX_IDEAS ? (
                <Text style={styles.muted}>That's all {MAX_IDEAS} ideas for this prompt.</Text>
              ) : null}
            </View>
          }
        />
      )}

      <ScheduleModal
        visible={!!scheduling}
        onCancel={() => setScheduling(null)}
        onConfirm={(when) => {
          const draft = scheduling!;
          setScheduling(null);
          publish(draft, when);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: theme.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  prompt: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.text },
  home: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: theme.accent },
  homeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  list: { paddingTop: 12, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  muted: { color: theme.muted, fontSize: 15 },
  error: { color: theme.danger, fontSize: 15, textAlign: 'center' },
  footer: { alignItems: 'center', gap: 10, paddingVertical: 20, paddingHorizontal: 24 },
  retry: {
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.accent,
  },
  retryText: { color: theme.accent, fontWeight: '700', fontSize: 15 },
});
