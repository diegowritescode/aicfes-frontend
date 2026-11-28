import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Redirect, useRouter } from 'expo-router';
import {
  CabeceraDePerfil,
  FilaEnlace,
  GrupoDeFilas,
  Tarjeta,
  Texto,
  TiraDeCifras,
  color,
} from '@/shared/ui';
import { EsqueletoPanel } from '@/shared/ui/Esqueleto';
import { useAmigos, usePerfilDeDuelos } from '@/features/duelos/hooks/useDuelos';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { useLogros, usePanel } from '@/features/panel/hooks/usePanel';
import {
  avanceDeNivel,
  misionesPendientes,
  muestraRacha,
} from '@/features/panel/model/reglas';

/**
 * This learner, as a profile rather than a dashboard.
 *
 * What this replaced stacked eight sections of numbers down one
 * scroll: the streak, the level with its bar, the XP breakdown, the
 * five subjects, the weekly report, the day's missions, the
 * achievements, two settings cards and a sign-out. Everything was on
 * screen and nothing was findable. Diego's words were that a user
 * would uninstall the app from the disorder — and he also could not
 * find his own profile here, because it was not here: his alias, his
 * avatar and his description lived behind the Jugar tab.
 *
 * The rule now: this screen shows WHO you are and HOW MUCH of
 * everything else there is. It does not show the everything else.
 * Each row names a destination and carries a count, so a learner
 * knows whether it is worth opening before they open it.
 *
 * Three figures survive inline — level, streak, friends — because
 * they answer «how am I doing», which is the question somebody opens
 * this tab with. The rest moved behind rows.
 *
 * The gear in the corner is what Diego asked for by name. Settings
 * are not a section of this screen any more; they are their own.
 */
export default function RutaYo() {
  const router = useRouter();
  const { cargando: cargandoSesion, autenticado } = useSesion();
  const { panel, cargando, recargar } = usePanel();
  const { logros } = useLogros();
  const perfilDuelos = usePerfilDeDuelos();
  const amigos = useAmigos();

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  const perfil = perfilDuelos.perfil;

  /* Every count below is `null` when its source has not answered,
     and the rows render «—» for it.

     This matters more than it looks. A row's value is there so a
     learner knows whether the door is worth opening, and every one
     of these degrades to a confident zero: no panel means «al día»
     on the challenges, no achievements means «0 de 0», no friend
     list means «0». All three are statements about the learner, and
     a request that failed is not evidence for any of them. */
  const misiones = panel ? misionesPendientes(panel) : null;
  const ganados = logros ? logros.filter((l) => l.achieved).length : null;
  /* Requests waiting on an answer are the one thing here that
     somebody else is waiting for, so the row carries them. */
  /* `cargando` is `isLoading`, which goes false once the request
     FAILS as well as when it succeeds — and the hook defaults the
     lists to `[]`, so a failed fetch would print a confident «0».
     The failure has to be checked too. */
  const sinAmigos = amigos.cargando || amigos.fallo !== null;
  const porResponder = sinAmigos ? null : amigos.porResponder.length;
  const cuantosAmigos = sinAmigos ? null : amigos.amigos.length;

  return (
    <SafeAreaView className="flex-1 bg-fondo">
      <ScrollView
        contentContainerClassName="gap-5 px-5 py-6"
        refreshControl={
          <RefreshControl refreshing={cargando} onRefresh={() => void recargar()} />
        }
      >
        <View className="flex-row items-center justify-between gap-3">
          <Texto estilo="titulo-grande">Yo</Texto>
          <BotonDeAjustes alTocar={() => router.push('/ajustes')} />
        </View>

        {/* The profile, which this screen did not have. The email
            that used to sit under the title moved to Ajustes: it is
            the one field that identifies the account off-app, and it
            has no business on a screen a learner shows a friend. */}
        <CabeceraDePerfil
          alias={perfil?.alias ?? null}
          descripcion={perfil?.descripcion}
          nota={
            perfil?.alias
              ? perfil.visible
                ? 'Tus compañeros pueden encontrarte'
                : 'Nadie puede encontrarte'
              : 'Escoge un nombre para jugar con otros'
          }
          accion={
            <Pressable
              onPress={() => router.push('/perfil-publico')}
              accessibilityRole="button"
              accessibilityLabel="Editar mi nombre y mi descripción"
              className="min-h-control justify-center px-4"
            >
              {({ pressed }) => (
                <Texto
                  estilo="cuerpo"
                  style={{ fontFamily: 'Inter_600SemiBold', opacity: pressed ? 0.6 : 1 }}
                  className="text-acento-texto"
                >
                  Editar perfil
                </Texto>
              )}
            </Pressable>
          }
        />

        {cargando && !panel ? <EsqueletoPanel /> : null}

        {/* The three numbers worth reading without opening anything.
            The reference design's figure strip, and the reason the
            rows below can stay free of numbers. */}
        {panel ? (
          <Tarjeta>
            <TiraDeCifras
              cifras={[
                { etiqueta: 'Nivel', valor: panel.level.level },
                {
                  etiqueta: muestraRacha(panel) ? 'Días de racha' : 'Racha',
                  valor: panel.streak.currentDays,
                },
                { etiqueta: 'Amigos', valor: cuantosAmigos ?? '—' },
              ]}
            />
          </Tarjeta>
        ) : null}

        {/* The level bar stays inline, alone. It is the one figure
            that moves within a day, and a learner who sees it inch
            forward is being told the session counted — which is the
            whole reason to put a bar anywhere. */}
        {panel ? (
          <Tarjeta className="gap-2">
            <View className="flex-row items-baseline justify-between">
              <Texto estilo="rotulo">Nivel {panel.level.level}</Texto>
              <Texto estilo="apoyo">
                {panel.level.currentXp} de {panel.level.nextLevelXp} XP
              </Texto>
            </View>
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
              {/* A width percentage is the one thing allowed inline:
                  there is no class for a computed fraction, and a
                  colour or a radius here would beat the compiled
                  class and lose the fill. */}
              <View
                className="h-full rounded-pildora bg-acento"
                style={{ width: `${avanceDeNivel(panel) * 100}%` }}
              />
            </View>
            {panel.streak.perdonUsado ? (
              <Texto estilo="apoyo" className="text-ganado">
                Te perdonamos un día de racha.
              </Texto>
            ) : null}
          </Tarjeta>
        ) : null}

        <View className="gap-3">
          <Texto estilo="rotulo">Mi progreso</Texto>
          <GrupoDeFilas>
            <FilaEnlace
              primera
              icono="grafico"
              titulo="Mis materias"
              detalle="Cómo vas en cada una de las cinco"
              alTocar={() => router.push('/materias')}
            />
            <FilaEnlace
              icono="rayo"
              tono={misiones && misiones.length > 0 ? 'fallo' : 'neutro'}
              titulo="Retos de hoy"
              /* The count is this row's whole job. Before, the
                 missions rendered in full here whether there were
                 three or none. */
              valor={
                misiones === null
                  ? '—'
                  : misiones.length > 0
                    ? `${misiones.length}`
                    : 'al día'
              }
              alTocar={() => router.push('/retos')}
            />
            <FilaEnlace
              icono="medalla"
              tono={ganados !== null && ganados > 0 ? 'ganado' : 'neutro'}
              titulo="Logros"
              valor={logros ? `${ganados} de ${logros.length}` : '—'}
              alTocar={() => router.push('/logros')}
            />
            <FilaEnlace
              ultima
              icono="libro"
              titulo="Informe de la semana"
              detalle="Qué mejoraste y qué te toca"
              alTocar={() => router.push('/informe')}
            />
          </GrupoDeFilas>
        </View>

        <View className="gap-3">
          <Texto estilo="rotulo">Social</Texto>
          <GrupoDeFilas>
            <FilaEnlace
              primera
              ultima
              icono="gente"
              tono={porResponder !== null && porResponder > 0 ? 'fallo' : 'acento'}
              titulo="Amigos"
              detalle={
                porResponder !== null && porResponder > 0
                  ? porResponder === 1
                    ? 'Una solicitud esperando tu respuesta'
                    : `${porResponder} solicitudes esperando tu respuesta`
                  : undefined
              }
              valor={cuantosAmigos === null ? '—' : `${cuantosAmigos}`}
              alTocar={() => router.push('/amigos')}
            />
          </GrupoDeFilas>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * The gear.
 *
 * A 44pt target around a 24px glyph: the icon is the size the design
 * wants and the hit area is the size a thumb needs, and those are not
 * the same number.
 */
function BotonDeAjustes({ alTocar }: { alTocar: () => void }) {
  return (
    <Pressable
      onPress={alTocar}
      accessibilityRole="button"
      accessibilityLabel="Ajustes"
      className="h-control w-control items-center justify-center"
    >
      {({ pressed }) => (
        <View style={{ opacity: pressed ? 0.6 : 1 }}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6"
              stroke={color.texto}
              strokeWidth={1.9}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"
              stroke={color.texto}
              strokeWidth={1.9}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      )}
    </Pressable>
  );
}
