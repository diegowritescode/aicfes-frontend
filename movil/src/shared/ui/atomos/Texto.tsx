import { Text as TextoNativo, type TextProps } from 'react-native';
import type { ReactNode } from 'react';

/**
 * Text, with the hierarchy as a prop.
 *
 * The reference design we validated builds hierarchy out of size and
 * weight, never colour: «350» large and dark, «XP» small and grey.
 * Having the scale here instead of in class strings is what keeps a
 * screen from inventing a fifteenth size.
 *
 * `marca` is Nunito, for numbers and headings. Everything a learner
 * reads at length is Inter.
 */

type Estilo =
  | 'titulo-grande'
  | 'titulo'
  | 'cifra'
  | 'unidad'
  | 'pregunta'
  | 'cuerpo'
  | 'opcion'
  | 'apoyo'
  | 'rotulo';

/* Each style names the exact registered face instead of a family
   plus a weight. React Native resolves a font by its key, so
   `font-marca` with `font-bold` silently falls back to the system
   face — the bug that made the first redesign build look untouched.
   Sizes and line heights are the artifact's, to the pixel. */
const ESTILOS: Record<Estilo, string> = {
  'titulo-grande': 'text-[28px] leading-[34px] text-texto',
  titulo: 'text-[21px] leading-[27px] text-texto',
  cifra: 'text-[38px] leading-[42px] text-texto',
  unidad: 'text-[13px] text-texto-apagado',
  pregunta: 'text-[17px] leading-[25px] text-texto',
  cuerpo: 'text-[14px] leading-[21px] text-texto',
  opcion: 'text-[15px] leading-[22px] text-texto',
  apoyo: 'text-[13px] leading-[19px] text-texto-apagado',
  rotulo: 'text-[11px] leading-[16px] uppercase text-texto-apagado',
};

/** The registered face for each style, plus the letter-spacing the
    artifact uses — both have to be inline styles in React Native. */
const FUENTE: Record<Estilo, { fontFamily: string; letterSpacing?: number }> = {
  'titulo-grande': { fontFamily: 'Nunito_800ExtraBold', letterSpacing: -0.56 },
  titulo: { fontFamily: 'Nunito_800ExtraBold', letterSpacing: -0.38 },
  cifra: { fontFamily: 'Nunito_800ExtraBold', letterSpacing: -1.14 },
  unidad: { fontFamily: 'Inter_600SemiBold' },
  pregunta: { fontFamily: 'Inter_600SemiBold' },
  cuerpo: { fontFamily: 'Inter_400Regular' },
  opcion: { fontFamily: 'Inter_500Medium' },
  apoyo: { fontFamily: 'Inter_400Regular' },
  rotulo: { fontFamily: 'Inter_700Bold', letterSpacing: 0.77 },
};

export function Texto({
  children,
  estilo = 'cuerpo',
  className = '',
  style,
  ...resto
}: TextProps & { children: ReactNode; estilo?: Estilo; className?: string }) {
  return (
    <TextoNativo
      className={`${ESTILOS[estilo]} ${className}`}
      style={[FUENTE[estilo], style]}
      {...resto}
    >
      {children}
    </TextoNativo>
  );
}
