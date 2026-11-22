import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton } from '@/shared/ui/Boton';
import { Aviso } from '@/shared/ui/Aviso';
import type { Letra } from '@/shared/model/icfes';
import { ModalTutoria } from '@/features/tutoria/components/ModalTutoria';
import { useExamen } from '../hooks/useExamen';
import { debeAbrirTutoria, esCorrecta, explicacionDe } from '../model/reglas';
import { Enunciado } from './Enunciado';
import { OpcionRespuesta, type EstadoOpcion } from './OpcionRespuesta';

const LETRAS: readonly Letra[] = ['A', 'B', 'C', 'D'];

/**
 * Training: answer, find out immediately, and talk about it when it
 * went wrong.
 *
 * The opposite of a sitting on purpose. Here the verdict is the point:
 * the gap between "you failed" and "here is what you got wrong" is
 * where studying happens, and closing it while the mistake is still
 * warm is the whole reason this mode exists.
 */
export function PantallaExamen({
  examen,
  alTerminar,
}: {
  examen: ReturnType<typeof useExamen>;
  alTerminar: () => void;
}) {
  const [elegida, setElegida] = useState<Letra | null>(null);
  const [respondida, setRespondida] = useState(false);
  const [tutoriaAbierta, setTutoriaAbierta] = useState(false);

  const item = examen.item;
  if (!item) return null;

  const confirmar = () => {
    if (!elegida || respondida) return;
    examen.responder(elegida);
    setRespondida(true);
    /* The panel opens on a wrong answer, while the reasoning is still
       in the learner's head. Half an hour later they no longer
       remember what they were thinking on question 4. */
    if (debeAbrirTutoria(item, elegida)) setTutoriaAbierta(true);
  };

  const siguiente = () => {
    setElegida(null);
    setRespondida(false);
    if (examen.esUltima) {
      alTerminar();
      return;
    }
    examen.avanzar();
  };

  const estadoDe = (letra: Letra): EstadoOpcion => {
    if (!respondida) return elegida === letra ? 'elegida' : 'pendiente';
    if (letra === item.respuesta_correcta) return 'correcta';
    if (letra === elegida) return 'fallada';
    return 'descartada';
  };

  const acerto = respondida && elegida ? esCorrecta(item, elegida) : false;

  return (
    <SafeAreaView className="flex-1 bg-wash">
      <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
        <Text className="text-[13.5px] font-semibold text-slate-700">
          Pregunta {examen.indice + 1} de {examen.items.length}
        </Text>
        <Text className="text-[13px] text-slate-500">
          {examen.respuestas.filter((r) => r.isCorrect).length} correctas
        </Text>
      </View>

      <ScrollView contentContainerClassName="gap-5 px-5 py-6">
        <Enunciado item={item} />

        <View className="gap-2.5" accessibilityRole="radiogroup">
          {LETRAS.filter((l) => item.opciones[l]).map((letra) => (
            <OpcionRespuesta
              key={letra}
              letra={letra}
              texto={item.opciones[letra] ?? ''}
              estado={estadoDe(letra)}
              bloqueada={respondida}
              onElegir={() => setElegida(letra)}
            />
          ))}
        </View>

        {respondida ? (
          <View
            accessibilityLiveRegion="polite"
            className={`gap-2 rounded-2xl p-5 ${acerto ? 'bg-lime-50' : 'bg-white'}`}
          >
            <Text
              className={`text-[14px] font-bold ${acerto ? 'text-lime-800' : 'text-slate-800'}`}
            >
              {acerto ? 'Correcta' : 'Incorrecta'}
            </Text>
            <Text className="text-[13.5px] leading-6 text-slate-600">
              {elegida ? explicacionDe(item, elegida) : item.justificacion}
            </Text>
            {!acerto ? (
              <Boton variante="contorno" onPress={() => setTutoriaAbierta(true)}>
                No entiendo por qué
              </Boton>
            ) : null}
          </View>
        ) : null}

        {respondida ? (
          <Boton onPress={siguiente} tamano="grande" ancho>
            {examen.esUltima ? 'Ver resultados' : 'Siguiente'}
          </Boton>
        ) : (
          <Boton onPress={confirmar} deshabilitado={!elegida} tamano="grande" ancho>
            Responder
          </Boton>
        )}

        {examen.guardar.isError ? <Aviso mensaje={examen.guardar.error.mensaje} /> : null}
      </ScrollView>

      {elegida && !acerto ? (
        <ModalTutoria
          item={item}
          opcionElegida={elegida}
          visible={tutoriaAbierta}
          onSalir={() => setTutoriaAbierta(false)}
          onReintentar={() => {
            setTutoriaAbierta(false);
            /* The first answer stays recorded. What they knew before
               the explanation is the honest measure. */
            setRespondida(false);
            setElegida(null);
            examen.reintentar();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}
