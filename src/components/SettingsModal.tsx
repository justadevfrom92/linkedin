import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../theme';
import { Settings } from '../types';

type Props = {
  visible: boolean;
  settings: Settings;
  apiKey: string;
  onClose: () => void;
  onSave: (settings: Settings, apiKey: string) => void;
};

export function SettingsModal({ visible, settings, apiKey, onClose, onSave }: Props) {
  const [draft, setDraft] = useState(settings);
  const [key, setKey] = useState(apiKey);

  useEffect(() => {
    if (visible) {
      setDraft(settings);
      setKey(apiKey);
    }
  }, [visible, settings, apiKey]);

  const update = (patch: Partial<Settings>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.bar}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Settings</Text>
          <Pressable
            onPress={() => onSave({ ...draft, count: Math.min(10, Math.max(1, draft.count || 5)) }, key.trim())}
            hitSlop={12}
          >
            <Text style={styles.save}>Save</Text>
          </Pressable>
        </View>
        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <Field label="Topics" hint="Comma separated, e.g. React Native, startups, remote work">
              <TextInput
                style={[styles.input, styles.multi]}
                multiline
                value={draft.topics}
                onChangeText={(topics) => update({ topics })}
              />
            </Field>
            <Field label="About you" hint="Your role and experience, so posts sound like you">
              <TextInput
                style={[styles.input, styles.multi]}
                multiline
                value={draft.aboutMe}
                onChangeText={(aboutMe) => update({ aboutMe })}
                placeholder="e.g. Self-taught mobile developer, 5 years building apps"
              />
            </Field>
            <Field label="Tone">
              <TextInput style={styles.input} value={draft.tone} onChangeText={(tone) => update({ tone })} />
            </Field>
            <Field label="Posts per refresh" hint="1 to 10">
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={String(draft.count || '')}
                onChangeText={(v) => update({ count: parseInt(v, 10) || 0 })}
              />
            </Field>
            <Field
              label="Anthropic API key (optional)"
              hint="With a key, Claude writes fresh posts from your topics. Without one, the app uses built-in templates. Stored in the phone's secure storage. Get one at console.anthropic.com."
            >
              <TextInput
                style={styles.input}
                value={key}
                onChangeText={setKey}
                placeholder="sk-ant-..."
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </Field>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { flex: 1, backgroundColor: theme.bg },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: theme.text },
  cancel: { fontSize: 16, color: theme.muted },
  save: { fontSize: 16, color: theme.accent, fontWeight: '700' },
  form: { padding: 16, gap: 18 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: theme.text },
  hint: { fontSize: 12, color: theme.muted },
  input: {
    backgroundColor: theme.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    fontSize: 15,
    color: theme.text,
  },
  multi: { minHeight: 70, textAlignVertical: 'top' },
});
