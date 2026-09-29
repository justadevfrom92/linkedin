import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { theme } from '../theme';
import { Draft } from '../types';

type Props = {
  draft: Draft;
  /** True while any post is being published, since the bot runs one at a time. */
  busy: boolean;
  onChangeText: (text: string) => void;
  onPost: () => void;
  onSchedule: () => void;
  onDiscard: () => void;
};

export function PostCard({ draft, busy, onChangeText, onPost, onSchedule, onDiscard }: Props) {
  const done = draft.status === 'posted' || draft.status === 'scheduled';
  const disabled = busy || done || !draft.text.trim();

  return (
    <View style={styles.card}>
      <TextInput
        style={styles.text}
        multiline
        editable={!done && draft.status !== 'working'}
        value={draft.text}
        onChangeText={onChangeText}
        scrollEnabled={false}
      />
      <Text style={styles.count}>{draft.text.length} / 3000</Text>

      <Status draft={draft} />

      {!done && (
        <View style={styles.actions}>
          <Pressable onPress={onDiscard} disabled={draft.status === 'working'} hitSlop={8}>
            <Text style={styles.discard}>Discard</Text>
          </Pressable>
          <View style={styles.spacer} />
          <Pressable style={[styles.button, styles.secondary, disabled && styles.disabled]} disabled={disabled} onPress={onSchedule}>
            <Text style={styles.secondaryText}>Schedule</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.primary, disabled && styles.disabled]} disabled={disabled} onPress={onPost}>
            <Text style={styles.primaryText}>Post</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function Status({ draft }: { draft: Draft }) {
  const when = draft.when
    ? new Date(draft.when).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';
  switch (draft.status) {
    case 'working':
      return (
        <View style={styles.status}>
          <ActivityIndicator size="small" color={theme.accent} />
          <Text style={styles.statusText}>{draft.note ?? 'Working...'}</Text>
        </View>
      );
    case 'posted':
      return <Text style={[styles.statusText, styles.ok]}>✓ Posted {when}</Text>;
    case 'scheduled':
      return <Text style={[styles.statusText, styles.ok]}>✓ Scheduled for {when}</Text>;
    case 'failed':
      return <Text style={[styles.statusText, styles.error]}>✕ {draft.note}</Text>;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  text: { fontSize: 15, lineHeight: 21, color: theme.text, padding: 0, textAlignVertical: 'top' },
  count: { alignSelf: 'flex-end', fontSize: 11, color: theme.muted, marginTop: 6 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  statusText: { fontSize: 13, color: theme.muted, marginTop: 8 },
  ok: { color: theme.success, fontWeight: '600' },
  error: { color: theme.danger },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  spacer: { flex: 1 },
  discard: { color: theme.muted, fontSize: 14 },
  button: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20 },
  primary: { backgroundColor: theme.accent },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondary: { borderWidth: 1, borderColor: theme.accent },
  secondaryText: { color: theme.accent, fontWeight: '700' },
  disabled: { opacity: 0.4 },
});
