import { ScrollView, Text, View } from 'react-native';
import { Boton } from '@/shared/ui/Boton';
import { Aviso } from '@/shared/ui/Aviso';
import { EsqueletoPregunta } from '@/shared/ui/Esqueleto';
import { OpcionRespuesta } from '@/shared/pregunta/components/OpcionRespuesta';
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
 */
export function PantallaRondaDeDuelo({
  dueloId,
  contra,
  onSalir,
}: {
  dueloId: string;
  contra: string;
  onSalir: () => void;
}) {
  const ronda = useRondaDeDuelo(dueloId);

  if (ronda.cargando) {
    return (
      <View className="flex-1 gap-4 px-5 py-6">
        <Text className="text-[13px] font-semibold uppercase tracking-wide text-slate-500">
          Duelo contra {contra}
        </Text>
        <EsqueletoPregunta />
      </View>
    );
  }

  if (ronda.fallo) {
    return (
      <View className="flex-1 justify-center gap-4 px-5">
        <Aviso mensaje="No pudimos abrir el duelo" detalle={ronda.fallo.mensaje} />
        <Boton variante="contorno" onPress={onSalir}>
          Volver
        </Boton>
      </View>
    );
  }

  if (ronda.entrega) {
    return <Marcador entrega={ronda.entrega} contra={contra} onSalir={onSalir} />;
  }

  if (!ronda.pregunta) {
    return (
      <View className="flex-1 justify-center gap-4 px-5">
        <Aviso
          tono="aviso"
          mensaje="Listo para entregar"
          detalle={
            ronda.sinResponder > 0
              ? `Dejó ${ronda.sinResponder} sin responder. En un duelo adivinar siempre es mejor que dejar en blanco.`
              : 'Respondió las cinco.'
          }
        />
        {ronda.falloAlEntregar ? (
          <Aviso mensaje="No pudimos entregar" detalle={ronda.falloAlEntregar.mensaje} />
        ) : null}
        <Boton
          onPress={() => void ronda.entregar()}
          cargando={ronda.entregando}
          deshabilitado={ronda.entregando}
        >
          Entregar
        </Boton>
      </View>
    );
  }

  const letras = Object.keys(ronda.pregunta.opciones).sort() as Letra[];

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 py-6">
      <View className="gap-1">
        <Text className="text-[13px] font-semibold uppercase tracking-wide text-slate-500">
          Duelo contra {contra}
        </Text>
        <Text className="text-[13px] text-slate-500">
          Pregunta {ronda.numero} de {ronda.total} · {NOMBRE_AREA[ronda.pregunta.area]}
        </Text>
        <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <View
            className="h-full rounded-full bg-brand-bright"
            style={{ width: `${Math.round(ronda.avance * 100)}%` }}
          />
        </View>
      </View>

      {ronda.pregunta.contexto ? (
        <Text className="text-[15px] leading-6 text-slate-700">{ronda.pregunta.contexto}</Text>
      ) : null}

      <Text className="text-[17px] font-semibold leading-7 text-slate-900">
        {ronda.pregunta.pregunta}
      </Text>

      <View className="gap-2.5">
        {letras.map((letra) => (
          <OpcionRespuesta
            key={letra}
            letra={letra}
            texto={ronda.pregunta!.opciones[letra] ?? ''}
            /* Only 'elegida' or 'pendiente'. A duel never says whether
               the choice was right: the other player has not answered
               yet, and the score is settled on the server. */
            estado={ronda.eleccion === letra ? 'elegida' : 'pendiente'}
            bloqueada={false}
            onElegir={() => ronda.elegir(letra)}
          />
        ))}
      </View>

      {/* Not disabled when nothing is chosen. A learner who cannot
          answer should be able to move on; guessing is encouraged on
          the summary, not forced here. */}
      <Boton onPress={ronda.siguiente}>{ronda.esUltima ? 'Terminar' : 'Siguiente'}</Boton>
      <Text className="text-center text-[12px] text-slate-400">
        Nadie ve sus respuestas hasta que ambos entreguen.
      </Text>
    </ScrollView>
  );
}

/** The result, once both players have finished. */
function Marcador({
  entrega,
  contra,
  onSalir,
}: {
  entrega: { miMarcador: ResultadoDuelo; delOtro?: ResultadoDuelo; esperandoAlOtro?: boolean; gane?: boolean; empate?: boolean };
  contra: string;
  onSalir: () => void;
}) {
  if (entrega.esperandoAlOtro || !entrega.delOtro) {
    return (
      <View className="flex-1 justify-center gap-5 px-5">
        <Text className="text-center text-[22px] font-bold text-slate-900">Entregado</Text>
        <Text className="text-center text-[15px] leading-6 text-slate-600">
          {contra} todavía no juega su ronda. Le avisamos cuando termine.
        </Text>
        <Text className="text-center text-[13px] text-slate-500">
          Acertó {entrega.miMarcador.aciertos} de 5 en {Math.round(entrega.miMarcador.segundos)} segundos.
        </Text>
        <Boton onPress={onSalir}>Listo</Boton>
      </View>
    );
  }

  const titulo = entrega.empate ? 'Empate' : entrega.gane ? '¡Ganó!' : `Ganó ${contra}`;

  return (
    <View className="flex-1 justify-center gap-6 px-5">
      <Text className="text-center text-[26px] font-bold text-slate-900">{titulo}</Text>

      <View className="gap-3 rounded-2xl bg-slate-50 p-4">
        <Fila nombre="Usted" marcador={entrega.miMarcador} />
        <Fila nombre={contra} marcador={entrega.delOtro} />
      </View>

      {/* The duel gave no explanations on purpose. This is where they
          are, so a lost duel turns into something to study. */}
      <Text className="text-center text-[13px] leading-5 text-slate-500">
        Lo que falló aquí queda en Repasar errores, con la explicación.
      </Text>

      <Boton onPress={onSalir}>Listo</Boton>
    </View>
  );
}

function Fila({ nombre, marcador }: { nombre: string; marcador: ResultadoDuelo }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-[15px] font-semibold text-slate-800">{nombre}</Text>
      <Text className="text-[15px] text-slate-600">
        {marcador.aciertos}/5 · {Math.round(marcador.segundos)}s
      </Text>
    </View>
  );
}
