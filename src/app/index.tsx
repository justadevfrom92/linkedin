import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_BAR_SPACE, BottomBar } from '../components/BottomBar';
import { loadPrompts, Prompt, PROMPTS } from '../prompts';
import { theme } from '../theme';

export default function Home() {
  const [prompts, setPrompts] = useState<Prompt[]>(PROMPTS);
  const insets = useSafeAreaInsets();

  // Reload when returning from the New prompt screen.
  useFocusEffect(
    useCallback(() => {
      loadPrompts().then(setPrompts);
    }, []),
  );

  return (
    <SafeAreaView style={styles.fill} edges={['top']}>
      <FlatList
        data={prompts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={[styles.list, { paddingBottom: BOTTOM_BAR_SPACE + insets.bottom }]}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            onPress={() => router.push({ pathname: '/ideas', params: { prompt: item.id } })}
          >
            <Text style={styles.text}>{item.text}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      />

      <BottomBar onAdd={() => router.push('/new-prompt')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: theme.bg },
  list: { padding: 12, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.card,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  pressed: { opacity: 0.6 },
  text: { flex: 1, fontSize: 16, lineHeight: 22, color: theme.text },
  chevron: { fontSize: 24, color: theme.muted },
});
