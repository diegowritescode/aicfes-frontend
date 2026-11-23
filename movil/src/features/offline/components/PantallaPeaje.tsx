import { useCallback, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
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
  alPagar,
  alSaltar,
}: {
  preguntas: readonly PreguntaDelLote[];
  /** Called once the block is cleared, with what to queue for sending. */
  alPagar: (intentos: readonly IntentoDelPeaje[]) => void;
  /** Called when there is nothing to ask, so the app must not block. */
  alSaltar: () => void;
}) {
  const [intentos, setIntentos] = useState<IntentoDelPeaje[]>([]);
  const [elegida, setElegida] = useState<Letra | null>(null);
  /* Separate from `intentos.length`, because between answering and
     moving on sits the explanation — the only part of this that
     teaches. Deriving the index from the answers made the question
     jump the instant an option was tapped. */
  const [avanzadas, setAvanzadas] = useState(0);
  const inicioRef = useRef(Date.now());

  const estado: EstadoDelPeaje = { preguntas, intentos, avanzadas };
  const pregunta = preguntaActual(estado);

  const responder = useCallback(
    (letra: Letra) => {
      if (elegida !== null || !pregunta) return;
      setElegida(letra);
      setIntentos((previos) => [
        ...previos,
        {
          itemId: pregunta.id,
          elegida: letra,
          correcta: esCorrecta(pregunta, letra),
          tiempoMs: Date.now() - inicioRef.current,
        },
      ]);
    },
    [elegida, pregunta],
  );

  const seguir = useCallback(() => {
    setElegida(null);
    setAvanzadas((n) => n + 1);
    inicioRef.current = Date.now();
  }, []);

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
