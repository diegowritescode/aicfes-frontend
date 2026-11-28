import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, View } from 'react-native';
import { Texto } from '../atomos/Texto';

/**
 * The question's stimulus, born collapsed.
 *
 * ICFES items are not one-liners: the backend accepts up to 1200
 * characters of `contexto`, and a Lectura Crítica passage uses most
 * of them. Printed in full, the question and the four options end up
 * below the fold and the learner scrolls blind through a wall of
 * text before finding out what is being asked.
 *
 * So it opens at 132px — about six lines, enough to tell what the
 * text is about — and expanding is one deliberate tap. The fade at
 * the bottom is what says «there is more»; a hard cut reads as a
 * rendering bug.
 *
 * The stimulus sits on `capa-alta`, a different surface from the
 * question itself. That boundary is the whole point: it tells the eye
 * where the reading material ends and the task begins.
 */

/** How many characters are worth collapsing. Below this the fade and
    the extra tap cost more than the four lines they save. */
const UMBRAL = 320;

export function Contexto({ children }: { children: string }) {
  const largo = children.length > UMBRAL;
  const [abierto, setAbierto] = useState(!largo);

  /* Paragraphs come through as blank-line-separated text, the way
     the backend stores them. Rendering them as one block loses the
     structure a reading-comprehension item depends on. */
  const parrafos = children.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  return (
    <View>
      <View
        className="overflow-hidden rounded-[14px] bg-capa-alta px-[15px] py-[13px]"
        /* The collapsed height is a real clip, not a line count:
           `numberOfLines` would hide the fade behind an ellipsis and
           Android renders that ellipsis inconsistently across
           versions. */
        style={abierto ? undefined : { maxHeight: 132 }}
      >
        {parrafos.map((p, i) => (
          <Texto key={i} estilo="cuerpo" className={i > 0 ? 'mt-2.5' : ''}>
            {p.trim()}
          </Texto>
        ))}
      </View>

      {largo ? (
        <Pressable
          onPress={() => {
            /* Android only, and only the height: the fade is a
               gradient-free overlay, so animating opacity as well
               makes the text flicker through it on slower phones. */
            if (Platform.OS === 'android') {
              LayoutAnimation.configureNext({
                duration: 180,
                update: { type: 'easeInEaseOut', property: 'scaleY' },
              });
            }
            setAbierto((a) => !a);
          }}
          accessibilityRole="button"
          accessibilityState={{ expanded: abierto }}
          className="min-h-toque justify-center"
        >
          <Texto
            estilo="apoyo"
            style={{ fontFamily: 'Inter_700Bold' }}
            className="text-acento-texto"
          >
            {abierto ? 'Ver menos' : 'Ver todo el texto'}
          </Texto>
        </Pressable>
      ) : null}
    </View>
  );
}
