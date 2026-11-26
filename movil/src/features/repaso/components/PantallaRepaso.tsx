import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  BarraRespuesta,
  Boton,
  Cifra,
  Contexto,
  Explicacion,
  Opcion,
  Personaje,
  Tarjeta,
  Texto,
} from '@/shared/ui';
import { NOMBRE_AREA, type Letra } from '@/shared/model/icfes';
import { rotarOpciones } from '@/shared/pregunta/model/rotacion';
import {
  letraAnterior,
  recordarLetra,
  repeticionesSeguidas,
} from '@/shared/pregunta/model/memoriaLetras';
import type { ErrorPendiente } from '../api/esquemas';
import {
  cierre,
  errorActual,
  resumen,
  terminada,
  type IntentoDeRepaso,
  type SesionDeRepaso,
} from '../model/sesion';

/**
 * Reviewing mistakes, one at a time.
 *
 * The first version listed them as collapsible cards and was reported
 * as hard to concentrate in: every question on screen at once, a wrong
 * answer leaving the card open, and reopening it letting you answer
 * again with the right option already visible. Reviewing means
 * concentrating, which means one question and nothing else.
 *
 * Options are shuffled, because this is by definition a repeat: the
 * learner has seen the right letter highlighted before, and tapping it
 * from memory practises nothing.
 *
 * After answering, the two options that matter stay and the other two
 * go. Four rows of which two are irrelevant is four rows to read, and
 * the thing worth reading — why the one they picked is wrong — is
 * below them.
 */
export function PantallaRepaso({
  errores,
  onResponder,
  onPedirTutor,
  onTerminar,
}: {
  errores: readonly ErrorPendiente[];
  onResponder: (intento: IntentoDeRepaso) => void;
  /** Opens the tutor for a wrong answer. Assembled by the route,
      because a feature may not import another feature. */
  onPedirTutor: (error: ErrorPendiente, elegida: Letra) => void;
  onTerminar: () => void;
}) {
  const [intentos, setIntentos] = useState<IntentoDeRepaso[]>([]);
  const [avanzadas, setAvanzadas] = useState(0);
  const [elegida, setElegida] = useState<Letra | null>(null);

  /**
   * The questions, frozen when the run starts.
   *
   * This fixes a defect reported from a phone: answer B, see it
   * marked wrong, and two seconds later the options have reordered
   * and B is now the right one.
   *
   * Answering saves to the server, which reloads the review list —
   * correctly, since one question is now cleared. But the reloaded
   * rows are new objects with a new `veces`, and both feed the
   * shuffle. So the question being read got reshuffled underneath the
   * learner, and the answer they had already given started pointing
   * at a different option.
   *
   * A run works on the list it started with. The list is allowed to
   * change behind it; what the learner is looking at is not.
   */
  const [congeladas] = useState<readonly ErrorPendiente[]>(() => errores);

  const sesion: SesionDeRepaso = { errores: congeladas, intentos, avanzadas };
  const actual = errorActual(sesion);

  /* One number per review run, fixed when the screen mounts.

     It seeds the shuffle, and getting this wrong was a real defect:
     the first version used `veces`, the number of times the question
     had been MISSED. Reviewing without missing it again leaves that
     unchanged, so a learner could fail, see that the answer was A,
     leave, come back and tap A without reading. Reported from a
     phone, exactly like that.

     The run is what has to differ, not the failure count. */
  const [semillaDeSesion] = useState(() => Date.now());

  /* Shuffled once per question, not on every render: recomputing
     while the learner reads would move the options under their
     finger. */
  const barajado = useMemo(() => {
    if (!actual) return null;
    return rotarOpciones({
      /* The item and the run together: the same question shuffles
         differently each time it comes up, and two questions in one
         run do not share an arrangement. */
      itemId: `${actual.itemId}:${semillaDeSesion}`,
      opciones: actual.opciones,
      correcta: actual.respuesta_correcta,
      intento: Math.max(1, actual.veces),
      /* Where it was last time, so the shuffle can promise a
         different letter rather than hoping for one: chance alone
         repeats a quarter of the time with four options, and a
         learner who sees the same letter twice concludes the shuffle
         is broken. */
      correctaAnterior: letraAnterior(actual.itemId) as Letra | null,
        repeticionesSeguidas: repeticionesSeguidas(actual.itemId),
    });
  }, [actual, semillaDeSesion]);

  /* Remembered after rendering, not before: reading and writing in
     the same pass would have this question avoid its own letter. */
  useEffect(() => {
    if (actual && barajado) recordarLetra(actual.itemId, barajado.correcta);
  }, [actual, barajado]);

  const responder = useCallback(
    (mostrada: Letra) => {
      if (elegida !== null || !actual || !barajado) return;
      setElegida(mostrada);

      /* Recorded as the ORIGINAL letter. The server's history has to
         survive the shuffle, or the same answer would look like two
         different ones across attempts. */
      const original = barajado.aOriginal[mostrada] ?? mostrada;
      const intento: IntentoDeRepaso = {
        itemId: actual.itemId,
        elegida: original,
        correcta: mostrada === barajado.correcta,
      };
      setIntentos((previos) => [...previos, intento]);
      onResponder(intento);
    },
    [actual, barajado, elegida, onResponder],
  );

  const seguir = useCallback(() => {
    setElegida(null);
    setAvanzadas((n) => n + 1);
  }, []);

  if (terminada(sesion)) {
    const r = resumen(sesion);
    return (
      <View className="flex-1">
        <ScrollView className="flex-1" contentContainerClassName="flex-grow justify-center gap-5 px-5 py-5">
          <Texto estilo="rotulo">Terminó</Texto>

          {/* Green only for the ones that came out right: those were
              earned. The total beside it is not. */}
          <Tarjeta className="items-center gap-1.5">
            <Cifra
              valor={r.corregidas}
              unidad={`de ${r.total}`}
              tono={r.corregidas > 0 ? 'ganado' : 'texto'}
            />
            <Texto estilo="apoyo" className="text-center">
              {cierre(sesion)}
            </Texto>
          </Tarjeta>

          {r.corregidas < r.total ? (
            <Tarjeta variante="plana">
              <Texto estilo="apoyo">
                Las que no salieron siguen en tu lista. No se pierden.
              </Texto>
            </Tarjeta>
          ) : null}
        </ScrollView>

        <BarraRespuesta>
          <Boton alTocar={onTerminar}>Volver</Boton>
        </BarraRespuesta>
      </View>
    );
  }

  if (!actual || !barajado) return null;

  const respondida = elegida !== null;
  const acerto = respondida && elegida === barajado.correcta;
  const todas = (['A', 'B', 'C', 'D'] as const).filter(
    (l) => barajado.opciones[l] !== undefined,
  );
  /* Before answering, all four: the learner has to choose among them.
     After, only the right one and the one they picked — the other two
     were never in play, and leaving them pushes the explanation, which
     is the only part with a measured effect, off the screen. */
  const letras = respondida
    ? todas.filter((l) => l === barajado.correcta || l === elegida)
    : todas;

  return (
    <View className="flex-1">
      <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 py-5">
        {/* The subject, not a topic: a review row carries `area` and
            nothing finer. See the note on the pattern card below. */}
        <Texto estilo="rotulo">{NOMBRE_AREA[actual.area]}</Texto>

        {actual.contexto ? <Contexto>{actual.contexto}</Contexto> : null}

        <Texto estilo="pregunta">{actual.pregunta}</Texto>

        <View className="gap-2.5">
          {letras.map((letra) => (
            <Opcion
              key={letra}
              letra={letra}
              estado={estadoDe(letra, barajado.correcta, elegida)}
              alTocar={respondida ? undefined : () => responder(letra)}
            >
              {barajado.opciones[letra]!}
            </Opcion>
          ))}
        </View>

        {respondida ? (
          <Explicacion acerto={acerto} titulo={acerto ? 'Ahora sí' : 'Todavía no'}>
            {explicacion(actual, barajado.aOriginal[elegida] ?? elegida)}
          </Explicacion>
        ) : null}

        {/* The one thing in this product with a clear measured positive
            effect is informative feedback: d = +0,33. This card is
            that, extended backwards in time — not «you were wrong»
            but «this is the third time, and here is what you keep
            doing».

            The count is real: `veces` comes from the server. The
            pattern does not exist yet. `errorPendiente` carries no
            field for «siempre eliges Golgi», so there is nothing to
            render and nothing is invented here: a made-up pattern is
            worse than none, because the learner will believe it. When
            the backend sends one, it goes in this card under the
            count. */}
        {respondida ? (
          <Tarjeta variante="plana" className="gap-1.5">
            <Texto estilo="rotulo">
              {actual.veces === 1
                ? 'La has fallado una vez'
                : `La has fallado ${actual.veces} veces`}
            </Texto>
            <Texto estilo="apoyo">
              {actual.veces === 1
                ? 'Si vuelve a salirte mal, vuelve a esta lista.'
                : 'Sigue en tu lista hasta que te salga. No se pierde.'}
            </Texto>
          </Tarjeta>
        ) : null}

        {/* The character delivers the analysis here — `docs/PERSONAJE.md`
            calls this the one screen where it is the protagonist. It
            looks at its own page, not at the learner: failing gives it
            more work, not disappointment. */}
        {respondida ? (
          <View className="items-center pt-1">
            <Personaje pose={acerto ? 'acierto' : 'fallo'} tamano={72} />
          </View>
        ) : null}
      </ScrollView>

      {/* Outside the scroll: with a 1200-character stimulus, four
          options and an explanation, anything inside it lands past the
          fold, and a button nobody scrolls to is a button that does
          not exist. */}
      {respondida ? (
        <BarraRespuesta>
          <Boton alTocar={seguir}>
            {avanzadas + 1 >= congeladas.length ? 'Terminar' : 'Intentar otra parecida'}
          </Boton>
          {!acerto ? (
            <Boton
              variante="plano"
              alTocar={() => onPedirTutor(actual, barajado.aOriginal[elegida] ?? elegida)}
            >
              Hablarlo con el tutor
            </Boton>
          ) : null}
        </BarraRespuesta>
      ) : null}
    </View>
  );
}

function estadoDe(
  letra: Letra,
  correcta: Letra,
  elegida: Letra | null,
): 'pendiente' | 'correcta' | 'fallada' | 'apagada' {
  if (elegida === null) return 'pendiente';
  if (letra === correcta) return 'correcta';
  if (letra === elegida) return 'fallada';
  return 'apagada';
}

/** The explanation for what they picked, by its original letter. */
function explicacion(error: ErrorPendiente, original: string): string {
  return (
    error.explicaciones?.[original] ??
    error.explicaciones?.[error.respuesta_correcta] ??
    `La correcta es la que dice "${error.opciones[error.respuesta_correcta]}".`
  );
}
