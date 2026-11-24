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
    ? 'border-red-200 bg-red-50'
    : paso.concedido
      ? 'border-emerald-200 bg-emerald-50'
      : 'border-amber-200 bg-amber-50';

  const color = paso.bloqueadoPorElSistema
    ? 'text-red-700'
    : paso.concedido
      ? 'text-emerald-700'
      : 'text-amber-700';

  return (
    <View className={`gap-1 rounded-xl border px-3.5 py-2.5 ${estilo}`}>
      <View className="flex-row items-center gap-2">
        <Text className={`text-[13px] font-semibold ${color}`}>
          {paso.concedido ? '✓' : paso.bloqueadoPorElSistema ? '!' : '○'}
        </Text>
        <Text className="flex-1 text-[14px] font-semibold text-slate-800">
          {paso.nombre}
        </Text>
        {!paso.requerido ? (
          <Text className="text-[11px] text-slate-400">opcional</Text>
        ) : null}
      </View>

      {/* The reason is only shown while it is still missing: once
          granted it is noise, and a wall of explanations is what made
          the bench unreadable. */}
      {!paso.concedido ? (
        <Text className="text-[12.5px] leading-[18px] text-slate-600">
          {paso.bloqueadoPorElSistema
            ? 'Android lo bloquea en apps instaladas por fuera de Play. Abre Ajustes → Aplicaciones → AICFES → ⋮ → «Permitir ajustes restringidos», y vuelve.'
            : paso.porQue}
        </Text>
      ) : null}
    </View>
  );
}
