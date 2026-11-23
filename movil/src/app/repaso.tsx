import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Boton } from '@/shared/ui/Boton';
import { Aviso } from '@/shared/ui/Aviso';
import { EsqueletoLista } from '@/shared/ui/Esqueleto';
import { NOMBRE_AREA, type Area, type Letra } from '@/shared/model/icfes';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { useRepaso } from '@/features/repaso/hooks/useRepaso';
import { useRegistrarRepaso } from '@/features/repaso/hooks/useRegistrarRepaso';
import { PantallaRepaso } from '@/features/repaso/components/PantallaRepaso';
import { ModalTutoria } from '@/features/tutoria/components/ModalTutoria';
import type { ErrorPendiente } from '@/features/repaso/api/esquemas';

/**
 * Reviewing mistakes.
 *
 * Two screens in one route. The first is a choice — how many are left
 * and in which area — and the second is the review itself, one
 * question at a time with nothing else on screen.
 *
 * They are separate because they are different activities: deciding
 * what to work on, and working on it. The listed version mixed them
 * and was reported as hard to concentrate in.
 */
export default function RutaRepaso() {
  const router = useRouter();
  const { cargando: cargandoSesion, autenticado } = useSesion();
  const { datos, cargando, fallo, area, setArea, recargar } = useRepaso();
  const registrar = useRegistrarRepaso(recargar);

  const [enSesion, setEnSesion] = useState(false);
  const [tutor, setTutor] = useState<{ error: ErrorPendiente; elegida: Letra } | null>(
    null,
  );

  const volver = useCallback(() => router.replace('/inicio'), [router]);

  const terminar = useCallback(() => {
    setEnSesion(false);
    recargar();
  }, [recargar]);

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  const errores = datos?.pendientes ?? [];

  if (enSesion && errores.length > 0) {
    return (
      <SafeAreaView className="flex-1 bg-wash">
        <PantallaRepaso
          errores={errores}
          onResponder={(intento) =>
            registrar.mutate({
              itemId: intento.itemId,
              area:
                errores.find((e) => e.itemId === intento.itemId)?.area ?? 'MAT',
              elegida: intento.elegida as Letra,
              acerto: intento.correcta,
            })
          }
          onPedirTutor={(error, elegida) => setTutor({ error, elegida })}
          onTerminar={terminar}
        />

        {/* Assembled here rather than inside the feature: a feature may
            not import another feature, and the route is what composes
            them. */}
        {tutor ? (
          <ModalTutoria
            item={aItemDeTutoria(tutor.error)}
            opcionElegida={tutor.elegida}
            visible
            onSalir={() => setTutor(null)}
            onReintentar={() => setTutor(null)}
          />
        ) : null}
      </SafeAreaView>
    );
  }

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

        {cargando ? <EsqueletoLista filas={3} /> : null}

        {fallo ? <Aviso mensaje={fallo.mensaje} detalle={fallo.detalle} /> : null}

        {/* Progress, so the list has a visible end. A count going down
            is the only reward this screen offers, and it is the honest
            kind: it reports what happened. */}
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

        {resumen && resumen.porArea.length > 1 ? (
          <View className="gap-2">
            <Text className="text-[12px] font-bold uppercase tracking-widest text-slate-400">
              ¿Qué repasas?
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2 pr-2"
            >
              <Chip
                activo={area === null}
                texto={`Todas · ${resumen.pendientes}`}
                onPress={() => setArea(null)}
              />
              {resumen.porArea.map((fila) => (
                <Chip
                  key={fila.area}
                  activo={area === fila.area}
                  texto={`${NOMBRE_AREA[fila.area]} · ${fila.pendientes}`}
                  onPress={() => setArea(fila.area as Area)}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {!cargando && errores.length === 0 ? (
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

        {errores.length > 0 ? (
          <View className="gap-2">
            <Boton onPress={() => setEnSesion(true)} ancho>
              {errores.length === 1
                ? 'Repasar la que queda'
                : `Repasar ${errores.length}`}
            </Boton>
            <Text className="text-[12px] leading-5 text-slate-400">
              Una a la vez. Las opciones cambian de orden, así que no vale
              acordarse de la letra.
            </Text>
          </View>
        ) : null}

        <Boton variante="contorno" onPress={volver} ancho>
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

/**
 * A pending mistake in the shape the tutor expects.
 *
 * The tutor was built for a generated item and needs the fields it
 * reads; the rest are absent from a review row because nothing needs
 * them. Casting here rather than widening the tutor's own type, which
 * would loosen a contract for one caller.
 */
function aItemDeTutoria(error: ErrorPendiente) {
  return {
    id: error.itemId,
    area: error.area,
    dificultad: 'media',
    contexto: error.contexto ?? '',
    pregunta: error.pregunta,
    opciones: error.opciones,
    respuesta_correcta: error.respuesta_correcta,
    explicaciones: error.explicaciones,
  } as never;
}
