import { View } from 'react-native';
import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PESTANAS, PestanaBoton } from '@/shared/ui';

/**
 * The five tabs, and the bar that does not blink.
 *
 * Before this layout existed, every tab screen drew its own copy of
 * the bar and switched with `router.replace`. Two faults came out of
 * that, both reported from a real phone:
 *
 * «cuando cambias de vista, el bottom bar también hace como una
 * animación rara de parpadeo y de inmediato vuelve a aparecer» — the
 * bar was not persisting through the change. It could not: the screen
 * owned it, so leaving the screen unmounted the bar and arriving
 * mounted a new one. What looked like a bad animation was the bar
 * dying and being born.
 *
 * «si le doy retroceder con los gestos del teléfono me saca de la
 * app» — `replace` leaves no history, so from any tab the back
 * gesture had nowhere to go but out. A learner who opened Entrenar
 * could not return to Inicio by any gesture the phone offers.
 *
 * A tab navigator fixes both at once, because both had the same
 * cause: the bar belongs to the navigator, not to the screens. The
 * bar now renders once, outside the content, and only its highlight
 * moves. Back inside a tab group goes to the previously focused tab.
 *
 * `expo-router/ui` rather than the bundled `Tabs`: this one is
 * headless, so the bar stays exactly the component the design system
 * already validated instead of a platform bar wearing its colours.
 */
export default function PestanasLayout() {
  return (
    <Tabs
      /* Keeps a tab's screen mounted while another is on top, so
         coming back shows it as it was. This is the other half of
         what was reported — «es como si se recargara para mostrar la
         página» — and it was true: each arrival was a fresh mount,
         which refetched and reset the scroll. */
      activityEnabled
      options={{ backBehavior: 'history' }}
    >
      <TabSlot />

      {/* `asChild` so Expo adds no wrapper of its own: the bar's own
          border, fill and padding are the design, and a view around
          it would sit between that border and the screen edge. The
          safe area becomes ours to handle, which is what the
          `SafeAreaView` below is for. */}
      <TabList asChild>
        <SafeAreaView edges={['bottom']} className="bg-capa">
          <View
            accessibilityRole="tablist"
            /* The top line is the only separator. A shadow here would
               lift the bar above content already scrolling under it. */
            className="flex-row items-center justify-around border-t border-linea px-2 pb-1.5 pt-2.5"
          >
            {PESTANAS.map((p) => (
              /* `asChild` again: `TabTrigger` would render its own
                 Pressable, and the button carries the 44pt target,
                 the icon and the label. */
              <TabTrigger key={p.ruta} name={p.nombre} href={p.ruta} asChild>
                <PestanaBoton pestana={p} />
              </TabTrigger>
            ))}
          </View>
        </SafeAreaView>
      </TabList>
    </Tabs>
  );
}
