import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loadPrompts, Prompt, PROMPTS } from '../prompts';
import { theme } from '../theme';

export default function Home() {
  const [prompts, setPrompts] = useState<Prompt[]>(PROMPTS);

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
        contentContainerStyle={styles.list}
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

      <SafeAreaView edges={['bottom']} style={styles.bar}>
        <Pressable
          style={({ pressed }) => [styles.add, pressed && styles.addPressed]}
          onPress={() => router.push('/new-prompt')}
          accessibilityRole="button"
          accessibilityLabel="New prompt"
          hitSlop={8}
        >
          <Text style={styles.plus}>+</Text>
        </Pressable>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const ADD_SIZE = 60;

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: theme.bg },
  list: { padding: 12, gap: 10, paddingBottom: 24 },
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
  bar: {
    alignItems: 'center',
    backgroundColor: theme.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    paddingTop: 10,
    paddingBottom: 10,
  },
  add: {
    width: ADD_SIZE,
    height: ADD_SIZE,
    borderRadius: ADD_SIZE / 2,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  addPressed: { opacity: 0.8, transform: [{ scale: 0.95 }] },
  plus: { color: '#fff', fontSize: 34, lineHeight: 38, fontWeight: '400' },
});
