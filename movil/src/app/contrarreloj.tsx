import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  BarraRespuesta,
  Boton,
  Chip,
  Cifra,
  Contexto,
  Encabezado,
  Opcion,
  Progreso,
  Tarjeta,
  Texto,
} from '@/shared/ui';
import { Aviso } from '@/shared/ui/Aviso';
import { NOMBRE_AREA, type Letra } from '@/shared/model/icfes';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import {
  useContrarrelojRun,
  useModosContrarreloj,
} from '@/features/contrarreloj/hooks/useContrarreloj';
import { comoReloj, vaApurado } from '@/features/simulacro/model/reglas';

const LETRAS: readonly Letra[] = ['A', 'B', 'C', 'D'];

/**
 * Against the clock.
 *
 * The ladder exists because a single speed teaches one pace. The real
 * exam is 254 questions in 270 minutes — 64 seconds each — and a mode
 * that gives 30 is not "hard mode", it is a different skill. Each rung
 * says what it is training.
 */
/** A round aimed at one topic: five questions at the real exam's pace. */
const PREGUNTAS_DEL_PLAN = 5;
const SEGUNDOS_DEL_PLAN = PREGUNTAS_DEL_PLAN * 64;

export default function RutaContrarreloj() {
  const router = useRouter();
  const { cargando: cargandoSesion, autenticado } = useSesion();
  const { modos, fallo } = useModosContrarreloj();
  const run = useContrarrelojRun();

  /* Arriving from the weekly plan: the action's own area and topic.
     Before this the plan could only point at an area, so «practicar
     ángulos» opened a drill on mixed Matemáticas — the topic died
     between the plan and the request and every layer looked right. */
  const { area: areaPedida, tema: temaPedido } = useLocalSearchParams<{
    area?: string;
    tema?: string;
  }>();

  const [elegida, setElegida] = useState<Letra | null>(null);

  /* Started once per arrival. Without the ref a re-render during the
     request would fire a second round, and each round is generated
     and paid for. */
  const yaArranco = useRef(false);

  useEffect(() => {
    if (yaArranco.current) return;
    if (!autenticado || !areaPedida || !temaPedido) return;

    yaArranco.current = true;
    run.empezar.mutate({
      area: areaPedida,
      tema: temaPedido,
      preguntas: PREGUNTAS_DEL_PLAN,
      segundos: SEGUNDOS_DEL_PLAN,
    });
    /* `run.empezar` is stable enough for this to run on arrival only;
       the ref is what actually guarantees it. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, areaPedida, temaPedido]);

  const terminar = useCallback(() => run.terminar(), [run]);
  const segundos = run.segundos;

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  if (run.estado === 'terminado') {
    return (
      <SafeAreaView className="flex-1 bg-fondo">
        <ScrollView contentContainerClassName="gap-5 px-5 py-6">
          <Encabezado rotulo="Contrarreloj terminado" />
          <View className="gap-1.5">
            <Cifra valor={run.correctas} unidad={`de ${run.respondidas} correctas`} />
            <Texto estilo="apoyo">
              {run.seAcaboElTiempo
                ? 'Se acabó el tiempo. Así es el examen real.'
                : 'Respondiste todas a tiempo.'}
            </Texto>
          </View>
        </ScrollView>

        <BarraRespuesta>
          <Boton alTocar={() => router.replace('/inicio')}>Volver al inicio</Boton>
        </BarraRespuesta>
      </SafeAreaView>
    );
  }

  if (run.estado === 'corriendo' && run.item) {
    const item = run.item;
    const apurado = vaApurado(segundos);

    return (
      <SafeAreaView className="flex-1 bg-fondo">
        {/* The clock stays out of the scroll view, pinned opposite the
            answer bar. It is the one fact this mode exists to show,
            and a learner who has scrolled into a long stimulus must
            not lose sight of it. */}
        <View className="flex-row items-center justify-end border-b border-linea bg-capa px-5 py-3">
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
        </View>

        <ScrollView contentContainerClassName="gap-4 px-5 py-5">
          <Encabezado
            rotulo={NOMBRE_AREA[item.area]}
            derecha={
              <Chip tono="acento">
                {run.indice + 1} de {run.items.length}
              </Chip>
            }
          />

          <Progreso
            hechas={run.respondidas}
            total={run.items.length}
            dicho={`Pregunta ${run.indice + 1} de ${run.items.length}`}
          />

          {item.contexto ? <Contexto>{item.contexto}</Contexto> : null}

          <Texto estilo="pregunta">{item.pregunta}</Texto>

          <View className="gap-[9px]" accessibilityRole="radiogroup">
            {LETRAS.filter((l) => item.opciones[l]).map((letra) => (
              <Opcion
                key={letra}
                letra={letra}
                estado={elegida === letra ? 'elegida' : 'pendiente'}
                alTocar={() => setElegida(letra)}
              >
                {item.opciones[letra] ?? ''}
              </Opcion>
            ))}
          </View>
        </ScrollView>

        {/* No verdict between questions: stopping to read an
            explanation is the opposite of what this mode trains. */}
        <BarraRespuesta>
          <Boton
            alTocar={() => {
              if (!elegida) return;
              run.responder(elegida);
              setElegida(null);
            }}
            deshabilitado={!elegida}
          >
            {elegida
              ? run.indice === run.items.length - 1
                ? 'Terminar'
                : 'Siguiente'
              : 'Elige una opción'}
          </Boton>
        </BarraRespuesta>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-fondo">
      <ScrollView contentContainerClassName="gap-5 px-5 py-6">
        <View className="gap-2">
          <Texto estilo="titulo-grande">Contrarreloj</Texto>
          <Texto estilo="cuerpo" className="text-texto-apagado">
            En el examen real tienes 64 segundos por pregunta. Sube la escalera a tu ritmo.
          </Texto>
        </View>

        {fallo ? <Aviso mensaje={fallo.mensaje} detalle={fallo.detalle} /> : null}
        {run.fallo ? <Aviso mensaje={run.fallo.mensaje} detalle={run.fallo.detalle} /> : null}

        {modos.map((m) => (
          <Tarjeta key={m.id} className="gap-2">
            <View className="flex-row items-baseline justify-between">
              <Texto estilo="cuerpo" style={{ fontFamily: 'Nunito_800ExtraBold' }}>
                {m.title}
              </Texto>
              <Chip>Nivel {m.nivel}</Chip>
            </View>
            <Texto estilo="cuerpo" className="text-texto-apagado">
              {m.description}
            </Texto>
            <Texto estilo="apoyo" style={{ fontFamily: 'Inter_600SemiBold' }}>
              {m.questions} preguntas · {m.segundosPorPregunta}s cada una ·{' '}
              {m.area ? NOMBRE_AREA[m.area] : 'tu área más floja'}
            </Texto>
            <View className="mt-1">
              <Boton
                variante="contorno"
                alTocar={() => run.empezar.mutate({ modeId: m.id })}
                /* `variables` is the whole request now, so the
                   spinner matches on the mode id inside it. Comparing
                   the object to a string compiled before only because
                   the mutation took a bare id. */
                cargando={
                  run.empezar.isPending &&
                  run.empezar.variables !== undefined &&
                  'modeId' in run.empezar.variables &&
                  run.empezar.variables.modeId === m.id
                }
                deshabilitado={run.empezar.isPending}
              >
                Empezar
              </Boton>
            </View>
          </Tarjeta>
        ))}

        {run.empezar.isPending ? (
          <Texto estilo="apoyo" className="text-center">
            Preparando tus preguntas. Puede tardar un minuto.
          </Texto>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
