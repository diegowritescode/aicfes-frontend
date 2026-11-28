import { useState } from 'react';
import { Pressable } from 'react-native';
import { Tarjeta } from './moleculas/Tarjeta';
import { Texto } from './atomos/Texto';

/**
 * Something went wrong, said once, where it happened.
 *
 * It announces itself to a screen reader: a learner who cannot see the
 * message would otherwise tap the button again and wonder why nothing
 * happens.
 *
 * `detalle` is the technical cause, hidden behind a tap. A phone has no
 * console, so without somewhere to put it a field report is just "sin
 * conexión" and the real error — a refused handshake, a DNS miss, our
 * own deadline firing — is lost. It stays collapsed because it is not
 * written for a learner; it is written for whoever has to fix it.
 */
export function Aviso({
  mensaje,
  tono = 'error',
  detalle,
}: {
  mensaje: string;
  tono?: 'error' | 'aviso';
  detalle?: string;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    /* A flat card, never a raised one. A raised card is something the
       learner acts on, and this is not: the thing to act on is the
       button that failed, which is still right beside it. Two raised
       surfaces stacked made neither of them the subject. */
    <Tarjeta
      variante="plana"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className={`gap-2 ${tono === 'error' ? 'border-l-[3px] border-l-fallo' : ''}`}
    >
      {/* `fallo`, not `alerta`. Amber says a request did not go
          through, which is what happened; red is reserved for work
          that can actually be lost, and a retry loses nothing. The
          coloured edge carries the tone instead of a tinted fill: a
          full amber block read as mud and drowned the text it was
          supposed to carry, the same finding `Explicacion` records. */}
      <Texto estilo="cuerpo" className={tono === 'error' ? 'text-fallo' : 'text-texto'}>
        {mensaje}
      </Texto>

      {detalle ? (
        <>
          <Pressable
            onPress={() => setAbierto((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={abierto ? 'Ocultar detalle técnico' : 'Ver detalle técnico'}
            accessibilityState={{ expanded: abierto }}
            hitSlop={8}
          >
            <Texto estilo="rotulo">
              {abierto ? 'Ocultar detalle' : 'Ver detalle'}
            </Texto>
          </Pressable>

          {abierto ? (
            /* Muted, and selectable so it can be copied into a bug
               report. It is the quietest thing on the card because
               the learner is not its reader. */
            <Texto estilo="apoyo" selectable>
              {detalle}
            </Texto>
          ) : null}
        </>
      ) : null}
    </Tarjeta>
  );
}
