import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton } from '@/shared/ui/Boton';
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
      <SafeAreaView className="flex-1 items-center justify-center bg-wash">
        <Text className="text-[14px] text-slate-500">Cargando el simulacro…</Text>
      </SafeAreaView>
    );
  }

  if (fallo || !pregunta) {
    return (
      <SafeAreaView className="flex-1 justify-center bg-wash px-6">
        <Aviso
          mensaje={fallo?.mensaje ?? 'Este simulacro no tiene preguntas.'}
          detalle={fallo?.detalle}
        />
        <View className="mt-4">
          <Boton variante="contorno" onPress={alTerminar}>
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
    <SafeAreaView className="flex-1 bg-wash">
      <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <Text className="text-[13.5px] font-semibold text-slate-700">
          {actual + 1} de {preguntas.length}
        </Text>

        <View
          accessibilityLiveRegion={apurado ? 'polite' : 'none'}
          className={`rounded-full px-3 py-1 ${apurado ? 'bg-rose-50' : 'bg-slate-100'}`}
        >
          <Text
            accessibilityLabel={`Tiempo restante ${comoReloj(segundos)}`}
            className={`text-[14px] font-bold ${apurado ? 'text-rose-700' : 'text-slate-700'}`}
          >
            {comoReloj(segundos)}
          </Text>
        </View>

        <View className="flex-row gap-2">
          <Boton variante="suave" onPress={() => setMapaAbierto(true)}>
            Mapa
          </Boton>
          <Boton onPress={() => setConfirmando(true)}>Entregar</Boton>
        </View>
      </View>

      <ScrollView contentContainerClassName="gap-5 px-5 py-6">
        <View className="flex-row items-center justify-between">
          <Text className="text-[11.5px] font-bold uppercase tracking-widest text-brand-bright">
            {NOMBRE_AREA[pregunta.area]}
          </Text>
          <Pressable
            onPress={() => marcar.mutate({ orden: pregunta.orden, marcada: !pregunta.marcada })}
            accessibilityRole="button"
            accessibilityState={{ selected: pregunta.marcada }}
            accessibilityLabel={
              pregunta.marcada ? 'Quitar la marca de revisar' : 'Marcar para revisar'
            }
            className={`min-h-[40px] justify-center rounded-full border px-4 ${
              pregunta.marcada ? 'border-alerta bg-amber-50' : 'border-slate-200 bg-white'
            }`}
          >
            <Text
              className={`text-[12.5px] font-semibold ${
                pregunta.marcada ? 'text-amber-700' : 'text-slate-500'
              }`}
            >
              {pregunta.marcada ? 'Marcada' : 'Marcar'}
            </Text>
          </Pressable>
        </View>

        {pregunta.contexto ? (
          <View className="rounded-2xl bg-white p-5">
            <Text className="text-[14.5px] leading-7 text-slate-700">{pregunta.contexto}</Text>
          </View>
        ) : null}

        <Text className="text-[17px] font-semibold leading-7 text-slate-900">
          {pregunta.pregunta}
        </Text>

        {/* No colour, no verdict: which option is right does not exist
            on this screen and will not until the sitting is graded. */}
        <View className="gap-2.5">
          {LETRAS.filter((l) => pregunta.opciones[l]).map((letra) => {
            const elegida = pregunta.respuesta === letra;
            return (
              <Pressable
                key={letra}
                onPress={() => responder.mutate({ orden: pregunta.orden, respuesta: letra })}
                accessibilityRole="radio"
                accessibilityState={{ checked: elegida }}
                accessibilityLabel={`Opción ${letra}: ${pregunta.opciones[letra]}`}
                className={`min-h-[56px] flex-row items-center gap-3 rounded-2xl border p-4 ${
                  elegida ? 'border-brand-bright bg-brand-soft/40' : 'border-slate-200 bg-white'
                }`}
              >
                <View
                  className={`h-8 w-8 items-center justify-center rounded-full ${
                    elegida ? 'bg-brand-bright' : 'bg-slate-100'
                  }`}
                >
                  <Text
                    className={`text-[13px] font-bold ${
                      elegida ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    {letra}
                  </Text>
                </View>
                <Text className="flex-1 text-[14.5px] leading-6 text-slate-800">
                  {pregunta.opciones[letra]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="flex-row justify-between gap-3 border-t border-slate-200 pt-5">
          <Boton
            variante="contorno"
            onPress={() => setActual((i) => Math.max(0, i - 1))}
            deshabilitado={actual === 0}
          >
            Anterior
          </Boton>
          <Boton
            onPress={() => setActual((i) => Math.min(preguntas.length - 1, i + 1))}
            deshabilitado={actual === preguntas.length - 1}
          >
            Siguiente
          </Boton>
        </View>
      </ScrollView>

      <Modal visible={mapaAbierto} animationType="slide" onRequestClose={() => setMapaAbierto(false)}>
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between border-b border-slate-200 px-5 py-4">
            <Text className="text-[17px] font-bold text-slate-900">Mapa de preguntas</Text>
            <Boton variante="suave" onPress={() => setMapaAbierto(false)}>
              Cerrar
            </Boton>
          </View>
          <ScrollView contentContainerClassName="gap-4 px-5 py-5">
            <Text className="text-[13.5px] text-slate-600">
              {avance.respondidas} de {avance.total} respondidas
              {avance.marcadas > 0 ? ` · ${avance.marcadas} para revisar` : ''}
            </Text>
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
        <View className="flex-1 items-center justify-center bg-slate-900/40 px-6">
          <View className="w-full max-w-sm gap-4 rounded-3xl bg-white p-6">
            <Text className="text-[17px] font-bold text-slate-900">¿Entregar el simulacro?</Text>
            <Text className="text-[14px] leading-6 text-slate-600">
              {avance.sinResponder > 0
                ? `Le quedan ${avance.sinResponder} preguntas sin responder. Las no respondidas cuentan como malas, igual que en el examen real.`
                : 'Respondiste todas. Al entregar ves tu calificación y el informe por área.'}
            </Text>
            <View className="gap-2">
              <Boton onPress={entregar} cargando={calificar.isPending} ancho>
                Entregar y ver resultados
              </Boton>
              <Boton variante="suave" onPress={() => setConfirmando(false)} ancho>
                Seguir respondiendo
              </Boton>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
