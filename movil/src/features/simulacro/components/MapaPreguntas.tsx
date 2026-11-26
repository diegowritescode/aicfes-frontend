import { Pressable, View } from 'react-native';
import { Texto } from '@/shared/ui';
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
          <Texto estilo="rotulo">{NOMBRE_AREA[area]}</Texto>
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
                    className={`h-11 w-11 items-center justify-center rounded-chico ${
                      p.respondida ? 'bg-acento' : 'bg-capa-alta'
                    } ${esActual ? 'border-2 border-acento' : ''}`}
                  >
                    <Texto
                      estilo="apoyo"
                      style={{ fontFamily: 'Inter_600SemiBold' }}
                      className={p.respondida ? 'text-sobre-acento' : 'text-texto-apagado'}
                    >
                      {p.orden + 1}
                    </Texto>
                    {p.marcada ? (
                      /* Ringed in `capa` so the dot reads against both
                         fills: on the accent square a bare amber dot
                         disappeared into the purple. */
                      <View className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-pildora border border-capa bg-fallo" />
                    ) : null}
                  </Pressable>
                );
              })}
          </View>
        </View>
      ))}

      <View className="flex-row flex-wrap gap-x-5 gap-y-1.5">
        <Leyenda color="bg-acento" texto="Respondida" />
        <Leyenda color="bg-capa-alta" texto="Sin responder" />
        <Leyenda color="bg-fallo" texto="Para revisar" redonda />
      </View>
    </View>
  );
}

function Leyenda({ color, texto, redonda }: { color: string; texto: string; redonda?: boolean }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className={`h-3 w-3 ${redonda ? 'rounded-pildora' : 'rounded'} ${color}`} />
      <Texto estilo="apoyo">{texto}</Texto>
    </View>
  );
}
