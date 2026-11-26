import { Text, View } from 'react-native';
import type { DesgloseXp as Datos } from '../api/esquemas';

/**
 * Where the XP came from.
 *
 * Shown under the level, because that is the number it explains. The
 * point is not decoration: an unexplained total is a reward, and
 * rewards contingent on completing measure negative on intrinsic
 * motivation in this age group. The same number with its source is
 * informative feedback, which measures positive.
 *
 * It renders nothing when there is nothing to explain. A breakdown of
 * zero is noise.
 */
export function DesgloseXp({ datos }: { datos: Datos | null }) {
  const filas = (datos?.filas ?? []).filter((f) => f.xp > 0);
  if (filas.length === 0) return null;

  const total = filas.reduce((s, f) => s + f.xp, 0);

  return (
    <View className="gap-2.5 rounded-2xl border border-linea bg-capa p-4">
      <Text className="text-[12px] font-bold uppercase tracking-widest text-texto-apagado">
        De dónde viene tu XP
      </Text>

      {filas.map((fila) => {
        const parte = Math.round((fila.xp / total) * 100);
        return (
          <View
            key={fila.etiqueta}
            className="gap-1.5"
            accessible
            accessibilityLabel={`${fila.etiqueta}: ${fila.xp} XP, ${parte} por ciento`}
          >
            <View className="flex-row items-baseline justify-between gap-3">
              <Text className="flex-1 text-[13.5px] text-texto">{fila.etiqueta}</Text>
              <Text className="text-[13px] font-semibold text-texto">{fila.xp} XP</Text>
            </View>
            {/* Decoration over a number already stated, so hidden from
                screen readers rather than read twice. */}
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              className="h-1 overflow-hidden rounded-full bg-capa-alta"
            >
              <View
                className="h-full rounded-full bg-acento"
                style={{ width: `${parte}%` }}
              />
            </View>
          </View>
        );
      })}

      {/* The server decides whether a sentence is honest: it returns
          null when no source dominates, because "40% viene de X" with
          three sources at a third each is true of nothing. */}
      {datos?.frase ? (
        <Text className="text-[12.5px] leading-5 text-texto-apagado">{datos.frase}</Text>
      ) : null}
    </View>
  );
}
