import { Pressable, Text, View } from 'react-native';
import type { Letra } from '@/shared/model/icfes';

/**
 * One answer option.
 *
 * Four states, and the colour is never the only carrier: a learner who
 * cannot distinguish red from green, or who is using a screen reader,
 * gets the same information from the accessible name.
 *
 * The touch target is the whole row and at least 56pt tall. The web
 * version's rows were fine with a mouse; a thumb needs the room.
 */

export type EstadoOpcion = 'pendiente' | 'elegida' | 'correcta' | 'fallada' | 'descartada';

const MARCO: Record<EstadoOpcion, string> = {
  pendiente: 'border-slate-200 bg-white',
  elegida: 'border-brand-bright bg-brand-soft/40',
  correcta: 'border-exito bg-lime-50',
  fallada: 'border-error bg-rose-50',
  descartada: 'border-slate-200 bg-slate-50 opacity-60',
};

const INSIGNIA: Record<EstadoOpcion, string> = {
  pendiente: 'bg-slate-100',
  elegida: 'bg-brand-bright',
  correcta: 'bg-exito',
  fallada: 'bg-error',
  descartada: 'bg-slate-100',
};

const TEXTO_INSIGNIA: Record<EstadoOpcion, string> = {
  pendiente: 'text-slate-500',
  elegida: 'text-white',
  correcta: 'text-white',
  fallada: 'text-white',
  descartada: 'text-slate-400',
};

const DICHO: Record<EstadoOpcion, string> = {
  pendiente: '',
  elegida: 'seleccionada',
  correcta: 'correcta',
  fallada: 'tu respuesta, incorrecta',
  descartada: '',
};

export function OpcionRespuesta({
  letra,
  texto,
  estado,
  bloqueada,
  onElegir,
}: {
  letra: Letra;
  texto: string;
  estado: EstadoOpcion;
  bloqueada: boolean;
  onElegir: () => void;
}) {
  const dicho = DICHO[estado];

  return (
    <Pressable
      onPress={onElegir}
      disabled={bloqueada}
      accessibilityRole="radio"
      accessibilityState={{ checked: estado === 'elegida' || estado === 'fallada', disabled: bloqueada }}
      accessibilityLabel={`Opción ${letra}: ${texto}${dicho ? `, ${dicho}` : ''}`}
      className={`min-h-[56px] flex-row items-center gap-3 rounded-2xl border p-4 ${MARCO[estado]}`}
    >
      <View className={`h-8 w-8 items-center justify-center rounded-full ${INSIGNIA[estado]}`}>
        <Text className={`text-[13px] font-bold ${TEXTO_INSIGNIA[estado]}`}>{letra}</Text>
      </View>
      <Text className="flex-1 text-[14.5px] leading-6 text-slate-800">{texto}</Text>
    </Pressable>
  );
}
