import { Pressable, Text, View } from 'react-native';
import { NOMBRE_AREA } from '@/shared/model/icfes';
import type { PuntoMapa } from '../model/reglas';

/**
 * One dot per question, tap to jump.
 *
 * The real sitting hands out a scratch sheet for exactly this, because
 * there is no fixed order to a 254-question exam: skip a subject,
 * start from the back, leave three for later. Without a map, a long
 * sitting is a corridor with no doors.
 *
 * What it never shows is whether an answer was right. In a sitting
 * that verdict does not exist yet, and a map that leaked it would turn
 * the exam into a quiz.
 */
export function MapaPreguntas({
  puntos,
  actual,
  onIr,
}: {
  puntos: readonly PuntoMapa[];
  actual: number;
  onIr: (orden: number) => void;
}) {
  const areas = [...new Map(puntos.map((p) => [p.area, true])).keys()];

  return (
    <View className="gap-4">
      {areas.map((area) => (
        <View key={area} className="gap-1.5">
          <Text className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {NOMBRE_AREA[area]}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {puntos
              .filter((p) => p.area === area)
              .map((p) => {
                const esActual = p.orden === actual;
                /* The state has to reach someone who cannot see colour
                   and someone using a screen reader, so it is in the
                   accessible name too — not only in the fill. */
                const etiqueta = [
                  `Pregunta ${p.orden + 1}`,
                  p.respondida ? 'respondida' : 'sin responder',
                  p.marcada ? 'marcada para revisar' : '',
                  esActual ? 'actual' : '',
                ]
                  .filter(Boolean)
                  .join(', ');

                return (
                  <Pressable
                    key={p.orden}
                    onPress={() => onIr(p.orden)}
                    accessibilityRole="button"
                    accessibilityLabel={etiqueta}
                    accessibilityState={{ selected: esActual }}
                    className={`h-11 w-11 items-center justify-center rounded-xl ${
                      p.respondida ? 'bg-brand-bright' : 'bg-slate-100'
                    } ${esActual ? 'border-2 border-slate-900' : ''}`}
                  >
                    <Text
                      className={`text-[13px] font-semibold ${
                        p.respondida ? 'text-white' : 'text-slate-500'
                      }`}
                    >
                      {p.orden + 1}
                    </Text>
                    {p.marcada ? (
                      <View className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border border-white bg-alerta" />
                    ) : null}
                  </Pressable>
                );
              })}
          </View>
        </View>
      ))}

      <View className="flex-row flex-wrap gap-x-5 gap-y-1.5">
        <Leyenda color="bg-brand-bright" texto="Respondida" />
        <Leyenda color="bg-slate-200" texto="Sin responder" />
        <Leyenda color="bg-alerta" texto="Para revisar" redonda />
      </View>
    </View>
  );
}

function Leyenda({ color, texto, redonda }: { color: string; texto: string; redonda?: boolean }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className={`h-3 w-3 ${redonda ? 'rounded-full' : 'rounded'} ${color}`} />
      <Text className="text-[12px] text-slate-500">{texto}</Text>
    </View>
  );
}
