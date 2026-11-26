import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { usePathname, useRouter } from 'expo-router';
import { Text } from 'react-native';
import { color } from '../tokens';

/**
 * The five places the app goes.
 *
 * This replaces the drawer. A drawer hides navigation behind a tap
 * and a gesture, which is defensible on a dense dashboard and wrong
 * here: the validated design puts the five destinations on screen at
 * all times, so the learner never has to remember what exists.
 *
 * Five is the ceiling, not a target. A sixth tab would shrink every
 * label below legible, and anything that is not one of these five is
 * a setting — it belongs inside «Yo».
 *
 * Deliberately absent from the toll, the duel, the drill and the mock
 * exam: those are one task each, and a tab bar there is an invitation
 * to abandon a session halfway. The toll in particular runs over
 * another app and has no «somewhere else» to offer.
 */

/* Drawn here as paths rather than pulled from an icon package: five
   24px glyphs do not justify a dependency, and the stroke weight has
   to match the artifact's 1.9. */
const ICONOS = {
  casa: 'M3 11l9-8 9 8M5 10v10h14V10',
  pesa: 'M4 9v6M20 9v6M7 7v10M17 7v10M7 12h10',
  espadas: 'M5 3l9 9-2 2-9-9zM19 3l-9 9 2 2 9-9',
  reloj: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l3 2',
  yo: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M4 21a8 8 0 0 1 16 0',
} as const;

const PESTANAS = [
  { ruta: '/inicio', icono: 'casa', nombre: 'Inicio' },
  { ruta: '/entrenar', icono: 'pesa', nombre: 'Entrenar' },
  { ruta: '/duelos', icono: 'espadas', nombre: 'Duelos' },
  { ruta: '/repaso', icono: 'reloj', nombre: 'Repaso' },
  { ruta: '/yo', icono: 'yo', nombre: 'Yo' },
] as const;

export type RutaPestana = (typeof PESTANAS)[number]['ruta'];

export function BarraPestanas() {
  const router = useRouter();
  const ruta = usePathname();

  return (
    <View
      accessibilityRole="tablist"
      /* The top line is the only separator. A shadow here would lift
         the bar above content that is already scrolling under it. */
      className="flex-row items-center justify-around border-t border-linea bg-capa px-2 pb-3.5 pt-2.5"
    >
      {PESTANAS.map((p) => {
        const activa = ruta === p.ruta;
        return (
          <Pressable
            key={p.ruta}
            onPress={() => {
              /* Tapping the tab you are on does nothing. Pushing the
                 same route again stacks a second copy, and the back
                 gesture then walks through duplicates. */
              if (activa) return;
              router.replace(p.ruta as never);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: activa }}
            accessibilityLabel={p.nombre}
            /* 44pt minimum, even though the glyph is 21: the row is
               at the bottom edge where thumbs are least accurate. */
            className="min-h-toque min-w-[56px] items-center justify-center gap-[3px]"
          >
            <Svg width={21} height={21} viewBox="0 0 24 24">
              <Path
                d={ICONOS[p.icono]}
                stroke={activa ? color.acentoTexto : color.textoApagado}
                strokeWidth={1.9}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
            <Text
              style={{ fontFamily: 'Inter_600SemiBold' }}
              className={`text-[10px] ${activa ? 'text-acento-texto' : 'text-texto-apagado'}`}
            >
              {p.nombre}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
