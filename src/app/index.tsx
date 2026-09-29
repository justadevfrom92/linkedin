import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PROMPTS } from '../prompts';
import { theme } from '../theme';

export default function Home() {
  return (
    <SafeAreaView style={styles.fill} edges={['top']}>
      <FlatList
        data={PROMPTS}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: theme.bg },
  list: { padding: 12, gap: 10, paddingBottom: 40 },
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
