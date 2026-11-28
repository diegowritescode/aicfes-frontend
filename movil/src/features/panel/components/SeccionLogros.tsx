import { Text, View } from 'react-native';
import type { Logro } from '../api/esquemas';
import { fraccion, ordenar, resumen } from '../model/logros';

/**
 * What the learner has earned, and what is within reach.
 *
 * Earned ones stay on the list rather than vanishing: they are the
 * evidence that the work added up, which is the only reason to show
 * any of this. They sit at the bottom because they are not what to do
 * next.
 *
 * Renders nothing when there is nothing to say. An empty "Logros"
 * heading is worse than no heading.
 */
export function SeccionLogros({ logros }: { logros: readonly Logro[] | null }) {
  if (!logros || logros.length === 0) return null;

  const { conseguidos, total } = resumen(logros);

  return (
    <View className="gap-3">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-[13px] font-bold uppercase tracking-widest text-texto-apagado">
          Logros
        </Text>
        <Text className="text-[12px] text-texto-apagado">
          {conseguidos} de {total}
        </Text>
      </View>

      {ordenar(logros).map((logro) => (
        <Fila key={logro.id} logro={logro} />
      ))}
    </View>
  );
}

function Fila({ logro }: { logro: Logro }) {
  const porcentaje = Math.round(fraccion(logro) * 100);

  return (
    <View
      className={`gap-2 rounded-2xl border p-4 ${
        logro.achieved ? 'border-ganado bg-ganado-suave' : 'border-linea bg-capa'
      }`}
      /* One label for the whole row: a screen reader should hear
         "Racha 7 días, 4 de 7" as one fact, not as four fragments. */
      accessible
      accessibilityLabel={
        logro.achieved
          ? `${logro.title}. Conseguido.`
          : `${logro.title}. ${logro.progress} de ${logro.target}.`
      }
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text
          className={`flex-1 text-[14.5px] font-semibold ${
            logro.achieved ? 'text-ganado' : 'text-texto'
          }`}
        >
          {logro.title}
        </Text>
        <Text
          className={`text-[12px] font-bold ${
            logro.achieved ? 'text-ganado' : 'text-texto-apagado'
          }`}
        >
          {logro.achieved ? 'Listo' : `${logro.progress}/${logro.target}`}
        </Text>
      </View>

      <Text className="text-[13px] leading-5 text-texto-apagado">{logro.description}</Text>

      {/* The bar is decoration over a number already stated above, so
          it is hidden from screen readers rather than read twice. */}
      {!logro.achieved ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="h-1.5 overflow-hidden rounded-full bg-capa-alta"
        >
          <View className="h-full rounded-full bg-borde-control" style={{ width: `${porcentaje}%` }} />
        </View>
      ) : null}
    </View>
  );
}
