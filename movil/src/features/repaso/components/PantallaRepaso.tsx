import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Boton } from '@/shared/ui/Boton';
import { NOMBRE_AREA, type Letra } from '@/shared/model/icfes';
import { OpcionRespuesta, type EstadoOpcion } from '@/shared/pregunta/components/OpcionRespuesta';
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

  const sesion: SesionDeRepaso = { errores, intentos, avanzadas };
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
      <View className="flex-1 justify-center gap-4 px-5">
        <Text className="text-[24px] font-bold tracking-tight text-slate-900">
          Repaso terminado
        </Text>
        <Text className="text-[14.5px] leading-6 text-slate-600">{cierre(sesion)}</Text>
        {r.corregidas < r.total ? (
          <Text className="text-[13px] leading-5 text-slate-500">
            Las que no salieron siguen en tu lista. No se pierden.
          </Text>
        ) : null}
        <Boton onPress={onTerminar} ancho>
          Volver
        </Boton>
      </View>
    );
  }

  if (!actual || !barajado) return null;

  const respondida = elegida !== null;
  const acerto = respondida && elegida === barajado.correcta;
  const letras = (['A', 'B', 'C', 'D'] as const).filter(
    (l) => barajado.opciones[l] !== undefined,
  );

  return (
    <ScrollView contentContainerClassName="gap-5 px-5 py-6">
      <View className="gap-1.5">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-[12px] font-bold uppercase tracking-widest text-slate-400">
            {avanzadas + 1} de {errores.length}
          </Text>
          <Text className="text-[12px] font-semibold text-slate-400">
            {NOMBRE_AREA[actual.area]}
          </Text>
        </View>
        <Text className="text-[13px] leading-5 text-slate-500">
          {actual.veces === 1
            ? 'La fallaste una vez.'
            : `La fallaste ${actual.veces} veces.`}
        </Text>
      </View>

      {actual.contexto ? (
        <View className="rounded-2xl border border-slate-200 bg-white p-4">
          <Text className="text-[13.5px] leading-6 text-slate-700">{actual.contexto}</Text>
        </View>
      ) : null}

      <Text className="text-[16px] font-semibold leading-6 text-slate-900">
        {actual.pregunta}
      </Text>

      <View className="gap-2.5">
        {letras.map((letra) => (
          <OpcionRespuesta
            key={letra}
            letra={letra}
            texto={barajado.opciones[letra]!}
            estado={estadoDe(letra, barajado.correcta, elegida)}
            bloqueada={respondida}
            onElegir={() => responder(letra)}
          />
        ))}
      </View>

      {respondida ? (
        <View
          className={`gap-2 rounded-2xl border p-4 ${
            acerto ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'
          }`}
        >
          <Text
            className={`text-[13px] font-bold uppercase tracking-wide ${
              acerto ? 'text-emerald-700' : 'text-slate-500'
            }`}
          >
            {acerto ? 'Ahora sí' : 'Todavía no'}
          </Text>
          <Text className="text-[13.5px] leading-6 text-slate-700">
            {explicacion(actual, barajado.aOriginal[elegida] ?? elegida)}
          </Text>
        </View>
      ) : null}

      {respondida && !acerto ? (
        <Boton
          variante="contorno"
          onPress={() => onPedirTutor(actual, barajado.aOriginal[elegida] ?? elegida)}
          ancho
        >
          Hablarlo con el tutor
        </Boton>
      ) : null}

      {respondida ? (
        <Boton onPress={seguir} ancho>
          {avanzadas + 1 >= errores.length ? 'Terminar' : 'Siguiente'}
        </Boton>
      ) : null}
    </ScrollView>
  );
}

function estadoDe(letra: Letra, correcta: Letra, elegida: Letra | null): EstadoOpcion {
  if (elegida === null) return 'pendiente';
  if (letra === correcta) return 'correcta';
  if (letra === elegida) return 'fallada';
  return 'descartada';
}

/** The explanation for what they picked, by its original letter. */
function explicacion(error: ErrorPendiente, original: string): string {
  return (
    error.explicaciones?.[original] ??
    error.explicaciones?.[error.respuesta_correcta] ??
    `La correcta es la que dice "${error.opciones[error.respuesta_correcta]}".`
  );
}
