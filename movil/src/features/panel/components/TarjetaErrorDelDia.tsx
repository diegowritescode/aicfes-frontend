import { useState } from 'react';
import { Text, View } from 'react-native';
import { OpcionRespuesta } from '@/shared/pregunta/components/OpcionRespuesta';
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
  const [elegida, setElegida] = useState<string | null>(null);
  const respondida = elegida !== null;
  const acerto = elegida === pregunta.respuesta_correcta;

  const responder = (letra: string) => {
    /* One attempt. Letting them keep trying until the border turns
       green teaches the border, not the question. */
    if (respondida) return;
    setElegida(letra);
    alResponder(letra, letra === pregunta.respuesta_correcta);
  };

  const explicacion = explicacionAMostrar({
    elegida,
    correcta: pregunta.respuesta_correcta,
    explicaciones: pregunta.explicaciones,
  });

  return (
    <View className="gap-3 rounded-2xl border border-alerta/40 bg-amber-50/60 p-5">
      <Text className="text-[12px] font-bold uppercase tracking-widest text-slate-600">
        Su pregunta de hoy
      </Text>
      <Text className="text-[13px] text-slate-600">{pregunta.motivo}</Text>

      {pregunta.contexto ? (
        <Text className="text-[13.5px] leading-6 text-slate-700">{pregunta.contexto}</Text>
      ) : null}

      <Text className="text-[15px] font-semibold leading-6 text-slate-900">
        {pregunta.pregunta}
      </Text>

      <View className="gap-2">
        {letrasDisponibles(pregunta.opciones).map((l) => (
          <OpcionRespuesta
            key={l}
            letra={l}
            texto={pregunta.opciones[l] ?? ''}
            estado={estadoDeOpcion({
              letra: l,
              elegida,
              correcta: pregunta.respuesta_correcta,
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
            {acerto ? 'Correcta.' : `La correcta era ${pregunta.respuesta_correcta}.`}
          </Text>
          {explicacion ? (
            <Text className="text-[13.5px] leading-6 text-slate-700">{explicacion}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
