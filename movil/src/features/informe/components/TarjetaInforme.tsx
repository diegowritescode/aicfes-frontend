import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Boton, Chip, Tarjeta, Texto } from '@/shared/ui';
import { NOMBRE_AREA } from '@/shared/model/icfes';
import { useInformeSemanal } from '../hooks/useInformeSemanal';
import type { AccionDelPlan, TemaDebil } from '../api/esquemas';

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
 * The area travels as a query parameter so the drill opens already
 * pointed at it. The topic does not, yet: `POST /api/items/generate`
 * accepts a `tema` and nothing on this side passes one, so sending it
 * in the URL would be a parameter the drill silently drops — the
 * learner would tap «practicar ángulos» and get mixed questions from
 * Matemáticas.
 *
 * That is the one thing left to make the plan fully worth its keys.
 * It runs from the bank's draw through the generator to this screen,
 * so it is its own piece of work rather than a line here.
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
          alTocar={() => router.push(`/entrenar?area=${accion.area}`)}
          etiqueta={`Practicar ${NOMBRE_AREA[accion.area]}`}
        >
          Practicar
        </Boton>
      </View>
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
