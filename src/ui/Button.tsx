import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from './theme';

export function Button(props: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={props.onPress}
      disabled={props.disabled}
      style={({ pressed }) => [
        s.btn,
        {
          backgroundColor: props.secondary ? t.card : t.primary,
          borderColor: t.border,
          opacity: props.disabled ? 0.4 : pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text style={[s.label, { color: props.secondary ? t.text : t.onPrimary }]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  label: { fontSize: 18, fontWeight: '600' },
});
