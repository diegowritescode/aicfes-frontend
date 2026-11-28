import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Boton, FilaEnlace, GrupoDeFilas, Texto } from '@/shared/ui';
import { useAccionesSesion, useSesion } from '@/features/sesion/hooks/useSesion';
import { usePerfilDeDuelos } from '@/features/duelos/hooks/useDuelos';
import { useRecordatorio } from '@/features/recordatorio/hooks/useRecordatorio';
import { usePanel } from '@/features/panel/hooks/usePanel';
import { temaMasFlojo } from '@/features/recordatorio/model/mensaje';

/**
 * Settings, as their own screen.
 *
 * They were a section at the bottom of «Yo», under the streak, the
 * level, the XP breakdown, the missions and the achievements — which
 * meant the one part of that screen made of decisions rather than
 * numbers was the part you had to scroll furthest to reach. Worse,
 * the duel settings were somewhere else entirely, behind a button on
 * the Jugar tab, so «my name in the app» and «who can find me» lived
 * in a different place from «block apps» and «remind me».
 *
 * This is the one place. Reached by the gear in «Yo», which is where
 * a gear belongs: on the screen about you, not in the tab bar — a
 * sixth tab for something opened twice a month would cost every
 * other tab its label width.
 *
 * Rows, not cards. A settings screen is a list of doors, and the
 * value on the right of each one («activo», «3 bloqueados») is what
 * stops it from being a list of blind doors.
 */
export default function RutaAjustes() {
  const router = useRouter();
  const { sesion, cargando: cargandoSesion, autenticado } = useSesion();
  const { salir } = useAccionesSesion();
  const perfilDuelos = usePerfilDeDuelos();
  const { panel } = usePanel();
  /* Read for one thing: whether the reminder row says «activo» or
     «apagado». The hook needs the weak topic to word its message. */
  const recordatorio = useRecordatorio(temaMasFlojo(panel?.areaProgress ?? []));

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  const perfil = perfilDuelos.perfil;

  return (
    <SafeAreaView className="flex-1 bg-fondo" edges={['top', 'bottom']}>
      <ScrollView contentContainerClassName="gap-6 px-5 py-5">
        <View className="flex-row items-center justify-between gap-3">
          <Texto estilo="titulo-grande">Ajustes</Texto>
          <Boton variante="plano" ancho={false} alTocar={() => router.back()}>
            Atrás
          </Boton>
        </View>

        {/* First, because it is the only group where something can be
            wrong without the learner knowing: an account with no
            alias or no guardian authorisation silently cannot be
            found, and nothing else says so. */}
        <View className="gap-3">
          <Texto estilo="rotulo">Mi cuenta</Texto>
          <GrupoDeFilas>
            <FilaEnlace
              primera
              icono="gente"
              titulo="Mi nombre y mi descripción"
              detalle="Cómo te encuentran y lo que ven de ti"
              /* «—» while the profile has not arrived, not «sin
                 nombre». The row's value exists so somebody knows
                 whether a door is worth opening, and asserting
                 «sin nombre» over a request that failed tells a
                 learner their alias is gone. */
              valor={perfil ? (perfil.alias ?? 'sin nombre') : '—'}
              alTocar={() => router.push('/perfil-publico')}
            />
            <FilaEnlace
              icono="candado"
              tono={perfil?.visible ? 'ganado' : 'neutro'}
              titulo="Privacidad"
              detalle="Quién te encuentra y qué puede ver"
              /* The server's own word for it, not a guess assembled
                 from three booleans. Three things have to be true at
                 once — alias, switch, guardian — and a screen that
                 recomputes that will eventually disagree with the
                 search.

                 «—» until it has answered: «oculto» is a claim about
                 the account, and a failed request is not evidence
                 for it. */
              valor={perfil ? (perfil.visible ? 'visible' : 'oculto') : '—'}
              alTocar={() => router.push('/privacidad')}
            />
            <FilaEnlace
              ultima
              icono="escudo"
              titulo="Bloqueados"
              detalle="Personas que no pueden encontrarte ni retarte"
              alTocar={() => router.push('/bloqueados')}
            />
          </GrupoDeFilas>
        </View>

        <View className="gap-3">
          <Texto estilo="rotulo">Estudio</Texto>
          <GrupoDeFilas>
            <FilaEnlace
              primera
              icono="candado"
              tono="alerta"
              titulo="Bloquear apps"
              detalle="Cinco preguntas antes de entrar"
              alTocar={() => router.push('/bloqueo')}
            />
            <FilaEnlace
              ultima
              icono="campana"
              tono={recordatorio.activo ? 'ganado' : 'neutro'}
              titulo="Recordatorio diario"
              detalle="Una notificación a la hora que escojas"
              /* The hook holds the hour as a number (6–22), so it
                 is written out here. `legible` lives in the
                 recordatorio feature's model and a route may read
                 it, but one hour needs no import. */
              valor={
                recordatorio.activo ? `${recordatorio.hora}:00` : 'apagado'
              }
              alTocar={() => router.push('/recordatorio')}
            />
          </GrupoDeFilas>
        </View>

        {/* Only on a phone whose account actually moderates. */}
        {perfil?.esModerador ? (
          <View className="gap-3">
            <Texto estilo="rotulo">Moderación</Texto>
            <GrupoDeFilas>
              <FilaEnlace
                primera
                ultima
                icono="bandera"
                tono="alerta"
                titulo="Denuncias"
                detalle="La cola de reportes por revisar"
                alTocar={() => router.push('/moderacion')}
              />
            </GrupoDeFilas>
          </View>
        ) : null}

        <View className="gap-3">
          <Texto estilo="rotulo">Sesión</Texto>
          {/* The email lives here and nowhere else. It is the one
              field that identifies the account off-app, so it belongs
              on the screen you open on purpose — not on a profile
              another learner might be looking at over your shoulder. */}
          {sesion?.email ? (
            <Texto estilo="apoyo" className="px-1">
              {sesion.email}
            </Texto>
          ) : null}
          <GrupoDeFilas>
            <FilaEnlace
              primera
              ultima
              icono="salir"
              tono="neutro"
              titulo="Cerrar sesión"
              alTocar={() => {
                /* Navigate explicitly rather than waiting for the
                   session query to re-render this screen into its own
                   redirect: leaving is an action the learner took and
                   should not depend on a cache notification. */
                void salir().then(() => router.replace('/entrar'));
              }}
            />
          </GrupoDeFilas>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
