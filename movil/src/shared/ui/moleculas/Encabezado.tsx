import { View } from 'react-native';
import type { ReactNode } from 'react';
import { Texto } from '../atomos/Texto';

/**
 * The line at the top of a question screen.
 *
 * Subject on the left as a small grey label, count on the right as a
 * chip. It repeats on every answering screen in the artifact — the
 * toll, the drill, the duel, the mock exam — and having it in one
 * place is what keeps the four from drifting apart by two pixels
 * each time one of them is touched.
 *
 * The subject is a `rotulo`, not a title: the learner already knows
 * what they opened. What they actually need from this row is the
 * right-hand side, how far along they are.
 */

export function Encabezado({
  rotulo,
  derecha,
}: {
  /** «Lectura crítica», «Instagram». Uppercased by the style. */
  rotulo: string;
  /** A `Chip`, usually. Left out when there is nothing to count. */
  derecha?: ReactNode;
}) {
  return (
    <View className="min-h-[28px] flex-row items-center justify-between">
      <Texto estilo="rotulo">{rotulo}</Texto>
      {derecha}
    </View>
  );
}
