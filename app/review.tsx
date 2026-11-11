import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { bootstrap, type AppContext } from '@/app/bootstrap';
import { getCard, listDue } from '@/db/cards';
import {
  buildTranslate,
  gradeTranslate,
  type SentenceData,
  type TranslateExercise,
} from '@/engine/exercises/translate';
import type { DiffOp, Grade } from '@/engine/grading/grade';
import { createScheduler } from '@/engine/scheduler/scheduler';
import { pickNewFromDb } from '@/engine/session/pickNew';
import { recordReview } from '@/engine/session/review';
import { Button } from '@/ui/Button';
import { useTheme, type Theme } from '@/ui/theme';

const NEW_PER_SESSION = 5; // jalon 1 : fixe ; dépendra du temps quotidien au jalon 3
const sched = createScheduler();

interface Item {
  sentence: SentenceData;
  isNew: boolean;
  /** Déjà noté dans cette session : une nouvelle tentative ne compte plus. */
  recorded: boolean;
}

export default function Review() {
  const t = useTheme();
  const router = useRouter();
  const [ctx, setCtx] = useState<AppContext | null>(null);
  const [queue, setQueue] = useState<Item[] | null>(null);
  const [phase, setPhase] = useState<'intro' | 'ask' | 'result'>('ask');
  const [input, setInput] = useState('');
  const [result, setResult] = useState<Grade | null>(null);
  const [done, setDone] = useState(0);
  const startedAt = useRef(0);

  useEffect(() => {
    (async () => {
      const c = await bootstrap();
      const now = Date.now();
      const dueIds = (await listDue(c.db, c.lang, now)).map((r) => r.sentence_id);
      const newIds = await pickNewFromDb(c.db, c.lang, NEW_PER_SESSION);
      const load = async (id: string, isNew: boolean): Promise<Item> => ({
        sentence: (await c.db.get<SentenceData>(
          'SELECT id, text, fr FROM sentences WHERE lang=? AND id=?',
          [c.lang, id],
        ))!,
        isNew,
        recorded: false,
      });
      const items = [
        ...(await Promise.all(dueIds.map((i) => load(i, false)))),
        ...(await Promise.all(newIds.map((i) => load(i, true)))),
      ];
      setCtx(c);
      setQueue(items);
      setPhase(items[0]?.isNew ? 'intro' : 'ask');
      startedAt.current = Date.now();
    })();
  }, []);

  if (!ctx || !queue) return <ActivityIndicator style={{ flex: 1 }} />;
  if (queue.length === 0) {
    return (
      <View style={s.wrap}>
        <Text style={[s.title, { color: t.text }]}>
          {done > 0 ? 'Session terminée 🎉' : 'Rien à faire pour l’instant'}
        </Text>
        <Text style={[s.muted, { color: t.muted }]}>{done} phrase(s) travaillée(s).</Text>
        <View style={{ height: 24 }} />
        <Button label="Retour à l’accueil" onPress={() => router.back()} />
      </View>
    );
  }

  const item = queue[0];
  const ex: TranslateExercise = buildTranslate(item.sentence);

  const next = (requeue: boolean) => {
    const rest = queue.slice(1);
    const nextQueue = requeue ? [...rest, { ...item, recorded: true, isNew: false }] : rest;
    if (!requeue) setDone((d) => d + 1);
    setQueue(nextQueue);
    setInput('');
    setResult(null);
    setPhase(nextQueue[0]?.isNew ? 'intro' : 'ask');
    startedAt.current = Date.now();
  };

  const submit = async () => {
    const { grade, rating } = gradeTranslate(ex, input);
    setResult(grade);
    setPhase('result');
    if (!item.recorded) {
      const card = await getCard(ctx.db, ctx.lang, item.sentence.id);
      if (card) {
        await recordReview(ctx.db, sched, {
          lang: ctx.lang,
          sentenceId: item.sentence.id,
          rating,
          exerciseType: ex.type,
          now: Date.now(),
          durationMs: Date.now() - startedAt.current,
        });
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        <Text style={[s.muted, { color: t.muted }]}>
          {queue.length} restante(s) ·{' '}
          {item.isNew && phase === 'intro' ? 'Nouvelle phrase' : 'Traduis en italien'}
        </Text>

        {phase === 'intro' ? (
          <>
            <Text style={[s.target, { color: t.text }]}>{item.sentence.text}</Text>
            <Text style={[s.muted, { color: t.muted }]}>{item.sentence.fr}</Text>
            <View style={{ height: 24 }} />
            <Button label="Compris, m’interroger" onPress={() => setPhase('ask')} />
          </>
        ) : (
          <>
            <Text style={[s.target, { color: t.text }]}>{ex.prompt}</Text>
            <TextInput
              value={input}
              onChangeText={setInput}
              editable={phase === 'ask'}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              placeholder="Ta réponse"
              placeholderTextColor={t.muted}
              onSubmitEditing={phase === 'ask' ? submit : undefined}
              style={[s.input, { color: t.text, borderColor: t.border, backgroundColor: t.card }]}
            />
            {phase === 'ask' ? (
              <Button label="Valider" onPress={submit} disabled={input.trim() === ''} />
            ) : (
              result && (
                <>
                  <Feedback grade={result} answer={ex.answer} t={t} />
                  <View style={{ height: 16 }} />
                  <Button label="Suivant" onPress={() => next(result.result === 'wrong')} />
                </>
              )
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Feedback({ grade, answer, t }: { grade: Grade; answer: string; t: Theme }) {
  const head =
    grade.result === 'correct'
      ? { txt: 'Correct', c: t.ok }
      : grade.result === 'accent'
        ? { txt: 'Correct, attention à l’accent', c: t.warn }
        : { txt: 'Pas tout à fait', c: t.bad };
  return (
    <View style={{ marginVertical: 16 }}>
      <Text style={[s.head, { color: head.c }]}>{head.txt}</Text>
      <Text style={s.diff}>
        {grade.diff.map((d, i) => (
          <Text key={i} style={diffStyle(d, t)}>
            {label(d)}{' '}
          </Text>
        ))}
      </Text>
      {grade.result === 'wrong' && (
        <Text style={[s.muted, { color: t.muted }]}>Réponse : {answer}</Text>
      )}
    </View>
  );
}

const label = (d: DiffOp) =>
  d.type === 'ok'
    ? d.word
    : d.type === 'accent'
      ? d.expected
      : d.type === 'missing'
        ? d.expected
        : d.actual;
const diffStyle = (d: DiffOp, t: Theme) => ({
  fontSize: 22,
  color: d.type === 'ok' ? t.text : d.type === 'accent' ? t.warn : t.bad,
  textDecorationLine:
    d.type === 'extra'
      ? ('line-through' as const)
      : d.type === 'missing'
        ? ('underline' as const)
        : ('none' as const),
});

const s = StyleSheet.create({
  wrap: { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 12 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  target: { fontSize: 28, fontWeight: '600' },
  muted: { fontSize: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 20 },
  head: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  diff: { lineHeight: 32 },
});
