import { View } from 'react-native';
import { Texto } from '../atomos/Texto';

/**
 * How many questions in, and how they went.
 *
 * One continuous bar with the count beside it, not separate squares:
 * the toll's surcharge adds questions as you fail, and a bar can grow
 * where a fixed row of squares cannot.
 *
 * The amber tail is that surcharge. Watching the bar get longer is
 * what communicates the cost of a wrong answer without one word of
 * reproach — the screen never says «fallaste».
 *
 * It never shrinks. What was earned stays earned.
 */

export function Progreso({
  hechas,
  total,
  recargo = 0,
  dicho,
}: {
  hechas: number;
  total: number;
  /** How many of `total` were added by failing. */
  recargo?: number;
  /** Accessible name. A bar alone says nothing to someone who cannot see it. */
  dicho?: string;
}) {
  const base = Math.max(0, total - recargo);
  const hechasBase = Math.min(hechas, base);
  const pct = (n: number) => (total > 0 ? (100 * n) / total : 0);

  return (
    <View className="flex-row items-center gap-2.5">
      <Texto estilo="apoyo" style={{ fontFamily: 'Inter_700Bold' }} className="text-[12px]">
        {hechas}/{total}
      </Texto>
      <View
        className="h-[9px] flex-1 flex-row overflow-hidden rounded-pildora bg-capa-alta"
        accessibilityRole="progressbar"
        accessibilityLabel={dicho ?? `Pregunta ${Math.min(hechas + 1, total)} de ${total}`}
        accessibilityValue={{ min: 0, max: total, now: hechas }}
      >
        {/* Three segments in order: done, still to go, and the
            surcharge at the END. Painting the surcharge straight
            after the progress put amber at the start of an untouched
            bar, which reads as «you already failed» before the
            learner has answered anything. */}
        <View className="h-full bg-acento" style={{ width: `${pct(hechasBase)}%` }} />
        <View className="h-full" style={{ width: `${pct(base - hechasBase)}%` }} />
        {recargo > 0 ? (
          /* Dim until the learner actually reaches it: the extra
             questions exist, but they are not progress yet. */
          <View
            className="h-full bg-fallo"
            style={{ width: `${pct(recargo)}%`, opacity: hechas > base ? 1 : 0.4 }}
          />
        ) : null}
      </View>
    </View>
  );
}
