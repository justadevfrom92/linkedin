import { StatusBar } from 'expo-status-bar';
import Stack from 'expo-router/stack';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LinkedInProvider } from '../linkedin/LinkedInProvider';
import { theme } from '../theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <LinkedInProvider>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }}>
            <Stack.Screen name="new-prompt" options={{ presentation: 'modal' }} />
          </Stack>
        </LinkedInProvider>
      </View>
    </SafeAreaProvider>
  );
}
