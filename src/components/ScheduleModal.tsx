import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme';

const QUARTER_HOUR = 15 * 60 * 1000;

/** Tomorrow at 9:00 AM. LinkedIn's scheduler works in 15-minute steps. */
function defaultTime(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

function nextQuarterHour(from: Date, extraMs: number): Date {
  return new Date(Math.ceil((from.getTime() + extraMs) / QUARTER_HOUR) * QUARTER_HOUR);
}

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (when: Date) => void;
};

export function ScheduleModal({ visible, onCancel, onConfirm }: Props) {
  const [when, setWhen] = useState(defaultTime);

  useEffect(() => {
    if (visible) setWhen(defaultTime());
  }, [visible]);

  const shift = (ms: number) => setWhen((w) => new Date(w.getTime() + ms));
  const setHour = (h: number) =>
    setWhen((w) => {
      const d = new Date(w);
      d.setHours(h, 0, 0, 0);
      return d;
    });

  const tooSoon = when.getTime() < Date.now() + QUARTER_HOUR;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Schedule post</Text>

          <Text style={styles.date}>
            {when.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
          <Text style={styles.time}>
            {when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
          </Text>

          <Stepper label="Day" onMinus={() => shift(-86_400_000)} onPlus={() => shift(86_400_000)} />
          <Stepper label="Hour" onMinus={() => shift(-3_600_000)} onPlus={() => shift(3_600_000)} />
          <Stepper label="15 min" onMinus={() => shift(-QUARTER_HOUR)} onPlus={() => shift(QUARTER_HOUR)} />

          <View style={styles.presets}>
            <Chip label="In 1 hour" onPress={() => setWhen(nextQuarterHour(new Date(), 3_600_000))} />
            <Chip label="9 AM" onPress={() => setHour(9)} />
            <Chip label="12 PM" onPress={() => setHour(12)} />
            <Chip label="5 PM" onPress={() => setHour(17)} />
          </View>

          {tooSoon && <Text style={styles.warn}>Pick a time at least 15 minutes from now.</Text>}

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.secondary]} onPress={onCancel}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.primary, tooSoon && styles.disabled]}
              disabled={tooSoon}
              onPress={() => onConfirm(when)}
            >
              <Text style={styles.primaryText}>Schedule</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Stepper({ label, onMinus, onPlus }: { label: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepButton} onPress={onMinus} hitSlop={6}>
        <Text style={styles.stepText}>−</Text>
      </Pressable>
      <Text style={styles.stepLabel}>{label}</Text>
      <Pressable style={styles.stepButton} onPress={onPlus} hitSlop={6}>
        <Text style={styles.stepText}>+</Text>
      </Pressable>
    </View>
  );
}

function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.chip} onPress={onPress}>
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  title: { fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 16 },
  date: { fontSize: 16, color: theme.muted, textAlign: 'center' },
  time: { fontSize: 40, fontWeight: '700', color: theme.text, textAlign: 'center', marginBottom: 16 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 6 },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 24, color: theme.accent, fontWeight: '600' },
  stepLabel: { width: 90, textAlign: 'center', fontSize: 15, color: theme.text },
  presets: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: theme.bg },
  chipText: { color: theme.accent, fontWeight: '600' },
  warn: { color: theme.danger, textAlign: 'center', marginTop: 12 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 24, alignItems: 'center' },
  primary: { backgroundColor: theme.accent },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondary: { borderWidth: 1, borderColor: theme.accent },
  secondaryText: { color: theme.accent, fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.4 },
});
