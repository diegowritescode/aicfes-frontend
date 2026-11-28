import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Avatar, Boton, Chip, Tarjeta, Texto } from '@/shared/ui';
import { Aviso } from '@/shared/ui/Aviso';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { useAmigos, useMisDuelos } from '@/features/duelos/hooks/useDuelos';
import { PantallaPerfil } from '@/features/duelos/components/PantallaPerfil';
import type { Amistad } from '@/features/duelos/api/esquemas';
import { desdeCuando } from '@/features/duelos/model/fechas';

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
  /* Only for «Retar» on an open profile. Shares the query the duels
     screen reads, so it costs no extra request. */
  const duelos = useMisDuelos();

  /* Which friend's profile is open, if any. A screen rather than a
     route because it is a preview of a person already on this list —
     opening a URL for it would make a minor's profile a link that
     can be shared. */
  const [viendo, setViendo] = useState<string | null>(null);

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  if (viendo) {
    return (
      /* The same profile a stranger gets, which is the point: one
         screen, and the server decides which fields it carries.
         What this replaced showed an alias, a description and the
         weeks-in-a-row card — the level, the subjects and the
         achievements were never on it, and Diego's word for that was
         «pobre». The together-streak was kept and now sits under the
         head-to-head. */
      <SafeAreaView className="flex-1 bg-fondo" edges={['top', 'bottom']}>
        <PantallaPerfil
          usuarioId={viendo}
          alCerrar={() => setViendo(null)}
          /* Actually sends the challenge, then lands on the duels
             list where the new duel is waiting. An earlier version
             of this just navigated and dropped the id, which is a
             button that says «Retar» and does not. */
          alRetar={async (id) => {
            await duelos.retar(id).catch(() => null);
            setViendo(null);
            router.push('/duelos');
          }}
        />
      </SafeAreaView>
    );
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
                  <Avatar
                    nombre={a.amigo.alias ?? ""}
                    figura={a.amigo.avatar}
                    color={a.amigo.avatarColor}
                  />
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

        {/* Last, and it says why it can do nothing yet.
            The first version showed a name, an avatar and a chip
            reading «pendiente», and that was all. Diego tapped one of
            these expecting the profile to open: an avatar and a name
            on a card look exactly like the rows above, which do open.
            The row cannot open a profile — the server refuses one
            without an accepted friendship, and it is right to, since
            a profile readable before the other person agrees turns a
            friend request into a way to look at their account. So the
            row has to say so itself. */}
        {amigos.enviadas.length > 0 ? (
          <View className="gap-3">
            <Texto estilo="rotulo">Esperando respuesta</Texto>
            <Texto estilo="apoyo">
              Podrás ver su perfil cuando acepten.
            </Texto>
            {amigos.enviadas.map((a) => (
              <FilaEnviada
                key={a.id}
                amistad={a}
                alCancelar={() => void amigos.quitar(a.amigo.id)}
                cancelando={amigos.quitando}
              />
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

/**
 * A request this learner sent, and the only thing they can do about it.
 *
 * Deliberately not tappable, and deliberately not silent about it. The
 * card above it opens a profile; this one cannot, because the server
 * will not serve a profile without an accepted friendship. Looking the
 * same as a row that opens and then doing nothing is the worst of the
 * three options — it reads as the app being broken.
 *
 * «Cancelar» exists because a request with no way out is a dead row
 * the learner carries forever. It reuses `quitarAmigo`: on the server
 * a pending request and a friendship are the same record, so removing
 * either is one call.
 */
function FilaEnviada({
  amistad,
  alCancelar,
  cancelando,
}: {
  amistad: Amistad;
  alCancelar: () => void;
  cancelando: boolean;
}) {
  const nombre = amistad.amigo.alias ?? 'Sin nombre';

  return (
    <Tarjeta variante="plana" className="gap-3">
      <View className="flex-row items-center gap-3">
        <Avatar nombre={nombre} tamano="chico" />
        <View className="flex-1">
          <Texto estilo="cuerpo">{nombre}</Texto>
          <Texto estilo="apoyo">Le pediste ser amigos {desdeCuando(amistad.creadoEn)}</Texto>
        </View>
        <Chip>pendiente</Chip>
      </View>
      <Boton
        variante="plano"
        alTocar={alCancelar}
        deshabilitado={cancelando}
        etiqueta={`Cancelar la solicitud a ${nombre}`}
      >
        Cancelar
      </Boton>
    </Tarjeta>
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
  const nombre = amistad.amigo.alias ?? 'Sin nombre';

  /* The whole row opens the profile, not only the button.
     The first version put the press on the button alone, and the
     avatar beside it was a plain `View`. A circle with somebody's
     initials in it reads as the thing you tap to see that person —
     Diego tapped Sofía's «S» and nothing happened, with no sign that
     it was not a control. Either the avatar responds or it should not
     look like a target; making the row the target is the smaller
     change and matches `AvisoDeDuelos`.

     The button stays. It is what makes the row's purpose readable to
     somebody who has not learnt that cards here are tappable, and it
     is the only part a screen reader announces as a control. */
  return (
    <Pressable
      onPress={alAbrir}
      accessibilityRole="button"
      accessibilityLabel={`Ver el perfil de ${nombre}`}
    >
      {({ pressed }) => (
        <Tarjeta className="gap-3" style={{ opacity: pressed ? 0.7 : 1 }}>
          <View className="flex-row items-center gap-3">
            <Avatar
              nombre={amistad.amigo.alias ?? ""}
              figura={amistad.amigo.avatar}
              color={amistad.amigo.avatarColor}
            />
            <View className="flex-1">
              <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
                {nombre}
              </Texto>
            </View>
          </View>
          {/* Not a `Boton`: it sits inside a Pressable, and a control
              inside a control is two tap targets over one area and two
              things for a screen reader to announce. This is the label
              that says what the row does. */}
          <Texto estilo="apoyo" className="text-acento">
            Ver perfil
          </Texto>
        </Tarjeta>
      )}
    </Pressable>
  );
}
