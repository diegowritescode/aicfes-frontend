import { ScrollView, Text, View } from 'react-native';
import {
  Avatar,
  BarraRespuesta,
  Boton,
  Chip,
  Cifra,
  Contexto,
  Opcion,
  Progreso,
  Tarjeta,
  Texto,
} from '@/shared/ui';
import { Aviso } from '@/shared/ui/Aviso';
import { EsqueletoPregunta } from '@/shared/ui/Esqueleto';
import { NOMBRE_AREA } from '@/shared/model/icfes';
import type { Letra } from '@/shared/model/icfes';
import { useRondaDeDuelo } from '../hooks/useRondaDeDuelo';
import type { ResultadoDuelo } from '../api/esquemas';

/**
 * Playing a duel.
 *
 * Deliberately unlike training: no right answer, no explanation, no
 * colour after a tap. Both players are scored on these questions, so
 * telling the first one whether they were right would hand them
 * nothing and telling them *why* would be grading a duel that is not
 * over.
 *
 * The explanation is worth having, which is why the result screen
 * points back at the review section rather than dropping it.
 *
 * The top row names the opponent rather than the subject. On every
 * other answering screen that slot is a subject label, but here the
 * person on the other side is the reason the learner opened it.
 */
export function PantallaRondaDeDuelo({
  dueloId,
  contra,
  onSalir,
  onRevancha,
  retando = false,
}: {
  dueloId: string;
  contra: string;
  onSalir: () => void;
  /** Challenge the same person again, from the result screen. */
  onRevancha?: () => void;
  retando?: boolean;
}) {
  const ronda = useRondaDeDuelo(dueloId);

  if (ronda.cargando) {
    return (
      <View className="flex-1 gap-4 px-5 py-5">
        <Texto estilo="rotulo">Duelo contra {contra}</Texto>
        <EsqueletoPregunta />
      </View>
    );
  }

  if (ronda.fallo) {
    return (
      <View className="flex-1 justify-center gap-4 px-5">
        <Aviso mensaje="No pudimos abrir el duelo" detalle={ronda.fallo.mensaje} />
        <Boton variante="contorno" alTocar={onSalir}>
          Volver
        </Boton>
      </View>
    );
  }

  if (ronda.entrega) {
    return (
      <Marcador
        entrega={ronda.entrega}
        contra={contra}
        onSalir={onSalir}
        onRevancha={onRevancha}
        retando={retando}
      />
    );
  }

  if (!ronda.pregunta) {
    return (
      /* Not an `Aviso`: that component is for errors, and using it
         here painted a finished round amber with a "OCULTAR DETALLE"
         toggle over it. Nothing went wrong — the learner answered
         five questions. */
      <View className="flex-1">
        <ScrollView className="flex-1" contentContainerClassName="flex-grow justify-center gap-5 px-5 py-5">
          <View className="gap-2">
            <Texto estilo="titulo" className="text-center">
              Listo para entregar
            </Texto>
            <Texto estilo="cuerpo" className="text-center">
              {ronda.sinResponder > 0
                ? `Dejaste ${ronda.sinResponder} sin responder. En un duelo adivinar siempre es mejor que dejar en blanco.`
                : `Respondiste las ${ronda.total}. Ahora falta ${contra}.`}
            </Texto>
          </View>

          {ronda.falloAlEntregar ? (
            <Aviso mensaje="No pudimos entregar" detalle={ronda.falloAlEntregar.mensaje} />
          ) : null}
        </ScrollView>

        <BarraRespuesta>
          <Boton
            alTocar={() => void ronda.entregar()}
            cargando={ronda.entregando}
            deshabilitado={ronda.entregando}
          >
            Entregar
          </Boton>
        </BarraRespuesta>
      </View>
    );
  }

  const letras = Object.keys(ronda.pregunta.opciones).sort() as Letra[];
  /* First name only. The row is 30px tall beside a chip, and a long
     alias wraps it onto two lines. */
  const primerNombre = contra.trim().split(/\s+/)[0] ?? contra;

  return (
    <View className="flex-1">
      <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 py-5">
        <View className="min-h-[30px] flex-row items-center justify-between gap-3">
          <View className="flex-1 flex-row items-center gap-2.5">
            <Avatar nombre={contra} tamano="chico" />
            <Text
              style={{ fontFamily: 'Inter_600SemiBold' }}
              className="flex-1 text-[13px] text-texto"
            >
              {primerNombre}
            </Text>
          </View>
          <Chip tono="acento">
            {ronda.numero} de {ronda.total}
          </Chip>
        </View>

        {/* No surcharge in a duel: both players get the same five, and
            failing does not add any. */}
        <Progreso
          hechas={ronda.numero - 1}
          total={ronda.total}
          dicho={`Pregunta ${ronda.numero} de ${ronda.total}, ${NOMBRE_AREA[ronda.pregunta.area]}`}
        />

        {ronda.pregunta.contexto ? <Contexto>{ronda.pregunta.contexto}</Contexto> : null}

        <Texto estilo="pregunta">{ronda.pregunta.pregunta}</Texto>

        <View className="gap-2.5">
          {letras.map((letra) => (
            <Opcion
              key={letra}
              letra={letra}
              /* Only 'elegida' or 'pendiente'. A duel never says whether
                 the choice was right: the other player has not answered
                 yet, and the score is settled on the server. */
              estado={ronda.eleccion === letra ? 'elegida' : 'pendiente'}
              alTocar={() => ronda.elegir(letra)}
            >
              {ronda.pregunta!.opciones[letra] ?? ''}
            </Opcion>
          ))}
        </View>

        <Texto estilo="apoyo" className="text-center">
          Nadie ve sus respuestas hasta que ambos entreguen.
        </Texto>
      </ScrollView>

      {/* Outside the scroll. With a long stimulus and four options the
          button lands past the fold, and a button nobody scrolls to is
          a button that does not exist.

          Not disabled when nothing is chosen. A learner who cannot
          answer should be able to move on; guessing is encouraged on
          the summary, not forced here. */}
      <BarraRespuesta>
        <Boton alTocar={ronda.siguiente}>{ronda.esUltima ? 'Terminar' : 'Siguiente'}</Boton>
      </BarraRespuesta>
    </View>
  );
}

/** The result, once both players have finished. */
function Marcador({
  entrega,
  contra,
  onSalir,
  onRevancha,
  retando,
}: {
  entrega: { miMarcador: ResultadoDuelo; delOtro?: ResultadoDuelo; esperandoAlOtro?: boolean; gane?: boolean; empate?: boolean };
  contra: string;
  onSalir: () => void;
  onRevancha?: () => void;
  retando?: boolean;
}) {
  const segundos = Math.round(entrega.miMarcador.segundos);

  if (entrega.esperandoAlOtro || !entrega.delOtro) {
    return (
      <View className="flex-1">
        <ScrollView className="flex-1" contentContainerClassName="flex-grow justify-center gap-5 px-5 py-5">
          <Texto estilo="rotulo">Entregado</Texto>

          {/* The figure stays in `texto`. Nothing has been won yet —
              the rival has not played — and green here would spend the
              one signal the palette has on a result that does not
              exist. */}
          <Tarjeta className="items-center gap-1.5">
            <Cifra valor={entrega.miMarcador.aciertos} unidad="de 5" />
            <Texto estilo="apoyo" className="text-center">
              {contra} todavía no juega su ronda. Le avisamos cuando termine.
            </Texto>
          </Tarjeta>

          <Tarjeta variante="plana" className="gap-2.5">
            <Texto estilo="rotulo">Lo que quedó anotado</Texto>
            <View className="flex-row flex-wrap gap-2">
              <Chip>{entrega.miMarcador.aciertos} de 5</Chip>
              <Chip>{segundos} s</Chip>
            </View>
          </Tarjeta>
        </ScrollView>

        <BarraRespuesta>
          <Boton ancho={false} alTocar={onSalir}>Listo</Boton>
        </BarraRespuesta>
      </View>
    );
  }

  const mios = entrega.miMarcador.aciertos;
  const suyos = entrega.delOtro.aciertos;
  const gano = entrega.gane === true;
  const empate = entrega.empate === true;

  /* Said in words, never left to the colour of a number. An empate
     reads as a loss to anyone who cannot tell the green from the grey,
     and the figure alone does not say whose five is whose. */
  const dicho = empate
    ? `Empataste con ${contra}`
    : gano
      ? `Le ganaste a ${contra}`
      : `${contra} te ganó`;

  return (
    <View className="flex-1">
      <ScrollView className="flex-1" contentContainerClassName="flex-grow justify-center gap-5 px-5 py-5">
        <Texto estilo="rotulo">Terminó</Texto>

        {/* Green only when the duel was won. A loss and a tie leave the
            figure in `texto`: the colour means «you earned this», and
            spending it on a result that was not earned is how it stops
            meaning anything. */}
        <Tarjeta className="items-center gap-1.5">
          <Cifra
            valor={mios}
            unidad={`contra ${suyos}`}
            tono={gano ? 'ganado' : 'texto'}
          />
          <Texto estilo="apoyo" className="text-center">
            {dicho}
          </Texto>
        </Tarjeta>

        <Tarjeta variante="plana" className="gap-2.5">
          <Texto estilo="rotulo">Lo que quedó anotado</Texto>
          <View className="flex-row flex-wrap gap-2">
            <Chip tono={gano ? 'ganado' : 'neutro'}>
              {mios} a {suyos}
            </Chip>
            {/* The server sends a total and a time, not which questions
                were missed, so there is no topic to name here. When
                `entregarDuelo` starts returning the per-question
                result, the missed topic belongs in this row as a
                `fallo` chip. */}
            {mios < 5 ? <Chip tono="fallo">{5 - mios} sin acertar</Chip> : null}
            <Chip>{segundos} s</Chip>
          </View>
        </Tarjeta>

        {/* The duel gave no explanations on purpose. This is where they
            are, so a lost duel turns into something to study. */}
        <Texto estilo="apoyo" className="text-center">
          Lo que fallaste aquí queda en Repaso, con la explicación.
        </Texto>
      </ScrollView>

      {/* Right here, while the result is still on screen. Having to
          go back, find the alias and search for it again is how a
          rematch stops happening — and the rematch is the whole point
          of a duel with someone you know. */}
      <BarraRespuesta>
        {onRevancha ? (
          <Boton ancho={false} alTocar={onRevancha} cargando={retando} deshabilitado={retando}>
            Revancha
          </Boton>
        ) : null}
        <Boton ancho={false} variante={onRevancha ? 'plano' : 'principal'} alTocar={onSalir}>
          Volver
        </Boton>
      </BarraRespuesta>
    </View>
  );
}
