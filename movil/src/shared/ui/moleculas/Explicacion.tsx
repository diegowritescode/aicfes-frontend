import { View } from 'react-native';
import type { ReactNode } from 'react';
import { Texto } from '../atomos/Texto';

/**
 * What appears after answering. The most important component here.
 *
 * Of everything measured for this product, informative feedback is
 * the only thing with a clear positive effect: d = +0,33. Gamified
 * rewards come in at g = 0,340 with a confidence interval that
 * includes zero, and fall to g = 0,01 in learners this age. That is
 * why this has a component of its own instead of being a paragraph
 * under the answer.
 *
 * Neutral surface with a thin coloured edge: the colour lives in the
 * title. A full amber block read as mud and drowned the text it was
 * supposed to carry.
 *
 * It never says «¡Muy bien!». It says what step was missed.
 */

export function Explicacion({
  acerto,
  children,
  titulo,
}: {
  acerto: boolean;
  children: ReactNode;
  /** Overrides «Esa es» / «No es esa». */
  titulo?: string;
}) {
  return (
    <View
      className={`rounded-[14px] bg-capa-alta px-[15px] py-[13px] border-l-[3px] ${
        acerto ? 'border-l-ganado' : 'border-l-fallo'
      }`}
      accessibilityRole="summary"
    >
      <Texto
        estilo="rotulo"
        style={{ fontFamily: 'Nunito_800ExtraBold', letterSpacing: 0 }}
        className={`mb-1 normal-case text-[13px] ${acerto ? 'text-ganado' : 'text-fallo'}`}
      >
        {titulo ?? (acerto ? 'Esa es' : 'No es esa')}
      </Texto>
      <Texto estilo="cuerpo">{children}</Texto>
    </View>
  );
}
