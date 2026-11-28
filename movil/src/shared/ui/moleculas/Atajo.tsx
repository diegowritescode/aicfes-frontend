import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Texto } from '../atomos/Texto';
import { color } from '../tokens';

/**
 * One tile in the «Práctica rápida» grid.
 *
 * Taken from the validated design, where four tinted squares sit
 * under the day's goal. They are not navigation — the tab bar is
 * navigation — they are the four things worth starting from a cold
 * open, placed where a thumb reaches without scrolling.
 *
 * Each tile carries its own tint rather than all four sharing the
 * accent. Colour is what makes a grid scannable: a learner who comes
 * back daily reaches for the green one without reading it.
 */

const ICONOS = {
  pesa: 'M4 9v6M20 9v6M7 7v10M17 7v10M7 12h10',
  espadas: 'M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M5 14l6 6M3 18l3 3M4 21l2-2',
  reloj: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l3 2',
  examen: 'M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM9 8h6M9 12h6M9 16h3',
  libro: 'M4 4h7a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H4ZM20 4h-5a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H20Z',
  chispa: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z',
} as const;

export type IconoDeAtajo = keyof typeof ICONOS;

const TINTE: Record<string, string> = {
  acento: 'bg-acento-suave',
  ganado: 'bg-ganado-suave',
  fallo: 'bg-fallo-suave',
  neutro: 'bg-capa-alta',
};

const TRAZO: Record<string, string> = {
  acento: color.acentoTexto,
  ganado: color.ganado,
  fallo: color.fallo,
  neutro: color.textoApagado,
};

export type TonoDeAtajo = keyof typeof TINTE;

export function Atajo({
  icono,
  tono = 'acento',
  nombre,
  alTocar,
  etiqueta,
}: {
  icono: IconoDeAtajo;
  tono?: TonoDeAtajo;
  nombre: string;
  alTocar: () => void;
  etiqueta?: string;
}) {
  return (
    <Pressable
      onPress={alTocar}
      accessibilityRole="button"
      accessibilityLabel={etiqueta ?? nombre}
      /* `flex-1` with a `basis` under a half: four of these in a
         wrapping row become two rows of two on a narrow phone and one
         row of four on a wide one, without a media query. */
      className="min-w-[70px] flex-1 basis-[21%]"
    >
      {({ pressed }) => (
        <View className="items-center gap-1.5" style={{ opacity: pressed ? 0.6 : 1 }}>
          <View
            className={`h-[52px] w-full items-center justify-center rounded-medio ${TINTE[tono]}`}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d={ICONOS[icono]}
                stroke={TRAZO[tono]}
                strokeWidth={1.9}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          {/* Centred and small. The tile is the target; the word only
              confirms what the icon already suggested. */}
          <Texto estilo="apoyo" className="text-center">
            {nombre}
          </Texto>
        </View>
      )}
    </Pressable>
  );
}
