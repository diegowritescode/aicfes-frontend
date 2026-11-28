import { ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Boton, Tarjeta, Texto } from '@/shared/ui';
import { Aviso } from '@/shared/ui/Aviso';
import { EsqueletoLista } from '@/shared/ui/Esqueleto';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { usePerfilDeDuelos } from '@/features/duelos/hooks/useDuelos';

/**
 * Who can find this learner, and what they get to see.
 *
 * Two switches, and keeping them separate is the whole point of the
 * screen. `aliasBuscable` has always meant «I want to be findable».
 * It has never meant «I want strangers reading how I am doing in
 * mathematics», and when the public profile started carrying the
 * level, the streak and the subjects, serving them off that one flag
 * would have changed what every learner who already picked an alias
 * had agreed to. So the progress got its own switch, off by default,
 * and this is where both live side by side — which is also the only
 * way somebody can see that they are two different decisions.
 *
 * The guardian's authorisation is here too rather than in its own
 * flow. It is the gate under both switches: without it neither does
 * anything, and splitting it off would make it feel like a formality
 * instead of the thing that turns the social half of the app on.
 */
export default function RutaPrivacidad() {
  const router = useRouter();
  const { cargando: cargandoSesion, autenticado } = useSesion();
  const perfilDuelos = usePerfilDeDuelos();

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  const perfil = perfilDuelos.perfil;

  /* Nothing on this screen may be rendered from an absent profile.
     Every statement here — «nadie te encuentra», «falta la
     autorización de tu acudiente», both switches off — is FALSE by
     default, and a failed request would assert all of them at once:
     a learner whose network dropped would be told their account is
     unauthorised and invisible, and handed a button to declare a
     guardian's permission they already gave.

     So the screen waits, and says so if it cannot load. */
  if (!perfil) {
    return (
      <SafeAreaView className="flex-1 bg-fondo" edges={['top', 'bottom']}>
        <ScrollView contentContainerClassName="gap-5 px-5 py-5">
          <View className="flex-row items-center justify-between gap-3">
            <Texto estilo="titulo-grande">Privacidad</Texto>
            <Boton variante="plano" ancho={false} alTocar={() => router.back()}>
              Atrás
            </Boton>
          </View>

          {perfilDuelos.cargando ? <EsqueletoLista filas={3} /> : null}

          {!perfilDuelos.cargando ? (
            <Aviso
              mensaje={
                perfilDuelos.fallo?.mensaje ??
                'No pudimos cargar tus ajustes de privacidad.'
              }
              detalle={perfilDuelos.fallo?.detalle}
            />
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const autorizado = Boolean(perfil.tutorAutorizoEn);

  return (
    <SafeAreaView className="flex-1 bg-fondo" edges={['top', 'bottom']}>
      <ScrollView contentContainerClassName="gap-6 px-5 py-5">
        <View className="flex-row items-center justify-between gap-3">
          <Texto estilo="titulo-grande">Privacidad</Texto>
          <Boton variante="plano" ancho={false} alTocar={() => router.back()}>
            Atrás
          </Boton>
        </View>

        {/* The state, in the server's own words. Three things have to
            be true at once for an account to be findable, and a
            learner who has two of them sees nothing explaining the
            third — so this card says which one is missing. */}
        <Tarjeta variante={perfil.visible ? 'acento' : 'plana'} className="gap-1">
          <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
            {perfil.visible ? 'Te pueden encontrar' : 'Nadie te encuentra'}
          </Texto>
          <Texto estilo="apoyo">
            {perfil.visible
              ? 'Tus compañeros pueden buscarte por tu nombre y retarte.'
              : !perfil.alias
                ? 'Te falta escoger un nombre en «Mi perfil».'
                : !autorizado
                  ? 'Falta la autorización de tu acudiente, aquí abajo.'
                  : 'Tienes apagado «Que otros me encuentren».'}
          </Texto>
        </Tarjeta>

        {!autorizado ? (
          <View className="gap-3">
            <Texto estilo="rotulo">Autorización del acudiente</Texto>
            <Texto estilo="apoyo">
              Para que otros estudiantes te encuentren por tu nombre, la ley
              colombiana pide la autorización de tu papá, mamá o acudiente.
              Muéstrale esta pantalla antes de continuar.
            </Texto>
            <Texto estilo="apoyo">
              Sin esto la app funciona completa: entrenar, simulacros, el peaje y
              repasar errores. Lo único que no funciona son los duelos.
            </Texto>
            <Boton
              cargando={perfilDuelos.guardandoAutorizacion}
              deshabilitado={perfilDuelos.guardandoAutorizacion}
              alTocar={() => void perfilDuelos.declararAutorizacion()}
            >
              Mi acudiente autoriza
            </Boton>
          </View>
        ) : null}

        <View className="gap-4">
          <Texto estilo="rotulo">Qué comparto</Texto>

          <Tarjeta className="flex-row items-center gap-3">
            <View className="flex-1 gap-0.5">
              <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
                Que otros me encuentren
              </Texto>
              <Texto estilo="apoyo">
                Si lo apagas, nadie te encuentra buscando tu nombre. Conservas el
                nombre, tus amigos y tus duelos.
              </Texto>
            </View>
            <Switch
              value={perfil.aliasBuscable}
              /* Not disabled without the guardian's authorisation: the
                 learner may set their preference first and have the
                 conversation at home afterwards. The server is what
                 enforces the gate, and it does so regardless. */
              onValueChange={(v) => void perfilDuelos.cambiarBuscable(v)}
              accessibilityLabel="Que otros me encuentren al buscar mi nombre"
            />
          </Tarjeta>

          <Tarjeta className="flex-row items-center gap-3">
            <View className="flex-1 gap-0.5">
              <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
                Mostrar mi progreso
              </Texto>
              <Texto estilo="apoyo">
                Deja que quien abra tu perfil vea tu nivel, tu racha, tus logros
                y cómo vas en cada materia. Tus amigos lo ven siempre.
              </Texto>
            </View>
            <Switch
              value={perfil.progresoPublico}
              onValueChange={(v) => void perfilDuelos.cambiarProgresoPublico(v)}
              accessibilityLabel="Mostrar mi progreso a quien abra mi perfil"
            />
          </Tarjeta>

          {/* Spelled out, because «mis amigos lo ven siempre» above is
              the part people miss, and finding out later that a friend
              could see everything all along is the kind of surprise
              that loses trust. */}
          <Texto estilo="apoyo">
            Nunca mostramos tu correo, tu plan ni a qué hora usas la app.
          </Texto>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
