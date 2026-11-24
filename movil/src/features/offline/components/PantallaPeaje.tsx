import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton } from '@/shared/ui/Boton';
import { OpcionRespuesta, type EstadoOpcion } from '@/shared/pregunta/components/OpcionRespuesta';
import type { Letra } from '@/shared/model/icfes';
import {
  esCorrecta,
  estaPagado,
  MINUTOS_DESBLOQUEO,
  preguntaActual,
  puedeEmpezar,
  resumen,
  type EstadoDelPeaje,
  type IntentoDelPeaje,
} from '../model/peaje';
import type { PreguntaDelLote } from '../api/esquemas';

/**
 * The toll.
 *
 * The learner reached for Instagram; this is what stands in front of
 * it. Five questions from their own weak topics, answered on the
 * device with no network, and then fifteen minutes.
 *
 * Answering is enough — see `model/peaje.ts` for why requiring
 * correctness would be the wrong product. The explanation after each
 * answer is where the learning happens, and it is the only part of
 * this with a measured positive effect.
 */

const LETRAS: readonly Letra[] = ['A', 'B', 'C', 'D'];

export function PantallaPeaje({
  preguntas,
  intentos,
  avanzadas,
  retomada,
  emergencia,
  minutosDeEmergencia,
  alResponder,
  alAvanzar,
  alPagar,
  alSaltar,
}: {
  preguntas: readonly PreguntaDelLote[];
  /* Answers and position come from outside, because they are written
     to the device as they happen. Holding them here meant a learner
     who left on question 2 came back to question 1 — which is not an
     escape hatch, it is the absence of a door. */
  intentos: readonly IntentoDelPeaje[];
  avanzadas: number;
  /** True when this block was already underway before this launch. */
  retomada: boolean;
  /** The counted way out, or null where there is none to offer. */
  emergencia: {
    readonly texto: string;
    readonly disponible: boolean;
    readonly usar: () => void;
  } | null;
  /** Minutes an emergency buys, so the screen can name the trade. */
  minutosDeEmergencia: number;
  alResponder: (intento: IntentoDelPeaje) => void;
  alAvanzar: () => void;
  /** Called once the block is cleared, with what to queue for sending. */
  alPagar: (intentos: readonly IntentoDelPeaje[]) => void;
  /** Called when there is nothing to ask, so the app must not block. */
  alSaltar: () => void;
}) {
  const [elegida, setElegida] = useState<Letra | null>(null);
  const inicioRef = useRef(Date.now());

  const estado: EstadoDelPeaje = { preguntas, intentos, avanzadas };
  const pregunta = preguntaActual(estado);

  const responder = useCallback(
    (letra: Letra) => {
      if (elegida !== null || !pregunta) return;
      setElegida(letra);
      alResponder({
        itemId: pregunta.id,
        elegida: letra,
        correcta: esCorrecta(pregunta, letra),
        tiempoMs: Date.now() - inicioRef.current,
      });
    },
    [elegida, pregunta, alResponder],
  );

  const seguir = useCallback(() => {
    setElegida(null);
    alAvanzar();
    inicioRef.current = Date.now();
  }, [alAvanzar]);

  /* Nothing to ask: let them through and say why. A barrier the
     learner cannot pass is not self-regulation, it is the app holding
     their phone hostage. */
  if (!puedeEmpezar(preguntas)) {
    return (
      <SafeAreaView className="flex-1 bg-wash">
        <View className="flex-1 justify-center gap-4 px-5">
          <Text className="text-[22px] font-bold tracking-tight text-slate-900">
            Esta vez pasas gratis
          </Text>
          <Text className="text-[14.5px] leading-6 text-slate-600">
            Nos quedamos sin preguntas guardadas. Conéctate un momento y
            volvemos a tener con qué.
          </Text>
          <Boton onPress={alSaltar} ancho>
            Seguir
          </Boton>
        </View>
      </SafeAreaView>
    );
  }

  if (estaPagado(estado)) {
    const r = resumen(estado);
    return (
      <SafeAreaView className="flex-1 bg-wash">
        <View className="flex-1 justify-center gap-4 px-5">
          <Text className="text-[26px] font-bold tracking-tight text-slate-900">
            Listo. {MINUTOS_DESBLOQUEO} minutos de uso.
          </Text>
          {/* "De uso" is load-bearing: the native budget only runs down
              while the blocked app is in the foreground, so closing it
              pauses the clock. Saying "15 minutos" would read as a
              deadline and make the app look broken when there is time
              left an hour later. */}
          <Text className="text-[13px] leading-5 text-slate-400">
            El tiempo corre solo mientras la tengas abierta.
          </Text>
          <Text className="text-[14.5px] leading-6 text-slate-600">
            {r.acertadas} de {r.total} correctas.{' '}
            {r.acertadas === r.total
              ? 'Las cinco bien.'
              : 'Las que fallaste vuelven más adelante.'}
          </Text>
          <Boton onPress={() => alPagar(intentos)} ancho>
            Abrir la app
          </Boton>
        </View>
      </SafeAreaView>
    );
  }

  if (!pregunta) return null;

  const respondida = elegida !== null;
  const acerto = respondida && esCorrecta(pregunta, elegida);
  const letras = LETRAS.filter((l) => pregunta.opciones[l] !== undefined);

  return (
    <SafeAreaView className="flex-1 bg-wash">
      <ScrollView contentContainerClassName="gap-5 px-5 py-6">
        <View className="gap-1.5">
          <Text className="text-[12px] font-bold uppercase tracking-widest text-slate-400">
            Pregunta {avanzadas + 1} de {preguntas.length}
          </Text>
          <Text className="text-[13px] leading-5 text-slate-500">
            Responde y sigues. No importa si fallas.
          </Text>
          {/* Said out loud when true. A learner who answered two last
              night and opens this at "3 de 5" would otherwise think
              the app lost their work or invented the number. */}
          {retomada ? (
            <Text className="text-[13px] leading-5 text-emerald-700">
              Seguimos donde ibas.
            </Text>
          ) : null}
        </View>

        {pregunta.contexto ? (
          <View className="rounded-2xl border border-slate-200 bg-white p-4">
            <Text className="text-[13.5px] leading-6 text-slate-700">
              {pregunta.contexto}
            </Text>
          </View>
        ) : null}

        <Text className="text-[16px] font-semibold leading-6 text-slate-900">
          {pregunta.pregunta}
        </Text>

        <View className="gap-2.5">
          {letras.map((letra) => (
            <OpcionRespuesta
              key={letra}
              letra={letra}
              texto={pregunta.opciones[letra]!}
              estado={estadoDeOpcion(pregunta, letra, elegida)}
              bloqueada={respondida}
              onElegir={() => responder(letra)}
            />
          ))}
        </View>

        {/* The explanation, which is the part that teaches. Shown for a
            right answer too: knowing why it was right is not the same
            as having picked it. */}
        {respondida ? (
          <View
            className={`gap-2 rounded-2xl border p-4 ${
              acerto ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'
            }`}
          >
            <Text
              className={`text-[13px] font-bold uppercase tracking-wide ${
                acerto ? 'text-emerald-700' : 'text-slate-500'
              }`}
            >
              {acerto ? 'Bien' : `Era ${pregunta.respuesta_correcta}`}
            </Text>
            <Text className="text-[13.5px] leading-6 text-slate-700">
              {explicacionDe(pregunta, elegida)}
            </Text>
          </View>
        ) : null}

        {respondida ? (
          <Boton onPress={seguir} ancho>
            {avanzadas + 1 >= preguntas.length ? 'Terminar' : 'Siguiente'}
          </Boton>
        ) : null}

        {/* The way out when there is a real reason.
            Below the question and not beside it: a learner who came
            here to study should meet the exercises first and the exit
            second. It names what it costs before the tap, because the
            count is the whole design — an unlimited exit is the button
            a procrastinator presses every time, and then the toll does
            not exist. */}
        {emergencia ? (
          <View className="gap-2 border-t border-slate-200 pt-5">
            <Pressable
              onPress={emergencia.disponible ? emergencia.usar : undefined}
              disabled={!emergencia.disponible}
              accessibilityRole="button"
              accessibilityState={{ disabled: !emergencia.disponible }}
              className="py-1.5"
            >
              <Text
                className={`text-center text-[13.5px] ${
                  emergencia.disponible ? 'text-slate-500' : 'text-slate-300'
                }`}
              >
                {emergencia.texto}
              </Text>
            </Pressable>
            {emergencia.disponible ? (
              <Text className="text-center text-[12px] leading-4 text-slate-400">
                {minutosDeEmergencia} minutos, sin ejercicios. Tu avance aquí se
                guarda.
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function estadoDeOpcion(
  pregunta: PreguntaDelLote,
  letra: Letra,
  elegida: Letra | null,
): EstadoOpcion {
  if (elegida === null) return 'pendiente';
  if (letra === pregunta.respuesta_correcta) return 'correcta';
  if (letra === elegida) return 'fallada';
  return 'descartada';
}

/** The explanation for what they picked, falling back to the right one. */
function explicacionDe(pregunta: PreguntaDelLote, elegida: Letra): string {
  const propia = pregunta.explicaciones?.[elegida];
  if (propia) return propia;
  const correcta = pregunta.explicaciones?.[pregunta.respuesta_correcta];
  if (correcta) return correcta;
  /* No explanations stored. Saying nothing would leave an empty box;
     saying this is honest and still points somewhere useful. */
  return `La correcta es ${pregunta.respuesta_correcta}. Esta pregunta no trae explicación guardada.`;
}
