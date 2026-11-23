import { useEffect } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Boton } from '@/shared/ui/Boton';
import { Aviso } from '@/shared/ui/Aviso';
import { AvisoConexion } from '@/shared/conexion/AvisoConexion';
import { useConexion } from '@/shared/conexion/useConexion';
import { useLote } from '@/features/offline/hooks/useLote';
import { useCola } from '@/features/offline/hooks/useCola';
import { NOMBRE_AREA } from '@/shared/model/icfes';
import { useAccionesSesion, useSesion } from '@/features/sesion/hooks/useSesion';
import { useErrorDelDia, useLogros, usePanel } from '@/features/panel/hooks/usePanel';
import { TarjetaErrorDelDia } from '@/features/panel/components/TarjetaErrorDelDia';
import { SeccionLogros } from '@/features/panel/components/SeccionLogros';
import { esRespondible } from '@/features/panel/model/errorDelDia';
import {
  avanceDeNivel,
  filasDeArea,
  misionesPendientes,
  muestraRacha,
} from '@/features/panel/model/reglas';

/**
 * The dashboard.
 *
 * Pull to refresh, because a phone is the one place people expect it
 * and because finishing a session elsewhere should be visible here
 * without closing the app.
 */
export default function RutaInicio() {
  const router = useRouter();
  const { sesion, cargando: cargandoSesion, autenticado } = useSesion();
  const { salir } = useAccionesSesion();
  const { panel, cargando, fallo, recargar } = usePanel();
  const { pregunta, registrar } = useErrorDelDia();
  const { logros } = useLogros();
  const conexion = useConexion();
  const lote = useLote();
  const cola = useCola();

  /* Top the offline pool up here, on the screen the learner opens
     most, and only with a connection. The toll runs when there is no
     network, so the questions have to arrive before then — and this is
     the moment we know we can fetch them. */
  useEffect(() => {
    if (conexion !== 'con-red') return;
    if (!lote.necesitaRelleno) return;
    void lote.rellenar();
  }, [conexion, lote.necesitaRelleno, lote.rellenar]);

  /* And send whatever was answered offline. Same trigger, different
     direction: a toll block cleared without data has to reach the
     server, or the learner's streak disagrees with what they did. */
  useEffect(() => {
    if (conexion !== 'con-red') return;
    if (cola.pendientes === 0) return;
    void cola.sincronizar();
  }, [conexion, cola.pendientes, cola.sincronizar]);

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  const filas = panel ? filasDeArea(panel) : [];
  const misiones = panel ? misionesPendientes(panel) : [];

  return (
    <SafeAreaView className="flex-1 bg-wash">
      <ScrollView
        contentContainerClassName="gap-5 px-5 py-6"
        refreshControl={
          <RefreshControl refreshing={cargando} onRefresh={() => void recargar()} />
        }
      >
        <View className="gap-1">
          <Text className="text-[12px] font-bold uppercase tracking-widest text-slate-400">
            Tu progreso
          </Text>
          <Text className="text-[22px] font-bold text-slate-900">{sesion?.email}</Text>
        </View>

        {/* Before the error, because with no network the network is the
            explanation — and a failure message about the server is
            misleading when the phone never reached it. */}
        <AvisoConexion conexion={conexion} hayDatos={panel !== null} esDeCache={!!panel && !!fallo} />

        {fallo && conexion !== 'sin-red' ? (
          <Aviso mensaje={fallo.mensaje} detalle={fallo.detalle} />
        ) : null}

        {panel ? (
          <>
            <View className="flex-row gap-3">
              <View className="flex-1 gap-1 rounded-2xl border border-slate-200 bg-white p-4">
                <Text className="text-[11.5px] font-bold uppercase tracking-widest text-slate-400">
                  Nivel
                </Text>
                <Text className="text-[24px] font-bold text-slate-900">{panel.level.level}</Text>
                <View className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <View
                    className="h-full rounded-full bg-brand-bright"
                    style={{ width: `${avanceDeNivel(panel) * 100}%` }}
                  />
                </View>
                <Text className="text-[12px] text-slate-500">
                  {panel.level.currentXp} de {panel.level.nextLevelXp} XP
                </Text>
              </View>

              {/* A streak of zero is a reproach, not encouragement. */}
              {muestraRacha(panel) ? (
                <View className="flex-1 gap-1 rounded-2xl border border-slate-200 bg-white p-4">
                  <Text className="text-[11.5px] font-bold uppercase tracking-widest text-slate-400">
                    Racha
                  </Text>
                  <Text className="text-[24px] font-bold text-slate-900">
                    {panel.streak.currentDays}
                  </Text>
                  <Text className="text-[12px] text-slate-500">
                    {panel.streak.currentDays === 1 ? 'día seguido' : 'días seguidos'}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Nothing to say is said by saying nothing: an empty card
                takes the same room as a useful one. */}
            {/* Answerable only when the server sent the options and the
                right answer. An older backend sends neither, and a card
                with four blank buttons is worse than a card that waits. */}
            {pregunta && !pregunta.resueltoHoy && esRespondible(pregunta) ? (
              <TarjetaErrorDelDia
                pregunta={pregunta}
                alResponder={(elegida, acerto) =>
                  registrar.mutate({ elegida, acerto, pregunta })
                }
              />
            ) : null}

            <View className="gap-3">
              <Text className="text-[13px] font-bold uppercase tracking-widest text-slate-500">
                Por área, lo más flojo primero
              </Text>
              {filas.map((f) => (
                <View key={f.area} className="gap-2 rounded-2xl border border-slate-200 bg-white p-4">
                  <View className="flex-row items-baseline justify-between">
                    <Text className="text-[14px] font-semibold text-slate-800">
                      {NOMBRE_AREA[f.area]}
                    </Text>
                    <Text className="text-[14px] font-bold text-slate-700">
                      {f.medida ? `${f.porcentaje}%` : '—'}
                    </Text>
                  </View>
                  <View className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <View
                      className={`h-full rounded-full ${
                        f.porcentaje < 70 ? 'bg-alerta' : 'bg-exito'
                      }`}
                      style={{ width: `${f.medida ? Math.max(2, f.porcentaje) : 0}%` }}
                    />
                  </View>
                  <Text className="text-[12.5px] text-slate-500">
                    {f.medida
                      ? `${f.aciertos} de ${f.preguntas} correctas`
                      : 'Todavía sin practicar'}
                  </Text>
                </View>
              ))}
            </View>

            {misiones.length > 0 ? (
              <View className="gap-3">
                <Text className="text-[13px] font-bold uppercase tracking-widest text-slate-500">
                  Retos de hoy
                </Text>
                {misiones.slice(0, 3).map((m) => (
                  <View key={m.id} className="gap-2 rounded-2xl border border-slate-200 bg-white p-4">
                    <Text className="text-[14px] font-semibold text-slate-800">{m.title}</Text>
                    <View className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <View
                        className="h-full rounded-full bg-brand-bright"
                        style={{ width: `${Math.min(100, (m.progress / m.target) * 100)}%` }}
                      />
                    </View>
                    <Text className="text-[12px] text-slate-500">
                      {m.progress} de {m.target} · {m.xpReward} XP
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* After the day's missions: those are for today, these are
                what the weeks add up to. */}
            <SeccionLogros logros={logros} />
          </>
        ) : null}

        <View className="gap-3">
          <Tarjeta
            titulo="Entrenar"
            texto="Sabes al instante si acertaste, y puedes hablar con el tutor cuando no."
            accion="Entrenar ahora"
            onPress={() => router.push('/entrenar')}
          />
          <Tarjeta
            titulo="Modo intensivo"
            texto={
              lote.listo
                ? `${lote.disponibles} preguntas listas para usar sin internet.`
                : 'Conéctate un momento para descargar preguntas.'
            }
            accion="Probar el peaje"
            onPress={() => router.push('/peaje')}
          />
          <Tarjeta
            titulo="Contrarreloj"
            texto="Con el cronómetro corriendo, porque en el examen el tiempo cuenta."
            accion="Ir a contrarreloj"
            onPress={() => router.push('/contrarreloj')}
          />
          <Tarjeta
            titulo="Simulacro"
            texto="Como el examen real: puedes saltar, volver y cambiar. La nota llega al final."
            accion="Ir al simulacro"
            onPress={() => router.push('/simulacro')}
          />
        </View>

        <Boton
          variante="suave"
          onPress={() => {
            /* Navigate explicitly rather than waiting for the session
               query to re-render this screen into its own `<Redirect>`.
               Leaving is an action the learner took; it should not
               depend on a cache notification arriving. */
            void salir().then(() => router.replace('/entrar'));
          }}
        >
          Cerrar sesión
        </Boton>
      </ScrollView>
    </SafeAreaView>
  );
}

function Tarjeta({
  titulo,
  texto,
  accion,
  onPress,
}: {
  titulo: string;
  texto: string;
  accion: string;
  onPress: () => void;
}) {
  return (
    <View className="gap-2 rounded-2xl border border-slate-200 bg-white p-5">
      <Text className="text-[16px] font-bold text-slate-900">{titulo}</Text>
      <Text className="text-[13.5px] leading-6 text-slate-600">{texto}</Text>
      <Boton variante="contorno" onPress={onPress}>
        {accion}
      </Boton>
    </View>
  );
}
