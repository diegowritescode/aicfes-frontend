import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { color } from '../tokens';

/**
 * The one button.
 *
 * `principal` appears once per screen — it is the reason the screen
 * exists. A second one beside it makes neither of them the answer.
 *
 * `ganado` is green and only for what the learner already earned:
 * claiming minutes, taking a streak. Never for moving forward, or the
 * colour stops meaning anything.
 *
 * Flat, with no pressed-in bottom edge. Duolingo's buttons sink by 4px
 * and it is half of why they feel physical, but beside the reference
 * design we validated it read as grubby, so it went.
 */

type Variante = 'principal' | 'ganado' | 'contorno' | 'plano';

/* `compacto` is for a button that sits INSIDE a row it does not own:
   the «Jugar» at the end of a duel row, «Aceptar» beside a request.
   40pt tall, which is below the 44 minimum on purpose — the whole row
   is the target in those layouts, and a 56pt button inside a 60pt
   card is the card. It is never the screen's primary action, so it
   never carries `principal` as the only way forward. */
type Tamano = 'normal' | 'compacto';

const ALTO: Record<Tamano, string> = {
  normal: 'min-h-boton px-6 text-[16px]',
  compacto: 'min-h-[40px] px-[18px] text-[14px]',
};

const FONDO: Record<Variante, string> = {
  principal: 'bg-acento',
  ganado: 'bg-ganado',
  contorno: 'bg-capa border-[1.5px] border-borde-control',
  plano: 'bg-transparent',
};

const TEXTO: Record<Variante, string> = {
  principal: 'text-sobre-acento',
  ganado: 'text-sobre-ganado',
  contorno: 'text-acento-texto',
  plano: 'text-texto-apagado',
};

/* A disabled button still has to be a visible button.

   `capa-alta` against `capa` measures 1,04:1. On the sign-in screen,
   which was white, the button the learner had to find was effectively
   not on the page until both fields were filled — they reported it as
   «el de entrar cuando te logras», after it had shipped.

   The fill cannot carry this on its own: it is deliberately quiet,
   because a disabled button that shouts is worse than one that waits.
   So the shape carries it instead.

   `borde-control` and not `linea`: `linea` measures 1,10:1 against
   `capa-alta`, which would make the edge exactly as invisible as the
   fill it is there to rescue. `borde-control` measures 3,2:1. The
   1,5px matches `contorno`, so the two states do not jump by half a
   pixel. `plano` is excluded — it has no fill to outline, and a border
   around what is really a text link reads as an enabled button. */
const INACTIVO = 'bg-capa-alta border-[1.5px] border-borde-control';

const GIRADOR: Record<Variante, string> = {
  principal: color.sobreAcento,
  ganado: color.sobreGanado,
  contorno: color.acentoTexto,
  plano: color.textoApagado,
};

export function Boton({
  children,
  alTocar,
  variante = 'principal',
  tamano = 'normal',
  cargando = false,
  deshabilitado = false,
  ancho = true,
  etiqueta,
}: {
  /** A verb: «Responder», «Cobrar 15 minutos». Never «OK». */
  children: ReactNode;
  alTocar: () => void;
  variante?: Variante;
  tamano?: Tamano;
  cargando?: boolean;
  deshabilitado?: boolean;
  /** Full width by default: that is how it appears on every screen. */
  ancho?: boolean;
  /** Overrides the accessible name when the label is not enough. */
  etiqueta?: string;
}) {
  /* A button that is working is not a button that is broken, but both
     must stop accepting taps — a double-submitted answer is a real
     bug, and the second tap is always an accident. */
  const inactivo = deshabilitado || cargando;

  return (
    <Pressable
      onPress={alTocar}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      /* The height goes in the className, not in a `style` object.
         Passing both let the inline style win and the compiled
         background was dropped: the button kept its touch area and
         turned invisible, which is how it reached a real phone. */
      className={[
        'flex-row items-center justify-center gap-2 rounded-medio',
        /* `plano` ignores `tamano`: it is a text link, so it takes the
           44pt floor and no horizontal padding to speak of. Sharing a
           row, even that padding is width the other button needs —
           24pt a side is 48pt of nothing, and it is what pushed
           «Volver a intentar» off the screen in the tutor. */
        variante === 'plano' ? (ancho ? 'min-h-toque px-6' : 'min-h-toque px-3') : ALTO[tamano],
        inactivo ? (variante === 'plano' ? 'bg-transparent' : INACTIVO) : FONDO[variante],
        /* A row button has to be able to give width back. Two of them
           side by side ask for their natural width, and the row does
           not shrink what has no `shrink`: «Volver a intentar» ran off
           the right edge of the tutor on a real phone, clipped
           mid-word. `w-full` already handles the full-width case, so
           the shrink only applies to the other one. */
        ancho ? 'w-full' : 'shrink',
      ].join(' ')}
    >
      {cargando ? <ActivityIndicator size="small" color={GIRADOR[variante]} /> : null}
      {/* The label shrinks with the button. Without this the text keeps
          its measured width and the padding is what gets clipped, so
          the button narrows and the word still runs past its edge. */}
      <View className="shrink">
        <Text
          /* Nunito 700 named outright: a family plus a weight does
             not resolve in React Native. */
          style={{ fontFamily: 'Nunito_700Bold' }}
          /* One line, always. A label that wraps turns a 56pt button
             into an 80pt one and breaks the row it sits in; truncating
             is the lesser failure, and the labels are short verbs. */
          numberOfLines={1}
          className={[
            tamano === 'compacto' && variante !== 'plano' ? 'text-[14px]' : 'text-[16px]',
            inactivo ? 'text-texto-apagado' : TEXTO[variante],
          ].join(' ')}
        >
          {children}
        </Text>
      </View>
    </Pressable>
  );
}
