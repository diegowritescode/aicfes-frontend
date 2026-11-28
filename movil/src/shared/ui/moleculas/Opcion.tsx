import { Pressable, View } from 'react-native';
import type { ReactNode } from 'react';
import { sombra } from '../sombras';
import { Insignia, type EstadoInsignia } from '../atomos/Insignia';
import { Texto } from '../atomos/Texto';

/**
 * One answer option.
 *
 * Four states, and colour is never the only carrier: a learner who
 * cannot tell amber from green, or who is using a screen reader, gets
 * the same information from the accessible name.
 *
 * At rest it is just another white card. Colour enters only when the
 * state asks for it — the reference design keeps the screen quiet
 * until something has happened.
 *
 * The whole row is the touch target, 60pt tall. The web version's
 * rows were comfortable with a mouse; a thumb needs the room.
 */

export type EstadoOpcion = EstadoInsignia;

const MARCO: Record<EstadoOpcion, string> = {
  pendiente: 'bg-capa border-transparent',
  elegida: 'bg-acento-suave border-acento',
  correcta: 'bg-ganado-suave border-ganado',
  /* No tinted fill: the correct answer should win the eye, and two
     filled rows made the mistake louder than the right answer. */
  fallada: 'bg-capa border-fallo',
  apagada: 'bg-capa border-transparent opacity-[0.42]',
};

const DICHO: Record<EstadoOpcion, string> = {
  pendiente: '',
  elegida: 'seleccionada',
  correcta: 'correcta',
  fallada: 'tu respuesta, incorrecta',
  apagada: 'descartada',
};

export function Opcion({
  letra,
  children,
  estado = 'pendiente',
  alTocar,
}: {
  letra: string;
  children: ReactNode;
  estado?: EstadoOpcion;
  alTocar?: () => void;
}) {
  const respondida = estado !== 'pendiente' && estado !== 'elegida';
  const dicho = DICHO[estado];

  return (
    <Pressable
      onPress={alTocar}
      disabled={!alTocar || respondida}
      accessibilityRole="radio"
      accessibilityState={{ checked: estado === 'elegida' || estado === 'correcta' }}
      accessibilityLabel={`${letra}. ${children}${dicho ? `. ${dicho}` : ''}`}
      /* Only the shadow goes inline — it has no Tailwind equivalent
         on Android. The height stays in the className: mixing both
         let the style object win and the compiled background was
         dropped, which is how a button reached a phone invisible. */
      style={estado === 'apagada' ? undefined : sombra.tarjeta}
      className={`min-h-opcion flex-row items-center gap-[13px] rounded-medio border-[1.5px] px-[15px] py-3 ${MARCO[estado]}`}
    >
      <Insignia letra={letra} estado={estado} />
      <View className="flex-1">
        <Texto estilo="opcion">{children}</Texto>
      </View>
    </Pressable>
  );
}
