import { Text, View } from 'react-native';

/**
 * Something went wrong, said once, where it happened.
 *
 * It announces itself to a screen reader: a learner who cannot see the
 * red box would otherwise tap the button again and wonder why nothing
 * happens.
 */
export function Aviso({ mensaje, tono = 'error' }: { mensaje: string; tono?: 'error' | 'aviso' }) {
  const marco = tono === 'error' ? 'bg-rose-50' : 'bg-amber-50';
  const texto = tono === 'error' ? 'text-rose-700' : 'text-amber-800';

  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" className={`rounded-2xl px-4 py-3 ${marco}`}>
      <Text className={`text-[13.5px] leading-relaxed ${texto}`}>{mensaje}</Text>
    </View>
  );
}
