import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/ui/theme';

export default function RootLayout() {
  const t = useTheme();
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.bg },
          headerTintColor: t.text,
          contentStyle: { backgroundColor: t.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'I-Speak' }} />
        <Stack.Screen name="review" options={{ title: 'Session', headerBackTitle: 'Accueil' }} />
      </Stack>
    </>
  );
}
