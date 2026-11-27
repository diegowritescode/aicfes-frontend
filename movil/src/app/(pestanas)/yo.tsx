import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Boton, Tarjeta, Texto } from '@/shared/ui';
import { EsqueletoPanel } from '@/shared/ui/Esqueleto';
import { usePerfilDeDuelos } from '@/features/duelos/hooks/useDuelos';
import { useRecordatorio } from '@/features/recordatorio/hooks/useRecordatorio';
import { TarjetaRecordatorio } from '@/features/recordatorio/components/TarjetaRecordatorio';
import { temaMasFlojo } from '@/features/recordatorio/model/mensaje';
import { useAccionesSesion, useSesion } from '@/features/sesion/hooks/useSesion';
import { useDesgloseXp, useLogros, usePanel } from '@/features/panel/hooks/usePanel';
import { SeccionLogros } from '@/features/panel/components/SeccionLogros';
import { DesgloseXp } from '@/features/panel/components/DesgloseXp';
import { avanceDeNivel, misionesPendientes } from '@/features/panel/model/reglas';

/**
 * Everything the learner is, rather than what to do next.
 *
 * The fifth tab existed in `BarraPestanas` and routed nowhere, so the
 * tab was dead on arrival. This is what it is for, and it is also
 * where the dashboard's accumulated self-measurement went: the level
 * and its bar, where the XP came from, today's missions, the
 * achievements, the reminder setting, who is signed in and the way
 * out. All of it is worth having and none of it is today's work —
 * which is why the dashboard reads as a dashboard again now that it
 * is here instead.
 *
 * Deliberately not a settings screen with a list of rows: the numbers
 * come first because they are the reason anyone opens this, and
 * signing out is last because it is the one action here that is hard
 * to undo on a phone whose owner has forgotten their password.
 */
export default function RutaYo() {
  const router = useRouter();
  const { sesion, cargando: cargandoSesion, autenticado } = useSesion();
  const { salir } = useAccionesSesion();
  const { panel, cargando, recargar } = usePanel();
  const { logros } = useLogros();
  const { desglose } = useDesgloseXp();
  /* Read for one thing only: whether to offer moderation at all.
     Shared with the duels screen, so it costs no extra request. */
  const perfilDuelos = usePerfilDeDuelos();
  /* The route reads the dashboard and hands the topic down, because a
     feature may not import another feature. */
  const temaDeHoy = temaMasFlojo(panel?.areaProgress ?? []);
  const recordatorio = useRecordatorio(temaDeHoy);

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  const misiones = panel ? misionesPendientes(panel) : [];

  return (
    <SafeAreaView className="flex-1 bg-fondo">
      {/* The connection and failure notices are not repeated here.
          They belong on the screen the learner opens first, and this
          one degrades quietly instead: every section renders nothing
          when its query has nothing, which is the behaviour each of
          those components already had. */}
      <ScrollView
        contentContainerClassName="gap-5 px-5 py-6"
        refreshControl={
          <RefreshControl refreshing={cargando} onRefresh={() => void recargar()} />
        }
      >
        <View className="gap-1">
          <Texto estilo="titulo">Yo</Texto>
          {sesion?.email ? <Texto estilo="apoyo">{sesion.email}</Texto> : null}
        </View>

        {cargando && !panel ? <EsqueletoPanel /> : null}

        {panel ? (
          <Tarjeta className="gap-2">
            <Texto estilo="rotulo">Nivel</Texto>
            <Texto estilo="titulo">{panel.level.level}</Texto>
            <View
              className="h-1.5 overflow-hidden rounded-pildora bg-capa-alta"
              accessibilityRole="progressbar"
              accessibilityLabel={`Nivel ${panel.level.level}, ${panel.level.currentXp} de ${panel.level.nextLevelXp} XP`}
              accessibilityValue={{
                min: 0,
                max: panel.level.nextLevelXp,
                now: panel.level.currentXp,
              }}
            >
              {/* Width as a percentage is the one thing allowed in a
                  `style` object: there is no class for a computed
                  fraction, and a colour or a radius here would
                  override the compiled class and lose the fill. */}
              <View
                className="h-full rounded-pildora bg-acento"
                style={{ width: `${avanceDeNivel(panel) * 100}%` }}
              />
            </View>
            <Texto estilo="apoyo">
              {panel.level.currentXp} de {panel.level.nextLevelXp} XP
            </Texto>
          </Tarjeta>
        ) : null}

        {/* Right after the level, because that is the number it
            explains. */}
        <DesgloseXp datos={desglose} />

        {misiones.length > 0 ? (
          <View className="gap-3">
            <Texto estilo="rotulo">Retos de hoy</Texto>
            {misiones.slice(0, 3).map((m) => (
              <Tarjeta key={m.id} className="gap-2">
                <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
                  {m.title}
                </Texto>
                <View
                  className="h-1.5 overflow-hidden rounded-pildora bg-capa-alta"
                  /* Decoration over the numbers written underneath, so
                     hidden rather than read out twice. */
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <View
                    className="h-full rounded-pildora bg-acento"
                    style={{ width: `${Math.min(100, (m.progress / m.target) * 100)}%` }}
                  />
                </View>
                <Texto estilo="apoyo">
                  {m.progress} de {m.target} · {m.xpReward} XP
                </Texto>
              </Tarjeta>
            ))}
          </View>
        ) : null}

        {/* After the day's missions: those are for today, these are
            what the weeks add up to. */}
        <SeccionLogros logros={logros} />

        {/* A setting, not today's work — which is the whole reason
            this screen exists. */}
        <TarjetaRecordatorio
          activo={recordatorio.activo}
          hora={recordatorio.hora}
          permiso={recordatorio.permiso}
          temaDeHoy={recordatorio.temaDeHoy}
          onActivar={(h) => void recordatorio.activar(h)}
          onCancelar={() => void recordatorio.cancelar()}
        />

        {/* Only on a phone whose account actually moderates. It was
            behind the drawer, which the tab bar replaced, so without
            this there is no way to reach the queue at all. */}
        {perfilDuelos.perfil?.esModerador ? (
          <Boton variante="contorno" alTocar={() => router.push('/moderacion')}>
            Denuncias
          </Boton>
        ) : null}

        {/* `plano`, and last. Leaving is not what this screen is for,
            and a filled button here would compete with everything
            above it for the one thing a learner should rarely do. */}
        <Boton
          variante="plano"
          alTocar={() => {
            /* Navigate explicitly rather than waiting for the session
               query to re-render this screen into its own
               `<Redirect>`. Leaving is an action the learner took; it
               should not depend on a cache notification arriving. */
            void salir().then(() => router.replace('/entrar'));
          }}
        >
          Salir
        </Boton>
      </ScrollView>

    </SafeAreaView>
  );
}
