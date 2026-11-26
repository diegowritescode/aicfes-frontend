import { Text, View } from 'react-native';
import type { PasoLegible } from '../model/permisos';

/**
 * One permission, as a chip.
 *
 * Replaces a log line that read `paso overlay: undetermined
 * (requerido)`. Green when granted, amber when still needed, and a
 * third state for the one Android refuses outright — which looks
 * identical to "not granted yet" in the raw status and needs
 * completely different instructions.
 */
export function ChipDePermiso({ paso }: { paso: PasoLegible }) {
  const estilo = paso.bloqueadoPorElSistema
    ? 'border-alerta bg-alerta-suave'
    : paso.concedido
      ? 'border-ganado bg-ganado-suave'
      : 'border-fallo bg-fallo-suave';

  const color = paso.bloqueadoPorElSistema
    ? 'text-alerta'
    : paso.concedido
      ? 'text-ganado'
      : 'text-fallo';

  return (
    <View className={`gap-1 rounded-xl border px-3.5 py-2.5 ${estilo}`}>
      <View className="flex-row items-center gap-2">
        <Text className={`text-[13px] font-semibold ${color}`}>
          {paso.concedido ? '✓' : paso.bloqueadoPorElSistema ? '!' : '○'}
        </Text>
        <Text className="flex-1 text-[14px] font-semibold text-texto">
          {paso.nombre}
        </Text>
        {!paso.requerido ? (
          <Text className="text-[11px] text-texto-apagado">opcional</Text>
        ) : null}
      </View>

      {/* The reason is only shown while it is still missing: once
          granted it is noise, and a wall of explanations is what made
          the bench unreadable. */}
      {!paso.concedido ? (
        <Text className="text-[12.5px] leading-[18px] text-texto-apagado">
          {paso.bloqueadoPorElSistema
            ? 'Android lo bloquea en apps instaladas por fuera de Play. Abre Ajustes → Aplicaciones → AICFES → ⋮ → «Permitir ajustes restringidos», y vuelve.'
            : paso.porQue}
        </Text>
      ) : null}
    </View>
  );
}
