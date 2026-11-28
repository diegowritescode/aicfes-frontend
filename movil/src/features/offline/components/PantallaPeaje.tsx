import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BarraRespuesta,
  Boton,
  Chip,
  Cifra,
  Contexto,
  Encabezado,
  Explicacion,
  Opcion,
  Personaje,
  Progreso,
  Tarjeta,
  Texto,
  type EstadoOpcion,
} from '@/shared/ui';
import type { Letra } from '@/shared/model/icfes';
import {
  esCorrecta,
  MINUTOS_DESBLOQUEO,
  preguntaActual,
  puedeEmpezar,
  resumen,
  type EstadoDelPeaje,
  type IntentoDelPeaje,
} from '../model/peaje';
import {
  avisoDeRecargo,
  BASE,
  cuantasPide,
  esperaAntesDeSeguir,
  estaPagado,
} from '../model/costoDelError';
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
 *
 * Nothing here celebrates and nothing here greets. The learner did
 * not ask to see us; we interrupted them. And there is no tab bar:
 * from inside a toll there is nowhere else to go, and offering an
 * exit is offering an abandonment.
 */

const LETRAS: readonly Letra[] = ['A', 'B', 'C', 'D'];

/* The disabled prompt's handler. `Boton` passes `disabled` to the
   Pressable so it never fires; a module-level no-op keeps it from
   being a new function on every render. */
const NADA = () => {};

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
  alSeguirPracticando,
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
  /** Same bookkeeping as paying, but staying in the app to study. */
  alSeguirPracticando: (intentos: readonly IntentoDelPeaje[]) => void;
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
      const acertada = esCorrecta(pregunta, letra);
      setEsperando(esperaAntesDeSeguir(acertada));
      alResponder({
        itemId: pregunta.id,
        elegida: letra,
        correcta: acertada,
        tiempoMs: Date.now() - inicioRef.current,
      });
    },
    [elegida, pregunta, alResponder],
  );

  /* Counts down while the explanation is on screen after a mistake.
     Zero when the answer was right, so nothing is held. */
  const [esperando, setEsperando] = useState(0);

  useEffect(() => {
    if (esperando <= 0) return;
    const t = setTimeout(() => setEsperando((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [esperando]);

  const seguir = useCallback(() => {
    setElegida(null);
    setEsperando(0);
    alAvanzar();
    inicioRef.current = Date.now();
  }, [alAvanzar]);

  /* Nothing to ask: let them through and say why. A barrier the
     learner cannot pass is not self-regulation, it is the app holding
     their phone hostage. */
  if (!puedeEmpezar(preguntas)) {
    return (
      <SafeAreaView className="flex-1 bg-fondo">
        <View className="flex-1 justify-center gap-4 px-5">
          <Texto estilo="titulo">Esta vez pasas gratis</Texto>
          <Texto estilo="cuerpo">
            Nos quedamos sin preguntas guardadas. Conéctate un momento y
            volvemos a tener con qué.
          </Texto>
          <Boton alTocar={alSaltar}>Seguir</Boton>
        </View>
      </SafeAreaView>
    );
  }

  /* How many this block asks, given the mistakes so far. Recomputed
     rather than stored: a resumed block has to arrive at the same
     number it had when the learner left. */
  const fallos = intentos.filter((i) => !i.correcta).length;
  const pedidas = Math.min(cuantasPide(fallos), preguntas.length);
  const BASE_DE_PREGUNTAS = Math.min(BASE, pedidas);

  if (estaPagado({ avanzadas, fallos, disponibles: preguntas.length })) {
    const r = resumen(estado);
    return (
      <SafeAreaView className="flex-1 bg-fondo">
        <View className="flex-1 justify-center gap-5 px-5">
          <View className="items-center">
            <Personaje pose="espera" tamano={92} />
          </View>

          <View className="gap-1">
            <Cifra valor={MINUTOS_DESBLOQUEO} unidad="minutos" tono="ganado" />
            {/* "De uso" is load-bearing and was not enough on its own:
                the first real user expected the block to come back at
                a fixed clock time. The budget only runs down while the
                blocked app is in the foreground — more generous than a
                timer, and invisible unless it is spelled out. Unspent
                time expires at midnight. */}
            <Texto estilo="apoyo">
              de uso en Instagram. Se gastan solo mientras la tengas abierta.
            </Texto>
          </View>

          {/* Out of what was answered, not out of the pool that was
              drawn. The block takes up to the ceiling from the pool so
              a mistake has something to add — reporting against that
              number would tell someone who answered five perfectly
              that they got 5 of 8. */}
          <Tarjeta className="gap-2.5">
            <Texto estilo="rotulo">Lo que quedó anotado</Texto>
            <View className="flex-row flex-wrap gap-2">
              <Chip tono={r.acertadas === r.respondidas ? 'ganado' : 'neutro'}>
                {r.acertadas} de {r.respondidas}
              </Chip>
              {r.acertadas === r.respondidas ? null : (
                <Chip tono="fallo">Las que fallaste vuelven</Chip>
              )}
            </View>
          </Tarjeta>

          <View className="gap-2">
            {/* Not "Abrir la app". Launching another app is a runtime
                capability (`getCapabilities().openApplication`) that
                this phone reports as false, so the label promised
                something that did not happen and the learner landed on
                Inicio. It is still attempted — where it works, it
                works — but the words no longer depend on it.

                `ganado` because the minutes were earned, and this is
                the only button in the app that claims something. */}
            <Boton variante="ganado" alTocar={() => alPagar(intentos)}>
              Cobrar {MINUTOS_DESBLOQUEO} minutos
            </Boton>

            {/* Flat, and second: a learner who wants to keep going
                should be able to, but the minutes are what they came
                for and a second filled button beside the first makes
                neither of them the answer. It queues the answers and
                grants the minutes exactly as claiming does — what was
                earned stays earned either way — and only the
                destination differs. */}
            <Boton variante="plano" alTocar={() => alSeguirPracticando(intentos)}>
              Seguir practicando
            </Boton>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!pregunta) return null;

  const respondida = elegida !== null;
  const acerto = respondida && esCorrecta(pregunta, elegida);
  const letras = LETRAS.filter((l) => pregunta.opciones[l] !== undefined);

  return (
    <SafeAreaView className="flex-1 bg-fondo">
      <ScrollView contentContainerClassName="gap-4 px-5 py-5">
        {/* The app that was reached for on the left, how far along on
            the right. The chip turns amber only once a mistake has
            lengthened the block: before that it is the plain count,
            and an amber pill on an untouched screen reads as "you
            already failed". */}
        <Encabezado
          rotulo="Instagram"
          derecha={
            fallos > 0 ? (
              <Chip tono="fallo">Van {pedidas}</Chip>
            ) : (
              <Chip tono="acento">
                {Math.min(avanzadas + 1, pedidas)} de {pedidas}
              </Chip>
            )
          }
        />

        <Progreso
          hechas={avanzadas}
          total={pedidas}
          recargo={pedidas - BASE_DE_PREGUNTAS}
          dicho={`Pregunta ${avanzadas + 1} de ${pedidas}`}
        />

        {/* Said out loud when true. A learner who answered two last
            night and opens this at "3 de 5" would otherwise think the
            app lost their work or invented the number. */}
        {retomada ? <Texto estilo="apoyo">Seguimos donde ibas.</Texto> : null}

        {/* `Contexto`, not a card of body text. An ICFES stimulus runs
            to 1200 characters, and printed in full it pushed the
            question and the four options below the fold — on the toll,
            where the learner is already annoyed, that is the
            difference between answering and force-quitting. It is also
            a different surface from the question, which is what tells
            the eye where the reading ends and the task begins. */}
        {pregunta.contexto ? <Contexto>{pregunta.contexto}</Contexto> : null}

        <Texto estilo="pregunta">{pregunta.pregunta}</Texto>

        <View className="gap-2.5">
          {letras.map((letra) => (
            <Opcion
              key={letra}
              letra={letra}
              estado={estadoDeOpcion(pregunta, letra, elegida)}
              alTocar={respondida ? undefined : () => responder(letra)}
            >
              {pregunta.opciones[letra]!}
            </Opcion>
          ))}
        </View>

        {/* The explanation, which is the part that teaches. Shown for
            a right answer too: knowing why it was right is not the
            same as having picked it. */}
        {respondida ? (
          /* The character beside the explanation, not floating in a
              corner. At 56pt it was a stamp nobody could read; here
              it is big enough to see the head go down on a mistake,
              which is the whole point of having it. It still says
              nothing — on top of Instagram, a creature that looked
              pleased would read as mockery. */
          <View className="flex-row items-start gap-3">
            <Personaje pose={acerto ? 'acierto' : 'fallo'} tamano={92} />
            <View className="flex-1">
              <Explicacion
                acerto={acerto}
                titulo={acerto ? 'Esa es' : `Era ${pregunta.respuesta_correcta}`}
              >
                {explicacionDe(pregunta, elegida)}
              </Explicacion>
            </View>
          </View>
        ) : null}

        {/* Said when a mistake lengthens the block. Without it the
            number grows unexplained, and a learner concludes the app
            is broken or unfair — either way it ends uninstalled.

            Said in the muted body colour rather than in amber. The
            explanation above it already carries the amber edge and
            the chip above that carries the count; a third amber thing
            on one screen makes a wrong answer look like a fault
            notice, which is the opposite of what the model says this
            data is for. */}
        {respondida && !acerto ? (
          <Texto estilo="apoyo" className="text-center">
            {avisoDeRecargo({ fallos, pedidas })}
          </Texto>
        ) : null}

        {/* The way out when there is a real reason. Below the question
            and not beside it: a learner who came here to study should
            meet the exercises first and the exit second. It names what
            it costs before the tap, because the count is the whole
            design — an unlimited exit is the button a procrastinator
            presses every time, and then the toll does not exist. */}
        {emergencia ? (
          <View className="gap-1.5 border-t border-linea pt-4">
            <Pressable
              onPress={emergencia.disponible ? emergencia.usar : undefined}
              disabled={!emergencia.disponible}
              accessibilityRole="button"
              accessibilityState={{ disabled: !emergencia.disponible }}
              className="min-h-toque justify-center"
            >
              <Texto
                estilo="apoyo"
                className={`text-center ${emergencia.disponible ? '' : 'opacity-40'}`}
              >
                {emergencia.texto}
              </Texto>
            </Pressable>
            {emergencia.disponible ? (
              <Texto estilo="apoyo" className="text-center">
                {minutosDeEmergencia} minutos, sin ejercicios. Tu avance aquí se
                guarda.
              </Texto>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {/* Pinned, not at the end of the scroll. With a long stem the
          button lands below a screen and a half of text, and a button
          nobody can find is a button that does not exist.

          `BarraRespuesta` holds it in both states, answered and not:
          the bar used to appear only after an answer, so the row the
          thumb was resting on moved the moment an option was tapped.
          The unanswered state shows the disabled prompt instead, which
          is also what tells a learner the screen is waiting on them
          rather than on the network. */}
      <BarraRespuesta>
        {respondida ? (
          /* Held for a few seconds after a wrong answer only. A
              correct one moves on at once: the pause is what a mistake
              costs in attention, not a tax on everyone that teaches
              staring at a timer. */
          <Boton alTocar={seguir} deshabilitado={esperando > 0}>
            {esperando > 0
              ? `Lee la explicación… ${esperando}`
              : avanzadas + 1 >= pedidas
                ? 'Terminar'
                : 'Siguiente'}
          </Boton>
        ) : (
          <Boton alTocar={NADA} deshabilitado>
            Elige una opción
          </Boton>
        )}
      </BarraRespuesta>
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
  return 'apagada';
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
