import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Boton, Chip, Tarjeta, Texto } from '@/shared/ui';
import { Aviso } from '@/shared/ui/Aviso';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { useAmigos, usePerfilDeAmigo } from '@/features/duelos/hooks/useDuelos';
import { Avatar } from '@/features/perfil/components/Avatar';
import type { Amistad } from '@/features/duelos/api/esquemas';

/**
 * Friends, and the requests waiting on somebody.
 *
 * The API for all of this shipped long ago — `leerAmigos`,
 * `pedirAmistad`, `responderAmistad`, `quitarAmigo` and the
 * `useAmigos` hook were written, tested and never called by a single
 * screen. This is that screen.
 *
 * Requests to answer come first. They are the only part that is
 * waiting on this learner; everything else can be read whenever.
 */
export default function RutaAmigos() {
  const router = useRouter();
  const { cargando: cargandoSesion, autenticado } = useSesion();
  const amigos = useAmigos();

  /* Which friend's profile is open, if any. A screen rather than a
     route because it is a preview of a person already on this list —
     opening a URL for it would make a minor's profile a link that
     can be shared. */
  const [viendo, setViendo] = useState<string | null>(null);

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  if (viendo) {
    return <PerfilDeAmigo usuarioId={viendo} alCerrar={() => setViendo(null)} />;
  }

  const nadie =
    amigos.amigos.length === 0 &&
    amigos.porResponder.length === 0 &&
    amigos.enviadas.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-fondo" edges={['top', 'bottom']}>
      <ScrollView contentContainerClassName="gap-5 px-5 py-5">
        <View className="flex-row items-center justify-between gap-3">
          <Texto estilo="titulo-grande">Amigos</Texto>
          <Boton variante="plano" ancho={false} alTocar={() => router.back()}>
            Atrás
          </Boton>
        </View>

        {amigos.fallo ? (
          <Aviso mensaje={amigos.fallo.mensaje} detalle={amigos.fallo.detalle} />
        ) : null}

        {/* First, because it is the only thing waiting on them. */}
        {amigos.porResponder.length > 0 ? (
          <View className="gap-3">
            <Texto estilo="rotulo">Te pidieron ser amigos</Texto>
            {amigos.porResponder.map((a) => (
              <Tarjeta key={a.id} className="gap-3">
                <View className="flex-row items-center gap-3">
                  <Avatar alias={a.amigo.alias} />
                  <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
                    {a.amigo.alias ?? 'Sin nombre'}
                  </Texto>
                </View>
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Boton
                      alTocar={() =>
                        void amigos.responder({ id: a.id, acepta: true })
                      }
                      deshabilitado={amigos.respondiendo}
                    >
                      Aceptar
                    </Boton>
                  </View>
                  <View className="flex-1">
                    <Boton
                      variante="contorno"
                      alTocar={() =>
                        void amigos.responder({ id: a.id, acepta: false })
                      }
                      deshabilitado={amigos.respondiendo}
                    >
                      Rechazar
                    </Boton>
                  </View>
                </View>
              </Tarjeta>
            ))}
          </View>
        ) : null}

        {amigos.amigos.length > 0 ? (
          <View className="gap-3">
            <Texto estilo="rotulo">Tus amigos</Texto>
            {amigos.amigos.map((a) => (
              <FilaDeAmigo key={a.id} amistad={a} alAbrir={() => setViendo(a.amigo.id)} />
            ))}
          </View>
        ) : null}

        {/* Last and quiet: nothing to do here but wait. */}
        {amigos.enviadas.length > 0 ? (
          <View className="gap-3">
            <Texto estilo="rotulo">Esperando respuesta</Texto>
            {amigos.enviadas.map((a) => (
              <Tarjeta key={a.id} variante="plana" className="gap-2">
                <View className="flex-row items-center gap-3">
                  <Avatar alias={a.amigo.alias} tamano="chico" />
                  <View className="flex-1">
                    <Texto estilo="cuerpo">{a.amigo.alias ?? 'Sin nombre'}</Texto>
                  </View>
                  <Chip>pendiente</Chip>
                </View>
              </Tarjeta>
            ))}
          </View>
        ) : null}

        {nadie && !amigos.cargando ? (
          <View className="gap-2">
            <Texto estilo="cuerpo">Todavía no tienes amigos aquí.</Texto>
            <Texto estilo="apoyo">
              Búscalos por su nombre desde Duelos y rétalos. Para que te
              encuentren a ti, escoge un nombre en los ajustes de duelos.
            </Texto>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/** One friend, tappable to see their profile. */
function FilaDeAmigo({
  amistad,
  alAbrir,
}: {
  amistad: Amistad;
  alAbrir: () => void;
}) {
  return (
    <Tarjeta className="gap-3">
      <View className="flex-row items-center gap-3">
        <Avatar alias={amistad.amigo.alias} />
        <View className="flex-1">
          <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
            {amistad.amigo.alias ?? 'Sin nombre'}
          </Texto>
        </View>
      </View>
      <Boton variante="contorno" alTocar={alAbrir}>
        Ver perfil
      </Boton>
    </Tarjeta>
  );
}

/**
 * A friend's profile: who they are and what the two have played.
 *
 * The streak is the point of this screen. A win-loss record alone
 * invites one of them to stop playing while ahead; weeks in a row is
 * a number both of them own and both of them lose.
 */
function PerfilDeAmigo({
  usuarioId,
  alCerrar,
}: {
  usuarioId: string;
  alCerrar: () => void;
}) {
  const { perfil, cargando, fallo } = usePerfilDeAmigo(usuarioId);

  return (
    <SafeAreaView className="flex-1 bg-fondo" edges={['top', 'bottom']}>
      <ScrollView contentContainerClassName="gap-5 px-5 py-5">
        <View className="flex-row items-center justify-between gap-3">
          <Texto estilo="titulo-grande">Perfil</Texto>
          <Boton variante="plano" ancho={false} alTocar={alCerrar}>
            Atrás
          </Boton>
        </View>

        {fallo ? <Aviso mensaje={fallo.mensaje} detalle={fallo.detalle} /> : null}
        {cargando ? <Texto estilo="apoyo">Cargando…</Texto> : null}

        {perfil ? (
          <>
            <View className="items-center gap-3">
              <Avatar alias={perfil.alias} tamano="grande" />
              <Texto estilo="titulo">{perfil.alias ?? 'Sin nombre'}</Texto>
              {perfil.descripcion ? (
                <Texto estilo="apoyo" className="text-center">
                  {perfil.descripcion}
                </Texto>
              ) : null}
            </View>

            <Tarjeta className="gap-3">
              <Texto estilo="rotulo">Jugando juntos</Texto>

              {perfil.racha.semanas > 0 ? (
                <View className="gap-1">
                  <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
                    {perfil.racha.semanas}{' '}
                    {perfil.racha.semanas === 1 ? 'semana' : 'semanas'} seguidas
                  </Texto>
                  {/* Said plainly rather than with a warning colour:
                      the streak has a week of grace, so «falta esta
                      semana» is information, not an alarm. */}
                  {!perfil.racha.estaSemanaYa ? (
                    <Texto estilo="apoyo">
                      Esta semana todavía no han jugado.
                    </Texto>
                  ) : null}
                </View>
              ) : (
                <Texto estilo="apoyo">
                  {perfil.racha.duelos > 0
                    ? 'La racha se cortó. Un duelo esta semana la empieza otra vez.'
                    : 'Todavía no han jugado un duelo juntos.'}
                </Texto>
              )}

              {perfil.racha.duelos > 0 ? (
                <View className="flex-row flex-wrap items-center gap-2">
                  <Chip tono="ganado">{perfil.ganados} ganados</Chip>
                  <Chip tono="fallo">{perfil.perdidos} perdidos</Chip>
                  <Texto estilo="apoyo">de {perfil.racha.duelos}</Texto>
                </View>
              ) : null}
            </Tarjeta>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
