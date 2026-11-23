import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Boton } from '@/shared/ui/Boton';
import { Aviso } from '@/shared/ui/Aviso';
import { NOMBRE_AREA, type Letra } from '@/shared/model/icfes';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import {
  useContrarrelojRun,
  useModosContrarreloj,
} from '@/features/contrarreloj/hooks/useContrarreloj';
import { comoReloj, vaApurado } from '@/features/simulacro/model/reglas';
import { Enunciado } from '@/shared/pregunta/components/Enunciado';
import { OpcionRespuesta } from '@/shared/pregunta/components/OpcionRespuesta';

const LETRAS: readonly Letra[] = ['A', 'B', 'C', 'D'];

/**
 * Against the clock.
 *
 * The ladder exists because a single speed teaches one pace. The real
 * exam is 254 questions in 270 minutes — 64 seconds each — and a mode
 * that gives 30 is not "hard mode", it is a different skill. Each rung
 * says what it is training.
 */
export default function RutaContrarreloj() {
  const router = useRouter();
  const { cargando: cargandoSesion, autenticado } = useSesion();
  const { modos, fallo } = useModosContrarreloj();
  const run = useContrarrelojRun();

  const [elegida, setElegida] = useState<Letra | null>(null);

  const terminar = useCallback(() => run.terminar(), [run]);
  const segundos = run.segundos;

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  if (run.estado === 'terminado') {
    return (
      <SafeAreaView className="flex-1 bg-wash">
        <ScrollView contentContainerClassName="gap-6 px-5 py-10">
          <View className="gap-1.5">
            <Text className="text-[12px] font-bold uppercase tracking-widest text-slate-400">
              Contrarreloj terminado
            </Text>
            <Text className="text-[32px] font-bold text-slate-900">
              {run.correctas} de {run.respondidas}
            </Text>
            <Text className="text-[15px] text-slate-600">
              {run.seAcaboElTiempo
                ? 'Se acabó el tiempo. Así es el examen real.'
                : 'Respondiste todas a tiempo.'}
            </Text>
          </View>
          <Boton onPress={() => router.replace('/inicio')} ancho>
            Volver al inicio
          </Boton>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (run.estado === 'corriendo' && run.item) {
    const item = run.item;
    const apurado = vaApurado(segundos);

    return (
      <SafeAreaView className="flex-1 bg-wash">
        <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <Text className="text-[13.5px] font-semibold text-slate-700">
            {run.indice + 1} de {run.items.length}
          </Text>
          <View
            accessibilityLiveRegion={apurado ? 'polite' : 'none'}
            className={`rounded-full px-3 py-1 ${apurado ? 'bg-rose-50' : 'bg-slate-100'}`}
          >
            <Text
              accessibilityLabel={`Tiempo restante ${comoReloj(segundos)}`}
              className={`text-[15px] font-bold ${apurado ? 'text-rose-700' : 'text-slate-700'}`}
            >
              {comoReloj(segundos)}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerClassName="gap-5 px-5 py-6">
          <Enunciado item={item} />

          <View className="gap-2.5" accessibilityRole="radiogroup">
            {LETRAS.filter((l) => item.opciones[l]).map((letra) => (
              <OpcionRespuesta
                key={letra}
                letra={letra}
                texto={item.opciones[letra] ?? ''}
                estado={elegida === letra ? 'elegida' : 'pendiente'}
                bloqueada={false}
                onElegir={() => setElegida(letra)}
              />
            ))}
          </View>

          {/* No verdict between questions: stopping to read an
              explanation is the opposite of what this mode trains. */}
          <Boton
            onPress={() => {
              if (!elegida) return;
              run.responder(elegida);
              setElegida(null);
            }}
            deshabilitado={!elegida}
            tamano="grande"
            ancho
          >
            {run.indice === run.items.length - 1 ? 'Terminar' : 'Siguiente'}
          </Boton>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-wash">
      <ScrollView contentContainerClassName="gap-5 px-5 py-8">
        <View className="gap-2">
          <Text className="text-[26px] font-bold tracking-tight text-slate-900">
            Contrarreloj
          </Text>
          <Text className="text-[14.5px] leading-6 text-slate-600">
            En el examen real tienes 64 segundos por pregunta. Sube la escalera a tu ritmo.
          </Text>
        </View>

        {fallo ? <Aviso mensaje={fallo.mensaje} detalle={fallo.detalle} /> : null}
        {run.fallo ? <Aviso mensaje={run.fallo.mensaje} detalle={run.fallo.detalle} /> : null}

        {modos.map((m) => (
          <View key={m.id} className="gap-2 rounded-2xl border border-slate-200 bg-white p-5">
            <View className="flex-row items-baseline justify-between">
              <Text className="text-[16px] font-bold text-slate-900">{m.title}</Text>
              <Text className="text-[12px] font-semibold text-slate-400">Nivel {m.nivel}</Text>
            </View>
            <Text className="text-[13.5px] leading-6 text-slate-600">{m.description}</Text>
            <Text className="text-[12.5px] font-semibold text-slate-500">
              {m.questions} preguntas · {m.segundosPorPregunta}s cada una ·{' '}
              {m.area ? NOMBRE_AREA[m.area] : 'tu área más floja'}
            </Text>
            <Boton
              variante="contorno"
              onPress={() => run.empezar.mutate(m.id)}
              cargando={run.empezar.isPending && run.empezar.variables === m.id}
              deshabilitado={run.empezar.isPending}
            >
              Empezar
            </Boton>
          </View>
        ))}

        {run.empezar.isPending ? (
          <Text className="text-center text-[13px] leading-5 text-slate-500">
            Preparando tus preguntas. Puede tardar un minuto.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
