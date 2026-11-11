import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { bootstrap } from '@/app/bootstrap';
import { countDue } from '@/db/cards';
import { Button } from '@/ui/Button';
import { useTheme } from '@/ui/theme';

export default function Home() {
  const t = useTheme();
  const router = useRouter();
  const [due, setDue] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      bootstrap()
        .then(async (c) => setDue(await countDue(c.db, c.lang, Date.now())))
        .catch((e) => setError(String(e)));
    }, []),
  );

  if (error) return <Text style={[s.center, { color: t.bad }]}>{error}</Text>;
  if (due === null) return <ActivityIndicator style={s.center} />;
  return (
    <View style={s.wrap}>
      <Text style={[s.big, { color: t.text }]}>{due}</Text>
      <Text style={[s.sub, { color: t.muted }]}>
        {due === 0 ? 'aucune révision due' : due === 1 ? 'révision due' : 'révisions dues'}
      </Text>
      <View style={{ height: 32 }} />
      <Button label="Commencer la session" onPress={() => router.push('/review')} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 24, justifyContent: 'center' },
  center: { flex: 1, textAlign: 'center', textAlignVertical: 'center', padding: 24 },
  big: { fontSize: 72, fontWeight: '700', textAlign: 'center' },
  sub: { fontSize: 18, textAlign: 'center' },
});
