import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Boton } from '@/shared/ui/Boton';
import { Aviso } from '@/shared/ui/Aviso';
import { NOMBRE_AREA, type Area, type Letra } from '@/shared/model/icfes';
import { OpcionRespuesta, type EstadoOpcion } from '@/shared/pregunta/components/OpcionRespuesta';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { useRepaso } from '@/features/repaso/hooks/useRepaso';
import { useRegistrarRepaso } from '@/features/repaso/hooks/useRegistrarRepaso';
import type { ErrorPendiente } from '@/features/repaso/api/esquemas';

/**
 * Working through what you got wrong.
 *
 * The question of the day is a nudge — one thing, today. This is the
 * tool: how many are left, in which areas, and whether the number is
 * going down. A learner who wants to clear their mistakes cannot do
 * it one card at a time with no sense of an end.
 */
export default function RutaRepaso() {
  const router = useRouter();
  const { cargando: cargandoSesion, autenticado } = useSesion();
  const { datos, cargando, fallo, area, setArea, recargar } = useRepaso();
  const registrar = useRegistrarRepaso(recargar);

  const [abierta, setAbierta] = useState<string | null>(null);
  const [elegida, setElegida] = useState<Letra | null>(null);

  const responder = useCallback(
    (error: ErrorPendiente, letra: Letra) => {
      if (elegida !== null) return;
      setElegida(letra);
      registrar.mutate({
        itemId: error.itemId,
        area: error.area,
        elegida: letra,
        acerto: letra === error.respuesta_correcta,
      });
    },
    [elegida, registrar],
  );

  const abrir = useCallback((itemId: string) => {
    setAbierta((previo) => (previo === itemId ? null : itemId));
    setElegida(null);
  }, []);

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  const resumen = datos?.resumen;
  const total = (resumen?.pendientes ?? 0) + (resumen?.corregidos ?? 0);

  return (
    <SafeAreaView className="flex-1 bg-wash">
      <ScrollView contentContainerClassName="gap-5 px-5 py-6">
        <View className="gap-2">
          <Text className="text-[26px] font-bold tracking-tight text-slate-900">
            Repasar errores
          </Text>
          <Text className="text-[14px] leading-6 text-slate-600">
            Lo que fallaste en los últimos 30 días y todavía no te sale.
          </Text>
        </View>

        {cargando ? (
          <Text className="text-[14px] text-slate-500">Buscando tus errores…</Text>
        ) : null}

        {fallo ? <Aviso mensaje={fallo.mensaje} detalle={fallo.detalle} /> : null}

        {/* Progress, so the list has a visible end. A count going down
            is the only reward this screen offers, and it is the honest
            kind: it reports what happened rather than granting a
            point. */}
        {resumen && total > 0 ? (
          <View className="gap-2 rounded-2xl border border-slate-200 bg-white p-4">
            <View className="flex-row items-baseline justify-between">
              <Text className="text-[13px] font-semibold text-slate-700">
                {resumen.corregidos} corregidos de {total}
              </Text>
              <Text className="text-[13px] font-bold text-slate-900">
                {resumen.pendientes} pendientes
              </Text>
            </View>
            <View className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <View
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${Math.round((resumen.corregidos / total) * 100)}%` }}
              />
            </View>
          </View>
        ) : null}

        {/* The filter only appears when there is something to filter:
            one area's worth of mistakes does not need a chooser. */}
        {resumen && resumen.porArea.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 pr-2"
          >
            <Chip activo={area === null} texto="Todas" onPress={() => setArea(null)} />
            {resumen.porArea.map((fila) => (
              <Chip
                key={fila.area}
                activo={area === fila.area}
                texto={`${NOMBRE_AREA[fila.area]} · ${fila.pendientes}`}
                onPress={() => setArea(fila.area as Area)}
              />
            ))}
          </ScrollView>
        ) : null}

        {!cargando && datos && datos.pendientes.length === 0 ? (
          <View className="gap-3 rounded-2xl border border-slate-200 bg-white p-5">
            <Text className="text-[15px] font-semibold text-slate-900">
              {resumen && resumen.corregidos > 0
                ? 'No te queda ninguno pendiente'
                : 'Todavía no hay nada que repasar'}
            </Text>
            <Text className="text-[13.5px] leading-6 text-slate-600">
              {resumen && resumen.corregidos > 0
                ? 'Los que fallaste ya te salen. Entrena un rato y vuelve.'
                : 'Aparecen aquí las que falles al entrenar.'}
            </Text>
          </View>
        ) : null}

        {datos?.pendientes.map((error) => (
          <TarjetaError
            key={error.itemId}
            error={error}
            abierta={abierta === error.itemId}
            elegida={abierta === error.itemId ? elegida : null}
            onAbrir={() => abrir(error.itemId)}
            onResponder={(letra) => responder(error, letra)}
          />
        ))}

        <Boton variante="contorno" onPress={() => router.replace('/inicio')} ancho>
          Volver al inicio
        </Boton>
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({
  activo,
  texto,
  onPress,
}: {
  activo: boolean;
  texto: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      className={`rounded-full border px-3.5 py-2 ${
        activo ? 'border-brand-bright bg-sky-50' : 'border-slate-200 bg-white'
      }`}
    >
      <Text
        className={`text-[13px] font-semibold ${
          activo ? 'text-brand-bright' : 'text-slate-600'
        }`}
      >
        {texto}
      </Text>
    </Pressable>
  );
}

const LETRAS: readonly Letra[] = ['A', 'B', 'C', 'D'];

/**
 * One mistake, collapsed until tapped.
 *
 * Collapsed because a Lectura Crítica item carries its stimulus, and
 * twenty of those expanded is a wall nobody reads. The header says
 * enough to choose: the area, how many times it was missed.
 */
function TarjetaError({
  error,
  abierta,
  elegida,
  onAbrir,
  onResponder,
}: {
  error: ErrorPendiente;
  abierta: boolean;
  elegida: Letra | null;
  onAbrir: () => void;
  onResponder: (letra: Letra) => void;
}) {
  const respondida = elegida !== null;
  const acerto = respondida && elegida === error.respuesta_correcta;
  const letras = LETRAS.filter((l) => error.opciones[l] !== undefined);

  return (
    <View className="gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <Pressable
        onPress={onAbrir}
        accessibilityRole="button"
        accessibilityState={{ expanded: abierta }}
        className="gap-1"
      >
        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-[12px] font-bold uppercase tracking-widest text-slate-400">
            {NOMBRE_AREA[error.area]}
          </Text>
          <Text className="text-[12px] font-semibold text-slate-400">
            {error.veces === 1 ? 'fallada 1 vez' : `fallada ${error.veces} veces`}
          </Text>
        </View>
        <Text
          className="text-[14px] leading-5 text-slate-800"
          numberOfLines={abierta ? undefined : 2}
        >
          {error.pregunta}
        </Text>
      </Pressable>

      {abierta ? (
        <>
          {error.contexto ? (
            <View className="rounded-xl bg-slate-50 p-3">
              <Text className="text-[13px] leading-6 text-slate-700">{error.contexto}</Text>
            </View>
          ) : null}

          <View className="gap-2.5">
            {letras.map((letra) => (
              <OpcionRespuesta
                key={letra}
                letra={letra}
                texto={error.opciones[letra]!}
                estado={estadoDe(error, letra, elegida)}
                bloqueada={respondida}
                onElegir={() => onResponder(letra)}
              />
            ))}
          </View>

          {respondida ? (
            <View
              className={`gap-2 rounded-xl p-3.5 ${
                acerto ? 'bg-emerald-50' : 'bg-slate-50'
              }`}
            >
              <Text
                className={`text-[12.5px] font-bold uppercase tracking-wide ${
                  acerto ? 'text-emerald-700' : 'text-slate-500'
                }`}
              >
                {acerto ? 'Ahora sí' : `Era ${error.respuesta_correcta}`}
              </Text>
              <Text className="text-[13px] leading-6 text-slate-700">
                {error.explicaciones?.[elegida] ??
                  error.explicaciones?.[error.respuesta_correcta] ??
                  `La correcta es ${error.respuesta_correcta}.`}
              </Text>
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

function estadoDe(
  error: ErrorPendiente,
  letra: Letra,
  elegida: Letra | null,
): EstadoOpcion {
  if (elegida === null) return 'pendiente';
  if (letra === error.respuesta_correcta) return 'correcta';
  if (letra === elegida) return 'fallada';
  return 'descartada';
}
