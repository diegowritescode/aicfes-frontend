import { View } from 'react-native';
import { Texto } from '@/shared/ui';
import { colorDe, inicialesDe } from '../model/avatar';

/**
 * Who someone is, at a glance.
 *
 * Initials on a colour the alias decides. No network, no upload, no
 * third party holding a list of minors' names — see `model/avatar.ts`
 * for why that mattered more than nicer pictures.
 */

const TAMANOS = {
  chico: { caja: 32, texto: 13 },
  mediano: { caja: 44, texto: 17 },
  grande: { caja: 72, texto: 28 },
} as const;

export function Avatar({
  alias,
  tamano = 'mediano',
}: {
  alias: string | null | undefined;
  tamano?: keyof typeof TAMANOS;
}) {
  const { caja, texto } = TAMANOS[tamano];

  return (
    <View
      /* Inline style, not className: the colour is computed per alias
         and NativeWind compiles class names ahead of time, so a
         `bg-[${color}]` would not exist in the stylesheet. This
         codebase has shipped that bug before. */
      style={{
        width: caja,
        height: caja,
        borderRadius: caja / 2,
        backgroundColor: colorDe(alias),
        alignItems: 'center',
        justifyContent: 'center',
      }}
      /* One label for the circle rather than a letter a screen reader
         would read on its own: «C» tells nobody anything. */
      accessible
      accessibilityRole="image"
      accessibilityLabel={alias ? `Avatar de ${alias}` : 'Sin nombre todavía'}
    >
      <Texto
        estilo="cuerpo"
        style={{
          color: '#FFFFFF',
          fontSize: texto,
          lineHeight: texto + 2,
          fontFamily: 'Nunito_800ExtraBold',
        }}
      >
        {inicialesDe(alias)}
      </Texto>
    </View>
  );
}
