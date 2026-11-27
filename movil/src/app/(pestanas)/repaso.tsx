import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import {
  Boton,
  Chip,
  Personaje,
  Tarjeta,
  Texto,
} from '@/shared/ui';
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

  const errores = datos?.pendientes ?? [];

  /**
   * The outstanding mistakes grouped by subject, with their counts.
   *
   * The artifact's rows are topics — «Mitosis», «Funciones» — and the
   * server does not send one: `errorPendiente` carries `area`, the
   * five ICFES subjects, and nothing finer. So a row is a subject, and
   * the count is how many questions in it are still outstanding.
   * Inventing topic names on the client would put a label on the
   * screen that nothing behind it can honour.
   */
  const temas = useMemo(() => {
    const porArea = new Map<Area, number>();
    for (const e of errores) {
      porArea.set(e.area as Area, (porArea.get(e.area as Area) ?? 0) + 1);
    }
    return [...porArea.entries()]
      .map(([a, cuantos]) => ({ area: a, cuantos }))
      .sort((x, y) => y.cuantos - x.cuantos);
  }, [errores]);

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  if (enSesion && errores.length > 0) {
    return (
      <SafeAreaView className="flex-1 bg-fondo">
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
    <SafeAreaView className="flex-1 bg-fondo" edges={['top']}>
      <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 py-5">
        <View className="gap-1.5">
          <Texto estilo="titulo">Repaso</Texto>
          <Texto estilo="apoyo">
            Lo que fallaste vuelve aquí hasta que deje de fallarse.
          </Texto>
        </View>

        {cargando ? <EsqueletoLista filas={3} /> : null}

        {fallo ? <Aviso mensaje={fallo.mensaje} detalle={fallo.detalle} /> : null}

        {/* One card, one row per subject. The old version had a
            progress bar, an area filter and an empty-state panel all
            stacked as separate bordered boxes; three boxes of equal
            weight meant none of them was the list. */}
        {temas.length > 0 ? (
          <Tarjeta className="gap-2.5">
            <Texto estilo="rotulo">Para hoy</Texto>
            {temas.map((t) => (
              <View
                key={t.area}
                className="min-h-toque flex-row items-center justify-between gap-3"
              >
                <View className="flex-1 gap-0.5">
                  {/* 14px semibold Inter, the artifact's row title. Not
                      a `Texto` style: the scale has no 14px semibold,
                      and adding one here for a single row would put a
                      tenth size in the system by the back door. The
                      registered face is still named outright, because
                      a family plus a weight does not resolve. */}
                  <Text
                    style={{ fontFamily: 'Inter_600SemiBold' }}
                    className="text-[14px] text-texto"
                  >
                    {NOMBRE_AREA[t.area]}
                  </Text>
                  <Texto estilo="apoyo">
                    {t.cuantos === 1 ? 'Una pregunta' : `${t.cuantos} preguntas`}
                  </Texto>
                </View>
                <Chip tono="fallo">
                  {t.cuantos === 1 ? '1 fallo' : `${t.cuantos} fallos`}
                </Chip>
              </View>
            ))}
          </Tarjeta>
        ) : null}

        {/* Progress, so the list has a visible end. A count going down
            is the only reward this screen offers, and it is the honest
            kind: it reports what happened. `plana` and below the list:
            it is how the learner is doing, not what they came to do. */}
        {resumen && total > 0 ? (
          <Tarjeta variante="plana" className="gap-2.5">
            <View className="flex-row items-baseline justify-between gap-3">
              <Texto estilo="rotulo">Ya corregidos</Texto>
              <Texto estilo="apoyo" style={{ fontFamily: 'Inter_700Bold' }}>
                {resumen.corregidos} de {total}
              </Texto>
            </View>
            <View className="h-[9px] overflow-hidden rounded-pildora bg-capa">
              {/* A width percentage is the one thing allowed inline:
                  there is no class for a computed fraction. The fill
                  and the radius stay in the className, or the compiled
                  background would be dropped. */}
              <View
                className="h-full bg-ganado"
                style={{ width: `${Math.round((resumen.corregidos / total) * 100)}%` }}
              />
            </View>
          </Tarjeta>
        ) : null}

        {/* The area filter, kept: it is the only way to work on one
            subject when the list is long. `plana`, because choosing a
            subject supports the card above rather than competing with
            it. */}
        {resumen && resumen.porArea.length > 1 ? (
          <Tarjeta variante="plana" className="gap-2.5">
            <Texto estilo="rotulo">¿Qué repasas?</Texto>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2 pr-2"
            >
              <Filtro
                activo={area === null}
                texto={`Todas · ${resumen.pendientes}`}
                onPress={() => setArea(null)}
              />
              {resumen.porArea.map((fila) => (
                <Filtro
                  key={fila.area}
                  activo={area === fila.area}
                  texto={`${NOMBRE_AREA[fila.area]} · ${fila.pendientes}`}
                  onPress={() => setArea(fila.area as Area)}
                />
              ))}
            </ScrollView>
          </Tarjeta>
        ) : null}

        {/* Nothing to review is good news, and the screen says so. The
            character is in `espera`: there is no failure to record.
            Two different kinds of nothing, and they are not the same
            message — one learner cleared their list, the other has not
            started. */}
        {!cargando && errores.length === 0 ? (
          <View className="items-center gap-4 py-6">
            <Personaje pose="espera" tamano={88} />
            <View className="gap-1.5">
              <Texto estilo="pregunta" className="text-center">
                Nada que repasar
              </Texto>
              <Texto estilo="apoyo" className="text-center">
                {resumen && resumen.corregidos > 0
                  ? 'Los que fallaste ya te salen. Entrena un rato y vuelve.'
                  : 'Aparecen aquí las que falles al entrenar.'}
              </Texto>
            </View>
          </View>
        ) : null}

        {errores.length > 0 ? (
          <View className="gap-2">
            <Boton alTocar={() => setEnSesion(true)}>
              {errores.length === 1 ? 'Repasar la que queda' : `Repasar los ${errores.length}`}
            </Boton>
            <Texto estilo="apoyo">
              Una a la vez. Las opciones cambian de orden, así que no vale acordarse de la
              letra.
            </Texto>
          </View>
        ) : (
          <Boton variante="contorno" alTocar={volver}>
            Entrenar
          </Boton>
        )}
      </ScrollView>

      {/* A sibling after the scroll, never inside it. */}
    </SafeAreaView>
  );
}

/**
 * One subject in the filter row.
 *
 * Not a `Chip`: a `Chip` is a fact that cannot be tapped, and this one
 * can. It is a small button, so it carries `selected` for a screen
 * reader and a 44pt touch height.
 */
function Filtro({
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
      className={`min-h-toque justify-center rounded-pildora border px-3.5 ${
        activo ? 'border-acento bg-acento-suave' : 'border-linea bg-capa'
      }`}
    >
      <Text
        style={{ fontFamily: 'Inter_600SemiBold' }}
        className={`text-[13px] ${activo ? 'text-acento-texto' : 'text-texto-apagado'}`}
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
