import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { OpcionRespuesta } from '@/shared/pregunta/components/OpcionRespuesta';
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
    <View className="gap-3 rounded-2xl border border-alerta/40 bg-amber-50/60 p-5">
      <Text className="text-[12px] font-bold uppercase tracking-widest text-slate-600">
        Tu pregunta de hoy
      </Text>
      <Text className="text-[13px] text-slate-600">{fija.motivo}</Text>

      {fija.contexto ? (
        <Text className="text-[13.5px] leading-6 text-slate-700">{fija.contexto}</Text>
      ) : null}

      <Text className="text-[15px] font-semibold leading-6 text-slate-900">
        {fija.pregunta}
      </Text>

      <View className="gap-2">
        {letrasDisponibles(barajado.opciones).map((l) => (
          <OpcionRespuesta
            key={l}
            letra={l}
            texto={barajado.opciones[l] ?? ''}
            estado={estadoDeOpcion({
              letra: l,
              elegida,
              correcta: barajado.correcta,
            })}
            bloqueada={respondida}
            onElegir={() => responder(l)}
          />
        ))}
      </View>

      {respondida ? (
        <View className="gap-2 rounded-xl bg-white/80 p-4">
          <Text
            className={`text-[14px] font-bold ${acerto ? 'text-emerald-700' : 'text-rose-700'}`}
          >
            {/* Naming the text, not the letter: after a shuffle the
                letter means nothing outside this card. */}
            {acerto
              ? 'Correcta.'
              : `Era: ${barajado.opciones[barajado.correcta] ?? ''}`}
          </Text>
          {explicacion ? (
            <Text className="text-[13.5px] leading-6 text-slate-700">{explicacion}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
