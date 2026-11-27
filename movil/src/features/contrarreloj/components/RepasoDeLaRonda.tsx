import { useState } from 'react';
import { View } from 'react-native';
import { Boton, Chip, Tarjeta, Texto } from '@/shared/ui';
import { explicacionDe } from '@/shared/pregunta/model/reglas';
import type { Letra } from '@/shared/model/icfes';
import {
  SEGUNDOS_DEL_EXAMEN,
  temaLegible,
  type PreguntaDelRepaso,
  type RepasoDeRonda,
} from '../model/repaso';

/**
 * What happened in the round just finished.
 *
 * Replaces a screen that showed «3 de 5 correctas» and a sentence,
 * while the questions, their explanations, their topics and the time
 * spent on each sat in memory and were dropped on unmount. The moment
 * a learner is most willing to read why they were wrong is the moment
 * the app had nothing to say.
 *
 * Wrong answers first and open by default. Right ones are collapsed:
 * they are worth counting, and reading four explanations of questions
 * you got right to reach the one you missed is how a review screen
 * stops being opened.
 */

export function RepasoDeLaRonda({
  repaso,
  seAcaboElTiempo,
}: {
  repaso: RepasoDeRonda;
  seAcaboElTiempo: boolean;
}) {
  const [verAcertadas, setVerAcertadas] = useState(false);

  const lento =
    repaso.segundosMediana !== null && repaso.segundosMediana > SEGUNDOS_DEL_EXAMEN;

  return (
    <View className="gap-5">
      <View className="gap-2">
        {/* The subject, when the round had one. This is the only place
            a targeted round looks different from a general one —
            without it the weekly plan's «practicar porcentajes» and a
            plain run are indistinguishable, which is exactly what a
            phone test reported. */}
        {repaso.temaDominante ? (
          <Texto estilo="apoyo">
            Esta ronda era de {temaLegible(repaso.temaDominante)}
          </Texto>
        ) : null}

        <View className="flex-row flex-wrap items-center gap-2">
          <Chip tono={repaso.correctas * 2 >= repaso.total ? 'ganado' : 'fallo'}>
            {repaso.correctas} de {repaso.total}
          </Chip>

          {/* Pace against the real exam, and only with a measurement
              behind it. The clock is the half of contrarreloj a score
              cannot show. */}
          {repaso.segundosMediana !== null ? (
            <Chip tono={lento ? 'fallo' : 'ganado'}>
              {repaso.segundosMediana}s por pregunta
            </Chip>
          ) : null}
        </View>

        <Texto estilo="apoyo">
          {seAcaboElTiempo
            ? 'Se acabó el tiempo. Así es el examen real.'
            : repaso.segundosMediana !== null && lento
              ? `El examen te da ${SEGUNDOS_DEL_EXAMEN}s por pregunta.`
              : 'Respondiste todas a tiempo.'}
        </Texto>
      </View>

      {repaso.falladas.length > 0 ? (
        <View className="gap-3">
          <Texto estilo="rotulo">
            {repaso.falladas.length === 1 ? 'La que fallaste' : 'Las que fallaste'}
          </Texto>
          {repaso.falladas.map((p) => (
            <FilaDeRepaso key={p.item.id} pregunta={p} />
          ))}
        </View>
      ) : (
        <Texto estilo="cuerpo">No fallaste ninguna.</Texto>
      )}

      {repaso.acertadas.length > 0 ? (
        <View className="gap-3">
          <Boton
            variante="plano"
            ancho={false}
            alTocar={() => setVerAcertadas((v) => !v)}
            etiqueta={
              verAcertadas
                ? 'Ocultar las que acertaste'
                : 'Ver las que acertaste'
            }
          >
            {verAcertadas ? 'Ocultar acertadas' : `Ver las ${repaso.acertadas.length} acertadas`}
          </Boton>

          {verAcertadas
            ? repaso.acertadas.map((p) => (
                <FilaDeRepaso key={p.item.id} pregunta={p} />
              ))
            : null}
        </View>
      ) : null}
    </View>
  );
}

/**
 * One question, with what was picked and why it was wrong.
 *
 * The explanation comes from `explicacionDe`, which prefers the one
 * written for the option actually chosen: after a wrong answer the
 * useful sentence is why THAT option was tempting, not a lecture on
 * all four.
 */
function FilaDeRepaso({ pregunta }: { pregunta: PreguntaDelRepaso }) {
  const { item, elegida, correcta, acerto, segundos, tema } = pregunta;
  const opciones = item.opciones;

  return (
    <Tarjeta variante="plana" className="gap-2">
      <Texto estilo="cuerpo">{item.pregunta}</Texto>

      <View className="flex-row flex-wrap items-center gap-2">
        {acerto ? <Chip tono="ganado">Acertaste</Chip> : null}
        {/* The per-question time, which `Answer.tiempoMs` has always
            recorded and nothing ever showed. */}
        {segundos !== null ? <Texto estilo="apoyo">{segundos}s</Texto> : null}
      </View>

      {/* The options themselves, not just their letters.
          «Marcaste D, era B» is useless by the time the learner is
          reading it: they answered four questions ago and do not
          remember what B said. Reported from a phone — «sabe que la
          correcta era la C, pero no recuerda qué decía la C, entonces
          queda en las mismas».
          Both lines, and only these two. The four options in full
          would turn a review into a re-read of the whole round. */}
      {!acerto ? (
        <View className="gap-1">
          <FilaDeOpcion
            rotulo="Marcaste"
            letra={elegida}
            texto={elegida ? opciones[elegida] : undefined}
            tono="fallo"
          />
          <FilaDeOpcion
            rotulo="Era"
            letra={correcta}
            texto={opciones[correcta]}
            tono="ganado"
          />
        </View>
      ) : null}

      <Texto estilo="apoyo">
        {explicacionDe(item, (elegida ?? correcta) as Letra)}
      </Texto>

      {tema ? <Texto estilo="apoyo">Tema: {temaLegible(tema)}</Texto> : null}
    </Tarjeta>
  );
}

/**
 * One option, with its letter and what it actually said.
 *
 * The text is what makes the letter mean anything. A bank question
 * can be missing an option the answer refers to — nothing in the
 * schema requires every letter to be present — so the text is
 * optional and the letter alone is still shown rather than rendering
 * an empty row.
 */
function FilaDeOpcion({
  rotulo,
  letra,
  texto,
  tono,
}: {
  rotulo: string;
  letra: string | null;
  texto: string | undefined;
  tono: 'fallo' | 'ganado';
}) {
  if (!letra) return null;

  return (
    <View className="flex-row items-start gap-2">
      {/* The word, not only the colour. Which row is the mistake and
          which is the answer has to survive being read by someone who
          cannot tell the two colours apart. */}
      <Chip tono={tono}>
        {rotulo} {letra}
      </Chip>
      <View className="flex-1">
        <Texto estilo="apoyo">{texto ?? '—'}</Texto>
      </View>
    </View>
  );
}
