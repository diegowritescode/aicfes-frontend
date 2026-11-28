import { Text, View } from 'react-native';
import type { ReactNode } from 'react';

/**
 * A short fact that is not touchable.
 *
 * Only the text colour changes by tone — the background stays the
 * same. Four coloured pills in a row was half the noise of the
 * palette we threw away.
 *
 * If it can be tapped it is not a Chip; it is a button.
 */

type Tono = 'neutro' | 'ganado' | 'fallo' | 'acento';

const TEXTO: Record<Tono, string> = {
  neutro: 'text-texto-apagado',
  /* Only for what the learner actually earned. */
  ganado: 'text-ganado',
  /* The count that went up by failing. Amber, never red. */
  fallo: 'text-fallo',
  acento: 'text-acento-texto',
};

export function Chip({
  children,
  tono = 'neutro',
}: {
  children: ReactNode;
  tono?: Tono;
}) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-pildora bg-capa-alta px-[11px] py-1.5">
      <Text style={{ fontFamily: 'Inter_600SemiBold' }} className={`text-[12px] ${TEXTO[tono]}`}>
        {children}
      </Text>
    </View>
  );
}
