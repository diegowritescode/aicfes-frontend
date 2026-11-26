import { View } from 'react-native';
import type { ReactNode } from 'react';

/**
 * The answer button, pinned to the bottom.
 *
 * With a 1200-character stimulus and four options, the button lands
 * at the end of a screen and a half of scrolling. A button nobody
 * scrolls to is a button that does not exist — and on the toll, where
 * the learner is already annoyed at being interrupted, that is the
 * difference between answering and force-quitting.
 *
 * So it leaves the scroll view and sits outside it, which is what the
 * artifact's `position: sticky` amounts to on a phone. The top line
 * and the `fondo` fill are what separate it from the content sliding
 * underneath; without them the button floats over text and neither
 * reads.
 *
 * It belongs to the screen, not the scroll: put it as a sibling after
 * the `ScrollView`, never inside one.
 */

export function BarraRespuesta({ children }: { children: ReactNode }) {
  return (
    <View className="gap-2 border-t border-linea bg-fondo px-5 pb-4 pt-3">{children}</View>
  );
}
