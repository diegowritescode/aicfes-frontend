import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Contexto, Explicacion, Opcion, Tarjeta, Texto } from '@/shared/ui';
import { rotarOpciones } from '@/shared/pregunta/model/rotacion';
import {
  letraAnterior,
  recordarLetra,
  repeticionesSeguidas,
} from '@/shared/pregunta/model/memoriaLetras';
import type { Letra } from '@/shared/model/icfes';
import type { ErrorDelDia } from '../api/esquemas';
import { estadoDeOpcion, explicacionAMostrar, letrasDisponibles } from '../model/errorDelDia';

/**
 * The one question picked from what this learner already got wrong.
 *
 * It is answered here, on the dashboard. That sounds obvious and was
 * not: the first version showed the question and then offered a
 * button that navigated to `/entrenar`, where the learner had to
 * configure a fresh session and would probably never see this
 * question again. The card promised one thing and did another.
 *
 * Answering in place is also the only version that makes the card
 * worth its space. Its whole premise is "this specific question, the
 * one you missed" — handing that to a generic trainer throws away the
 * only thing it knew.
 */

export function TarjetaErrorDelDia({
  pregunta,
  alResponder,
}: {
  /* Narrowed by the caller: the card is only rendered once the
     server sent what it needs to be answerable. */
  pregunta: NonNullable<ErrorDelDia> & {
    opciones: Record<string, string>;
    respuesta_correcta: string;
  };
  /** Told once, so the dashboard can record it and mark the day done. */
  alResponder: (elegida: string, acerto: boolean) => void;
}) {
  /* Shuffled, because this question is by definition one they got
     wrong before — they have seen the right letter highlighted. The
     seed is fixed when the card mounts, so the options do not move
     while they read. */
  const [semillaDeHoy] = useState(() => Date.now());
  /* Frozen when the card mounts, for the same reason the review run
     is: answering invalidates `error-del-dia`, and the server then
     answers null because today's question is done. Reading the live
     value would make the card vanish — or reshuffle — while the
     learner is still reading the explanation. */
  const [fija] = useState(() => pregunta);

  const barajado = useMemo(
    () =>
      rotarOpciones({
        itemId: `${fija.itemId}:${semillaDeHoy}`,
        opciones: fija.opciones,
        correcta: fija.respuesta_correcta as Letra,
        intento: 1,
        /* This question is one they already missed, so the letter
           they saw then is exactly the one to avoid. */
        correctaAnterior: letraAnterior(fija.itemId) as Letra | null,
        repeticionesSeguidas: repeticionesSeguidas(fija.itemId),
      }),
    [fija, semillaDeHoy],
  );

  useEffect(() => {
    recordarLetra(fija.itemId, barajado.correcta);
  }, [fija.itemId, barajado]);

  const [elegida, setElegida] = useState<string | null>(null);
  const respondida = elegida !== null;
  const acerto = elegida === barajado.correcta;

  const responder = (letra: string) => {
    /* One attempt. Letting them keep trying until the border turns
       green teaches the border, not the question. */
    if (respondida) return;
    setElegida(letra);
    /* Judged against the displayed correct letter, but reported with
       the original one: the server's history has to survive the
       shuffle. */
    alResponder(barajado.aOriginal[letra] ?? letra, letra === barajado.correcta);
  };

  const explicacion = explicacionAMostrar({
    /* Looked up by the ORIGINAL letter: the explanations are keyed to
       the question as written, not to where the shuffle put it. */
    elegida: elegida ? (barajado.aOriginal[elegida] ?? elegida) : null,
    correcta: fija.respuesta_correcta,
    explicaciones: fija.explicaciones,
  });

  return (
    /* A plain card, not the alert-bordered amber block this used to
       be. The question of the day is drawn from what the learner got
       wrong, so framing it in the colours of a failure notice turns
       the one invitation we most want tapped into a reproach. The
       reason it was picked is still said — in words, in `motivo`. */
    <Tarjeta className="gap-3">
      <Texto estilo="rotulo">Tu pregunta de hoy</Texto>
      <Texto estilo="apoyo">{fija.motivo}</Texto>

      {/* Through `Contexto`, so a Lectura Crítica stimulus collapses.
          Printed in full it pushed the four options off a dashboard
          that already has a screen's worth above them. */}
      {fija.contexto ? <Contexto>{fija.contexto}</Contexto> : null}

      <Texto estilo="pregunta" className="text-[15px] leading-[22px]">
        {fija.pregunta}
      </Texto>

      <View className="gap-[9px]">
        {letrasDisponibles(barajado.opciones).map((l) => (
          <Opcion
            key={l}
            letra={l}
            estado={estadoDeOpcion({
              letra: l,
              elegida,
              correcta: barajado.correcta,
            })}
            alTocar={respondida ? undefined : () => responder(l)}
          >
            {barajado.opciones[l] ?? ''}
          </Opcion>
        ))}
      </View>

      {respondida ? (
        <Explicacion acerto={acerto}>
          {/* Naming the text, not the letter: after a shuffle the
              letter means nothing outside this card. */}
          {explicacion ??
            (acerto ? 'Correcta.' : `Era: ${barajado.opciones[barajado.correcta] ?? ''}`)}
        </Explicacion>
      ) : null}
    </Tarjeta>
  );
}
