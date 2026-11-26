import { Text, View } from 'react-native';

/**
 * The letter badge on an answer option: A, B, C, D.
 *
 * The correct answer gets a filled badge and a wrong one only an
 * outline. With both filled, amber outweighed green on screen and the
 * eye went to the mistake first — backwards from what the screen has
 * to say.
 *
 * Colour is never the only carrier here: the letter itself and the
 * option's accessible name say the same thing.
 */

type Estado = 'pendiente' | 'elegida' | 'correcta' | 'fallada' | 'apagada';

const MARCO: Record<Estado, string> = {
  pendiente: 'bg-capa-alta',
  elegida: 'bg-acento',
  correcta: 'bg-ganado',
  fallada: 'bg-transparent border-2 border-fallo',
  apagada: 'bg-capa-alta',
};

const TEXTO: Record<Estado, string> = {
  pendiente: 'text-texto-apagado',
  elegida: 'text-sobre-acento',
  correcta: 'text-sobre-ganado',
  fallada: 'text-fallo',
  apagada: 'text-texto-apagado',
};

export function Insignia({ letra, estado = 'pendiente' }: { letra: string; estado?: Estado }) {
  return (
    <View
      className={`h-[29px] w-[29px] items-center justify-center rounded-[9px] ${MARCO[estado]}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={{ fontFamily: 'Nunito_700Bold' }} className={`text-[13px] ${TEXTO[estado]}`}>
        {letra}
      </Text>
    </View>
  );
}

export type EstadoInsignia = Estado;
