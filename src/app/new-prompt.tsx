import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { addPrompt } from '../prompts';
import { theme } from '../theme';

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export default function NewPrompt() {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const trimmed = text.trim();

  const save = async () => {
    if (!trimmed || saving) return;
    setSaving(true);
    await addPrompt(trimmed);
    close();
  };

  return (
    <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={close} hitSlop={10}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>New prompt</Text>
        <Pressable onPress={save} disabled={!trimmed || saving} hitSlop={10}>
          <Text style={[styles.save, (!trimmed || saving) && styles.disabled]}>Save</Text>
        </Pressable>
      </View>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.body}>
          <Text style={styles.label}>What should the posts be about?</Text>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="e.g. What I learned shipping my first mobile app"
            placeholderTextColor={theme.muted}
            multiline
            autoFocus
            maxLength={300}
          />
          <Text style={styles.hint}>It'll show at the top of your Home list.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: theme.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: theme.text },
  cancel: { fontSize: 16, color: theme.muted },
  save: { fontSize: 16, fontWeight: '700', color: theme.accent },
  disabled: { opacity: 0.4 },
  body: { padding: 16, gap: 8 },
  label: { fontSize: 15, fontWeight: '600', color: theme.text },
  input: {
    minHeight: 110,
    backgroundColor: theme.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    fontSize: 16,
    lineHeight: 22,
    color: theme.text,
    textAlignVertical: 'top',
  },
  hint: { fontSize: 13, color: theme.muted },
});
