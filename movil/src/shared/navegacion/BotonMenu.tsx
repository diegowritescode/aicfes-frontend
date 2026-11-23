import { Pressable, View } from 'react-native';

/**
 * The three lines that open the menu.
 *
 * Drawn rather than an icon font: three views cost nothing and avoid
 * a dependency whose whole job would be this shape.
 */
export function BotonMenu({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Abrir el menú"
      hitSlop={12}
      className="gap-[5px] py-1"
    >
      {[0, 1, 2].map((i) => (
        <View key={i} className="h-[2px] w-[22px] rounded-full bg-slate-700" />
      ))}
    </Pressable>
  );
}
