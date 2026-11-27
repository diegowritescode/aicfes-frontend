import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Boton, Chip, Tarjeta, Texto } from '@/shared/ui';
import { NOMBRE_AREA } from '@/shared/model/icfes';
import { useInformeSemanal } from '../hooks/useInformeSemanal';
import type {
  AccionDelPlan,
  SeguimientoDelPlan,
  TemaDebil,
  TemaDeLaSemana,
} from '../api/esquemas';

/**
 * Where this learner stands, once a week.
 *
 * The figures come from `datos`, which is what the server handed the
 * model, and never from the prose. The model is not allowed a number
 * — the schema it answers with has no numeric field — and reading one
 * out of `resumen` here would give back exactly what that rule was
 * protecting.
 *
 * The plan is the part that does something. Each action carries an
 * area and a topic the item bank can answer, so «practicar esto»
 * opens a drill on that topic instead of a general one.
 */

/** What each kind of mistake means, in words a sixteen-year-old uses. */
const ERROR_LEGIBLE: Record<string, string> = {
  error_calculo: 'te equivocas en las cuentas',
  confunde_conceptos: 'mezclas dos ideas parecidas',
  interpretacion_parcial: 'lees solo una parte del enunciado',
};

export function TarjetaInforme() {
  const { informe, cargando, fallo } = useInformeSemanal();

  /* Nothing while it loads: this sits below the level card on a
     screen that already has something to read, and a skeleton for a
     card that may not exist is a promise the screen might not keep. */
  if (cargando || fallo) return null;

  if (!informe) return <SinInforme />;

  const { datos } = informe;
  const masLento = datos.segundosPorPregunta > datos.segundosDelExamenReal;

  return (
    <View className="gap-3">
      <View className="flex-row items-baseline justify-between gap-3">
        <Texto estilo="rotulo">Cómo vas</Texto>
        <Texto estilo="apoyo">{informe.semana}</Texto>
      </View>

      <Tarjeta className="gap-3">
        <Texto estilo="cuerpo">{informe.resumen}</Texto>

        {/* The pace line, and only when there is a session behind it.
            «90 segundos por pregunta» computed from a week with no
            practice is a number about nothing. */}
        {!datos.semanaVacia ? (
          <View className="flex-row flex-wrap items-center gap-2">
            <Chip tono={masLento ? 'fallo' : 'ganado'}>
              {datos.segundosPorPregunta}s por pregunta
            </Chip>
            <Texto estilo="apoyo">
              {masLento
                ? `el examen te da ${datos.segundosDelExamenReal}s`
                : `vas dentro de los ${datos.segundosDelExamenReal}s del examen`}
            </Texto>
          </View>
        ) : null}
      </Tarjeta>

      {/* Last week's plan first: it is the only part that asks «did you
          do what we agreed», and burying it under new findings is how
          a plan stops being something the learner is held to. */}
      {datos.planAnterior.length > 0 ? (
        <View className="gap-2">
          <Texto estilo="rotulo">Lo que quedó de la semana pasada</Texto>
          {datos.planAnterior.map((accion) => (
            <FilaSeguimiento key={`${accion.area}:${accion.tema}`} accion={accion} />
          ))}
        </View>
      ) : null}

      {/* The window. Strengths per topic live here and nowhere else:
          `temasDebiles` only returns what goes badly, so before this
          a strength could only ever be «vas bien en Matemáticas». */}
      {datos.semana7dias && datos.semana7dias.fuertes.length > 0 ? (
        <View className="gap-2">
          <Texto estilo="rotulo">Lo que te salió bien</Texto>
          {datos.semana7dias.fuertes.map((t) => (
            <FilaTemaSemana key={`${t.area}:${t.tema}`} tema={t} tono="ganado" />
          ))}
        </View>
      ) : null}

      {/* Slow is its own section because it is its own problem: the
          exam gives 64 seconds a question, and a topic answered right
          but at triple the pace is a topic that will run out of time.
          An accuracy percentage cannot show it. */}
      {datos.semana7dias && datos.semana7dias.lentos.length > 0 ? (
        <View className="gap-2">
          <Texto estilo="rotulo">Donde te demoras</Texto>
          {datos.semana7dias.lentos.map((t) => (
            <FilaTemaSemana key={`${t.area}:${t.tema}`} tema={t} tono="fallo" />
          ))}
        </View>
      ) : null}

      {datos.temasDebiles.length > 0 ? (
        <View className="gap-2">
          <Texto estilo="rotulo">Lo que te viene costando</Texto>
          {/* Three at most. The server ranks five; a list of five
              weaknesses on the screen that is supposed to help reads
              as a list of five accusations. */}
          {datos.temasDebiles.slice(0, 3).map((t) => (
            <FilaTema key={`${t.area}:${t.tema}`} tema={t} />
          ))}
        </View>
      ) : null}

      {informe.plan.length > 0 ? (
        <View className="gap-2">
          <Texto estilo="rotulo">Esta semana</Texto>
          {informe.plan.map((accion) => (
            <FilaDelPlan key={`${accion.area}:${accion.tema}`} accion={accion} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/**
 * One weak topic, with what kind of mistake it is.
 *
 * The mistake type is the useful half. «Fallas ángulos» tells a
 * learner something they already suspected; «fallas ángulos porque te
 * equivocas en las cuentas, no porque no entiendas» tells them what
 * to do differently, and those two are fixed in opposite ways.
 */
function FilaTema({ tema }: { tema: TemaDebil }) {
  const explicacion = tema.errorTipico ? ERROR_LEGIBLE[tema.errorTipico] : null;

  return (
    <Tarjeta variante="plana" className="gap-1">
      <View className="flex-row items-baseline justify-between gap-3">
        <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
          {tema.tema.replace(/-/g, ' ')}
        </Texto>
        <Texto estilo="apoyo">{tema.aciertoPorcentaje}%</Texto>
      </View>
      <Texto estilo="apoyo">
        {NOMBRE_AREA[tema.area]} · {tema.respondidas} respondidas
        {explicacion ? ` · ${explicacion}` : ''}
      </Texto>
    </Tarjeta>
  );
}

/**
 * One action, and the way to start it.
 *
 * Both the area AND the topic travel, which is what makes the plan
 * worth its keys. The topic used to stop here: it reached the request
 * and died in `ItemBankService.draw`, which filtered on area and
 * difficulty only and answers before the generator — so «practicar
 * ángulos» served mixed Matemáticas while every layer in between
 * looked correct.
 *
 * Aimed at contrarreloj rather than at entrenar. A plan action is one
 * specific topic, and five questions against the clock is a round the
 * learner finishes; entrenar is the long form and the place to go
 * when they choose their own subject.
 */
function FilaDelPlan({ accion }: { accion: AccionDelPlan }) {
  const router = useRouter();

  return (
    <Tarjeta className="gap-2">
      <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
        {accion.titulo}
      </Texto>
      <Texto estilo="apoyo">{accion.detalle}</Texto>
      <View className="mt-1">
        <Boton
          variante="contorno"
          alTocar={() =>
            router.push(
              `/contrarreloj?area=${accion.area}&tema=${encodeURIComponent(accion.tema)}`,
            )
          }
          etiqueta={`Practicar ${accion.tema.replace(/-/g, ' ')}`}
        >
          Practicar
        </Boton>
      </View>
    </Tarjeta>
  );
}

/**
 * One topic as it went this week, with its pace.
 *
 * The seconds are the figure that was being thrown away:
 * `Answer.tiempoMs` is written on every answer and was read by
 * nobody, so every «seconds per question» in the product came from
 * dividing a session's duration by its question count — which counts
 * reading, pauses and the phone face down on a desk. This is the
 * median of the real per-answer times on this topic.
 */
function FilaTemaSemana({
  tema,
  tono,
}: {
  tema: TemaDeLaSemana;
  tono: 'ganado' | 'fallo';
}) {
  return (
    <Tarjeta variante="plana" className="gap-1">
      <View className="flex-row items-baseline justify-between gap-3">
        <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
          {tema.tema.replace(/-/g, ' ')}
        </Texto>
        <Chip tono={tono}>{tema.aciertoPorcentaje}%</Chip>
      </View>
      <Texto estilo="apoyo">
        {NOMBRE_AREA[tema.area]} · {tema.respondidas} esta semana
        {tema.segundosMediana !== null ? ` · ${tema.segundosMediana}s cada una` : ''}
      </Texto>
    </Tarjeta>
  );
}

/**
 * One action from last week's plan, and what became of it.
 *
 * Three states, said plainly. «No lo tocaste» is the one worth
 * showing rather than hiding: dropping it would pretend the action
 * never existed, and the learner knows it did.
 */
function FilaSeguimiento({ accion }: { accion: SeguimientoDelPlan }) {
  const texto = accion.sinTocar
    ? 'No lo practicaste esta semana.'
    : accion.aciertoPorcentaje === null
      ? `Lo tocaste ${accion.respondidas} ${accion.respondidas === 1 ? 'vez' : 'veces'}: muy poco para medir.`
      : `${accion.respondidas} preguntas, ${accion.aciertoPorcentaje}% de acierto.`;

  return (
    <Tarjeta variante="plana" className="gap-1">
      <View className="flex-row items-baseline justify-between gap-3">
        <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
          {accion.titulo}
        </Texto>
        {accion.sinTocar ? (
          <Chip tono="neutro">pendiente</Chip>
        ) : accion.aciertoPorcentaje !== null ? (
          <Chip tono={accion.aciertoPorcentaje >= 70 ? 'ganado' : 'fallo'}>
            {accion.aciertoPorcentaje}%
          </Chip>
        ) : null}
      </View>
      <Texto estilo="apoyo">{texto}</Texto>
    </Tarjeta>
  );
}

/**
 * What the screen says before there is a report.
 *
 * Named rather than silent. A learner who has answered a handful of
 * questions and sees nothing where a report goes assumes it is
 * broken; one who is told it needs a couple of topics' worth of
 * practice knows what to do about it.
 *
 * The threshold is the server's: `temasDebiles` will not name a topic
 * with fewer than four answers, and the report needs two topics.
 */
function SinInforme() {
  return (
    <View className="gap-3">
      <Texto estilo="rotulo">Cómo vas</Texto>
      <Tarjeta variante="plana" className="gap-1">
        <Texto estilo="cuerpo">Todavía no hay suficiente para escribirte un informe.</Texto>
        <Texto estilo="apoyo">
          Practica unos días más y aquí aparece qué te está costando y qué hacer
          con ello.
        </Texto>
      </Tarjeta>
    </View>
  );
}
