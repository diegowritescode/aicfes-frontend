import { Boton, Tarjeta, Texto } from '@/shared/ui';
import type { ErrorDelDia } from '../api/esquemas';

/**
 * The question of the day, as one line on the dashboard.
 *
 * The card used to hold the whole question — stimulus, four options,
 * explanation — which on a Lectura Crítica item with an email in it
 * filled the screen before the learner reached anything else. The
 * dashboard is a summary; a question is a task, and a task belongs on
 * its own screen. One line is the ceiling, enforced by `numberOfLines`
 * rather than by trusting the item to be short: the stimulus is what
 * overflowed last time.
 *
 * It no longer wears the failure colours. Amber and a red-ish border
 * said «you got this wrong» before the learner read a word, which is
 * the accusation the redesign took out of the subject bars too — and
 * this is the one question a day we most want tapped. The reason is
 * still on the card, in words, where it reads as a reason rather than
 * as a verdict.
 */
export function ResumenErrorDelDia({
  pregunta,
  onAbrir,
}: {
  pregunta: NonNullable<ErrorDelDia>;
  onAbrir: () => void;
}) {
  return (
    /* The whole card is no longer the touch target: the artifact puts
       a real button on it, and a `Pressable` wrapping a `Boton` gives
       a screen reader two controls for one action. */
    <Tarjeta className="gap-3">
      <Texto estilo="rotulo">Pregunta del día</Texto>

      {/* 15px rather than the 17px of `pregunta`: this is a teaser for
          a question, not the question being answered, and at full size
          one line of a Lectura Crítica stem reads as the task itself. */}
      <Texto estilo="pregunta" className="text-[15px]" numberOfLines={1}>
        {pregunta.pregunta}
      </Texto>

      {/* The reason is what makes it worth a tap: this is a question
          you got wrong, not a random one. */}
      <Texto estilo="apoyo">{pregunta.motivo}</Texto>

      <Boton
        variante="contorno"
        alTocar={onAbrir}
        etiqueta={`Responder tu pregunta del día. ${pregunta.motivo}.`}
      >
        Responder
      </Boton>
    </Tarjeta>
  );
}
