import { View } from 'react-native';
import { Texto } from '../atomos/Texto';

/**
 * A number that matters, with its unit beside it.
 *
 * 38px Nunito ExtraBold against a 13px grey label: the whole
 * hierarchy is size and weight, so the unit can sit inline without
 * competing. «15 MINUTOS», «4 CONTRA 3», «8 MIN EN INSTAGRAM».
 *
 * `tono` exists because two of these are about something earned —
 * minutes won, a duel won — and green is reserved for exactly that.
 * Everything else leaves the figure in `texto`; a coloured number
 * that was not earned spends the one signal the palette has.
 *
 * Read as one phrase by a screen reader, not as a digit followed by a
 * shouted word: «15 minutos», not «15» then «MINUTOS».
 */

type Tono = 'texto' | 'ganado' | 'acento';

const COLOR: Record<Tono, string> = {
  texto: 'text-texto',
  ganado: 'text-ganado',
  acento: 'text-acento-texto',
};

export function Cifra({
  valor,
  unidad,
  tono = 'texto',
}: {
  valor: string | number;
  /** Written as it should be read. It is uppercased by the style. */
  unidad: string;
  tono?: Tono;
}) {
  return (
    <View
      className="flex-row items-baseline"
      accessibilityRole="text"
      accessibilityLabel={`${valor} ${unidad}`}
    >
      <Texto estilo="cifra" className={COLOR[tono]}>
        {valor}
      </Texto>
      {/* Uppercase and the 6px gap come from the artifact. The label
          is not `rotulo`: that style tracks wider, which at this size
          pulls the unit away from the number it belongs to. */}
      <Texto
        estilo="unidad"
        style={{ fontFamily: 'Inter_600SemiBold' }}
        className="ml-1.5 uppercase"
      >
        {unidad}
      </Texto>
    </View>
  );
}
