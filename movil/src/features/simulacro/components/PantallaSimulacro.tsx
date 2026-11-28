import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BarraRespuesta,
  Boton,
  Chip,
  Contexto,
  Encabezado,
  Opcion,
  Progreso,
  Texto,
} from '@/shared/ui';
import { Aviso } from '@/shared/ui/Aviso';
import { NOMBRE_AREA, type Letra } from '@/shared/model/icfes';
import {
  useAccionesSimulacro,
  useRelojSimulacro,
  useSimulacro,
} from '../hooks/useSimulacro';
import { avanceDe, comoReloj, mapaDe, vaApurado } from '../model/reglas';
import { MapaPreguntas } from './MapaPreguntas';

const LETRAS: readonly Letra[] = ['A', 'B', 'C', 'D'];

/**
 * A sitting, run the way the real exam runs: free navigation, answers
 * that can change, and no verdict until it is handed in.
 *
 * Compare with the web version this replaces — nine useState and five
 * useEffect in one component, nearly all of it server state wearing a
 * local-state costume. Here the sitting is a query, the rules are
 * functions, and this file decides what the learner sees.
 *
 * Two bars hold the screen and the content scrolls between them: the
 * clock and the way out on top, the navigation at the bottom. Both
 * used to live inside the scroll view, so on a Lectura Crítica item
 * the learner had to scroll past the whole passage to reach
 * «Siguiente» — on every one of 254 questions.
 */
export function PantallaSimulacro({
  id,
  alTerminar,
}: {
  id: string;
  alTerminar: () => void;
}) {
  const { simulacro, cargando, fallo } = useSimulacro(id);
  const { responder, marcar, calificar } = useAccionesSimulacro(id);
  const segundos = useRelojSimulacro(simulacro?.segundosRestantes);

  const [actual, setActual] = useState(0);
  const [mapaAbierto, setMapaAbierto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const preguntas = simulacro?.preguntas ?? [];
  const puntos = useMemo(() => mapaDe(preguntas), [preguntas]);
  const avance = avanceDe(puntos);
  const pregunta = preguntas[actual];

  if (cargando) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-fondo">
        <Texto estilo="cuerpo" className="text-texto-apagado">
          Cargando el simulacro…
        </Texto>
      </SafeAreaView>
    );
  }

  if (fallo || !pregunta) {
    return (
      <SafeAreaView className="flex-1 justify-center bg-fondo px-6">
        <Aviso
          mensaje={fallo?.mensaje ?? 'Este simulacro no tiene preguntas.'}
          detalle={fallo?.detalle}
        />
        <View className="mt-4">
          <Boton variante="contorno" alTocar={alTerminar}>
            Volver
          </Boton>
        </View>
      </SafeAreaView>
    );
  }

  const apurado = vaApurado(segundos);

  const entregar = () => {
    calificar.mutate(undefined, { onSuccess: alTerminar });
  };

  return (
    <SafeAreaView className="flex-1 bg-fondo">
      {/* The clock and the way out stay pinned. On a 254-question
          sitting both have to be reachable from inside any stimulus,
          and the clock is the fact the sitting is about. */}
      <View className="flex-row items-center justify-between border-b border-linea bg-capa px-4 py-3">
        <View
          accessibilityLiveRegion={apurado ? 'polite' : 'none'}
          className="rounded-pildora bg-capa-alta px-3 py-1"
        >
          <Texto
            estilo="cuerpo"
            style={{ fontFamily: 'Nunito_700Bold' }}
            accessibilityLabel={`Tiempo restante ${comoReloj(segundos)}`}
            className={apurado ? 'text-fallo' : 'text-texto'}
          >
            {comoReloj(segundos)}
          </Texto>
        </View>

        <View className="flex-row items-center gap-2">
          <Boton variante="plano" ancho={false} alTocar={() => setMapaAbierto(true)}>
            Mapa
          </Boton>
          <Boton variante="contorno" ancho={false} alTocar={() => setConfirmando(true)}>
            Entregar
          </Boton>
        </View>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-5 py-5">
        <Encabezado
          rotulo={NOMBRE_AREA[pregunta.area]}
          derecha={
            <Chip tono="acento">
              {actual + 1} de {preguntas.length}
            </Chip>
          }
        />

        <Progreso
          hechas={avance.respondidas}
          total={avance.total}
          dicho={`${avance.respondidas} de ${avance.total} respondidas`}
        />

        <View className="flex-row justify-end">
          <Pressable
            onPress={() => marcar.mutate({ orden: pregunta.orden, marcada: !pregunta.marcada })}
            accessibilityRole="button"
            accessibilityState={{ selected: pregunta.marcada }}
            accessibilityLabel={
              pregunta.marcada ? 'Quitar la marca de revisar' : 'Marcar para revisar'
            }
            className={`min-h-toque justify-center rounded-pildora border-[1.5px] px-4 ${
              pregunta.marcada ? 'border-fallo bg-fallo-suave' : 'border-borde-control bg-capa'
            }`}
          >
            <Texto
              estilo="apoyo"
              style={{ fontFamily: 'Inter_600SemiBold' }}
              className={pregunta.marcada ? 'text-fallo' : 'text-texto-apagado'}
            >
              {pregunta.marcada ? 'Marcada' : 'Marcar'}
            </Texto>
          </Pressable>
        </View>

        {pregunta.contexto ? <Contexto>{pregunta.contexto}</Contexto> : null}

        <Texto estilo="pregunta">{pregunta.pregunta}</Texto>

        {/* No colour, no verdict: which option is right does not exist
            on this screen and will not until the sitting is graded.
            That is why every option is `pendiente` or `elegida` and
            never `correcta` — the resolved states would leak the
            answer key into a sitting. */}
        <View className="gap-[9px]" accessibilityRole="radiogroup">
          {LETRAS.filter((l) => pregunta.opciones[l]).map((letra) => (
            <Opcion
              key={letra}
              letra={letra}
              estado={pregunta.respuesta === letra ? 'elegida' : 'pendiente'}
              alTocar={() => responder.mutate({ orden: pregunta.orden, respuesta: letra })}
            >
              {pregunta.opciones[letra] ?? ''}
            </Opcion>
          ))}
        </View>
      </ScrollView>

      <BarraRespuesta>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Boton
              variante="contorno"
              alTocar={() => setActual((i) => Math.max(0, i - 1))}
              deshabilitado={actual === 0}
            >
              Anterior
            </Boton>
          </View>
          <View className="flex-1">
            <Boton
              alTocar={() => setActual((i) => Math.min(preguntas.length - 1, i + 1))}
              deshabilitado={actual === preguntas.length - 1}
            >
              Siguiente
            </Boton>
          </View>
        </View>
      </BarraRespuesta>

      <Modal visible={mapaAbierto} animationType="slide" onRequestClose={() => setMapaAbierto(false)}>
        <SafeAreaView className="flex-1 bg-capa">
          <View className="flex-row items-center justify-between border-b border-linea px-5 py-4">
            <Texto estilo="titulo">Mapa de preguntas</Texto>
            <Boton variante="plano" ancho={false} alTocar={() => setMapaAbierto(false)}>
              Cerrar
            </Boton>
          </View>
          <ScrollView contentContainerClassName="gap-4 px-5 py-5">
            <Texto estilo="apoyo">
              {avance.respondidas} de {avance.total} respondidas
              {avance.marcadas > 0 ? ` · ${avance.marcadas} para revisar` : ''}
            </Texto>
            <MapaPreguntas
              puntos={puntos}
              actual={actual}
              onIr={(orden) => {
                setActual(orden);
                setMapaAbierto(false);
              }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={confirmando} transparent animationType="fade" onRequestClose={() => setConfirmando(false)}>
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full max-w-sm gap-4 rounded-tarjeta bg-capa p-6">
            <Texto estilo="titulo">¿Entregar el simulacro?</Texto>
            <Texto estilo="cuerpo" className="text-texto-apagado">
              {avance.sinResponder > 0
                ? `Te quedan ${avance.sinResponder} preguntas sin responder. Las no respondidas cuentan como malas, igual que en el examen real.`
                : 'Respondiste todas. Al entregar ves tu calificación y el informe por área.'}
            </Texto>
            <View className="gap-2">
              <Boton alTocar={entregar} cargando={calificar.isPending}>
                Entregar y ver resultados
              </Boton>
              <Boton variante="plano" alTocar={() => setConfirmando(false)}>
                Seguir respondiendo
              </Boton>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
