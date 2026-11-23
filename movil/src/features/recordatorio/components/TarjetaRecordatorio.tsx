import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Boton } from '@/shared/ui/Boton';
import { legible, recordatorioDeHoy } from '../model/mensaje';
import type { TemaParaHoy } from '../model/mensaje';

/**
 * Turning the daily reminder on, and seeing what it will say.
 *
 * The preview is the point of showing anything here. A learner
 * deciding whether to let an app notify them should see the actual
 * message, not a promise — and this one is about their weakest topic
 * rather than about a streak, which is worth seeing before agreeing.
 */

const HORAS = [15, 17, 19, 21] as const;

export function TarjetaRecordatorio({
  activo,
  hora,
  permiso,
  temaDeHoy,
  onActivar,
  onCancelar,
}: {
  activo: boolean;
  hora: number;
  permiso: 'concedido' | 'negado' | 'sin-pedir';
  temaDeHoy: TemaParaHoy | null;
  onActivar: (hora: number) => void;
  onCancelar: () => void;
}) {
  const [eligiendo, setEligiendo] = useState(false);
  const previo = recordatorioDeHoy(temaDeHoy, 0);

  if (activo) {
    return (
      <View className="gap-3 rounded-2xl border border-slate-200 bg-white p-5">
        <View className="gap-1">
          <Text className="text-[14.5px] font-semibold text-slate-900">
            Te avisamos a las {hora}:00
          </Text>
          <Text className="text-[13px] leading-5 text-slate-500">
            {temaDeHoy
              ? `Hoy sería sobre ${legible(temaDeHoy.tema)}.`
              : 'Cuando tengamos de qué, te decimos el tema.'}
          </Text>
        </View>
        <Pressable onPress={onCancelar} hitSlop={8}>
          <Text className="text-[12.5px] font-semibold uppercase tracking-wide text-slate-400">
            Quitar el recordatorio
          </Text>
        </Pressable>
      </View>
    );
  }

  /* Denied is its own state, because the app cannot ask again on iOS
     and pretending otherwise leaves the learner tapping a button that
     does nothing. */
  if (permiso === 'negado') {
    return (
      <View className="gap-2 rounded-2xl border border-slate-200 bg-white p-5">
        <Text className="text-[14.5px] font-semibold text-slate-900">
          Las notificaciones están apagadas
        </Text>
        <Text className="text-[13px] leading-5 text-slate-500">
          Se activan en los ajustes del teléfono. Desde aquí ya no podemos
          volver a preguntarte.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-3 rounded-2xl border border-slate-200 bg-white p-5">
      <View className="gap-1">
        <Text className="text-[14.5px] font-semibold text-slate-900">
          Un recordatorio al día
        </Text>
        <Text className="text-[13px] leading-5 text-slate-500">
          Te decimos qué tema te toca. Nada de rachas ni de presión.
        </Text>
      </View>

      {/* What it will actually say. */}
      <View className="gap-0.5 rounded-xl bg-slate-50 px-3.5 py-3">
        <Text className="text-[13px] font-semibold text-slate-700">{previo.titulo}</Text>
        <Text className="text-[12.5px] leading-5 text-slate-500">{previo.cuerpo}</Text>
      </View>

      {eligiendo ? (
        <View className="gap-2">
          <Text className="text-[12.5px] font-semibold uppercase tracking-wide text-slate-400">
            ¿A qué hora?
          </Text>
          <View className="flex-row gap-2">
            {HORAS.map((h) => (
              <Pressable
                key={h}
                onPress={() => onActivar(h)}
                accessibilityRole="button"
                accessibilityLabel={`Avisarme a las ${h}:00`}
                className="flex-1 items-center rounded-xl border border-slate-200 py-2.5"
              >
                <Text className="text-[14px] font-semibold text-slate-800">{h}:00</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <Boton onPress={() => setEligiendo(true)} ancho>
          Activar
        </Boton>
      )}
    </View>
  );
}
