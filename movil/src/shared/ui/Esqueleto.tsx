import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

/**
 * The shape of what is loading, instead of a spinner.
 *
 * A spinner says "wait" and nothing else. A skeleton says what is
 * coming and how much of it, which is the difference between a wait
 * that feels broken and one that feels like progress — and this app
 * has routes that legitimately take minutes.
 *
 * The pulse is deliberately slow and shallow. A fast, high-contrast
 * blink is what makes a loading screen feel anxious, and this audience
 * is already anxious about the exam.
 */

function usePulso() {
  const valor = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const ciclo = Animated.loop(
      Animated.sequence([
        Animated.timing(valor, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(valor, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ]),
    );
    ciclo.start();
    /* Stopped on unmount: an animation left running on a screen nobody
       is looking at keeps the JS thread busy for no reason. */
    return () => ciclo.stop();
  }, [valor]);

  return valor;
}

/** One grey block. Width as a Tailwind class so callers compose it. */
export function Bloque({
  alto = 'h-4',
  ancho = 'w-full',
  redondeo = 'rounded-lg',
}: {
  alto?: string;
  ancho?: string;
  redondeo?: string;
}) {
  const opacidad = usePulso();
  return (
    <Animated.View
      style={{ opacity: opacidad }}
      className={`bg-slate-200 ${alto} ${ancho} ${redondeo}`}
    />
  );
}

/**
 * A question, as it will appear.
 *
 * Matching the real layout matters: a skeleton of the wrong shape
 * makes the content jump when it arrives, which is worse than no
 * skeleton at all.
 */
export function EsqueletoPregunta() {
  return (
    <View
      className="gap-5"
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando la pregunta"
    >
      <View className="gap-2">
        <Bloque alto="h-3" ancho="w-32" />
        <Bloque alto="h-4" ancho="w-48" />
      </View>

      <View className="gap-2 rounded-2xl border border-slate-100 bg-white p-4">
        <Bloque alto="h-3.5" />
        <Bloque alto="h-3.5" />
        <Bloque alto="h-3.5" ancho="w-2/3" />
      </View>

      <View className="gap-2.5">
        {[0, 1, 2, 3].map((i) => (
          <Bloque key={i} alto="h-14" redondeo="rounded-2xl" />
        ))}
      </View>
    </View>
  );
}

/** The dashboard: level, streak, and the sections under them. */
export function EsqueletoPanel() {
  return (
    <View
      className="gap-5"
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando tu progreso"
    >
      <View className="flex-row gap-3">
        <View className="flex-1 gap-2 rounded-2xl border border-slate-100 bg-white p-4">
          <Bloque alto="h-3" ancho="w-16" />
          <Bloque alto="h-7" ancho="w-12" />
        </View>
        <View className="flex-1 gap-2 rounded-2xl border border-slate-100 bg-white p-4">
          <Bloque alto="h-3" ancho="w-16" />
          <Bloque alto="h-7" ancho="w-12" />
        </View>
      </View>

      <View className="gap-2">
        <Bloque alto="h-3" ancho="w-40" />
        {[0, 1, 2].map((i) => (
          <Bloque key={i} alto="h-16" redondeo="rounded-2xl" />
        ))}
      </View>
    </View>
  );
}

/** A list of cards, as in the review screen. */
export function EsqueletoLista({ filas = 4 }: { filas?: number }) {
  return (
    <View className="gap-2.5" accessibilityRole="progressbar" accessibilityLabel="Cargando">
      {Array.from({ length: filas }, (_, i) => (
        <Bloque key={i} alto="h-20" redondeo="rounded-2xl" />
      ))}
    </View>
  );
}
