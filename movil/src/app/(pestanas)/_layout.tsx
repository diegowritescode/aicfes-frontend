import { View } from 'react-native';
import { TabSlot, useTabsWithTriggers } from 'expo-router/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PESTANAS, PestanaBoton } from '@/shared/ui';

/**
 * The five tabs, and the bar that does not blink.
 *
 * Before this layout existed, every tab screen drew its own copy of
 * the bar and switched with `router.replace`. Two faults came out of
 * that, both reported from a real phone:
 *
 * «el bottom bar también hace como una animación rara de parpadeo y
 * de inmediato vuelve a aparecer» — the bar was not persisting. It
 * could not: the screen owned it, so leaving unmounted the bar and
 * arriving mounted a new one. What looked like a bad animation was
 * the bar dying and being born.
 *
 * «si le doy retroceder con los gestos del teléfono me saca de la
 * app» — `replace` leaves no history, so from any tab the back
 * gesture had nowhere to go but out.
 *
 * A tab navigator fixes both, because both had one cause: the bar
 * belongs to the navigator, not to the screens.
 *
 * Built from `useTabsWithTriggers` rather than from the `<Tabs>`
 * component. `<Tabs>` discovers its routes by walking the JSX for
 * `<TabList>` and `<TabTrigger>` elements, and those components bring
 * layout of their own that cannot be turned off — a first attempt
 * with them shipped the bar broken, with the five tabs strung out in
 * one horizontal row, nothing marking the current tab, and taps doing
 * nothing. The hook takes the same routes as plain data and returns
 * only the navigator, so every pixel below is the design system's.
 */
export default function PestanasLayout() {
  const { NavigationContent } = useTabsWithTriggers({
    /* The same list the bar renders, so a tab cannot be registered
       without being drawn or drawn without being registered. Each
       `name` is what `PestanaBoton` looks itself up by. */
    triggers: PESTANAS.map((p) => ({
      type: 'internal' as const,
      name: p.nombre,
      href: p.ruta,
    })),
    /* Keeps a tab's screen mounted while another is on top, so coming
       back shows it as it was. This is the other half of what was
       reported — «es como si se recargara para mostrar la página» —
       and it was true: each arrival was a fresh mount, which refetched
       and reset the scroll. */
    activityEnabled: true,
    backBehavior: 'history',
  });

  return (
    <NavigationContent>
      <View className="flex-1">
        <TabSlot />

        {/* Only the bottom edge: the screens inside handle their own
            top inset, and insetting here would push every one of them
            down by the status bar twice. */}
        <SafeAreaView edges={['bottom']} className="bg-capa">
          <View
            accessibilityRole="tablist"
            /* The top line is the only separator. A shadow here would
               lift the bar above content already scrolling under it. */
            className="flex-row items-stretch border-t border-linea px-2 pb-1.5 pt-2.5"
          >
            {PESTANAS.map((p) => (
              <PestanaBoton key={p.ruta} pestana={p} />
            ))}
          </View>
        </SafeAreaView>
      </View>
    </NavigationContent>
  );
}
