import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Redirect, useRouter } from 'expo-router';
import { Boton, Tarjeta, Texto } from '@/shared/ui';
import { Avatar } from '@/shared/ui/atomos/Avatar';
import { Aviso } from '@/shared/ui/Aviso';
import { EsqueletoLista } from '@/shared/ui/Esqueleto';
import {
  FIGURAS,
  NOMBRE_DE_FIGURA,
  ORDEN_DE_FIGURAS,
  esFigura,
  type Figura,
} from '@/shared/ui/atomos/figuras-de-avatar';
import { color, colorAvatar } from '@/shared/ui/tokens';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { usePerfilDeDuelos } from '@/features/duelos/hooks/useDuelos';

/**
 * Picking a figure and a colour.
 *
 * The one thing on a learner's profile that is theirs to decide and
 * says nothing about them. Alias is searchable, the description is
 * read by strangers and the level is a measurement — this is the
 * field where a 16-year-old gets to just like foxes.
 *
 * Drawn figures rather than a photograph, and that is a product
 * decision and not a shortcut. A photo of a minor, visible to a
 * stranger who found them by alias, needs storage, cropping, EXIF
 * stripping so the file does not carry where they live, and a human
 * reading every upload before it publishes. The 24 figures give the
 * same «this profile is mine» and there is nothing to review, because
 * every possible avatar already shipped inside the app.
 *
 * Preview at the top, grid below, one save. The preview is what makes
 * the grid honest: eight colours times 24 figures is 192 avatars, and
 * a learner cannot hold what «rana on amber» looks like in their head.
 */
export default function RutaAvatar() {
  const router = useRouter();
  const { cargando: cargandoSesion, autenticado } = useSesion();
  const perfilDuelos = usePerfilDeDuelos();

  /* Null until the profile arrives, and then seeded from it once.
     Seeded from `perfil` on every render would fight the learner:
     each tap sets state, the profile re-renders, and the seed would
     put it back. */
  const [eleccion, setEleccion] = useState<{
    figura: Figura | null;
    color: number | null;
  } | null>(null);
  const [guardado, setGuardado] = useState(false);

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  const perfil = perfilDuelos.perfil;

  /* The whole screen waits on the profile. Rendering the grid with no
     profile would draw every figure as unselected — a confident claim
     that this learner picked nothing, made over a request that may
     simply have failed. `isLoading` is false after a failure too, so
     the profile existing is the only evidence worth checking. */
  if (!perfil) {
    return (
      <SafeAreaView className="flex-1 bg-fondo" edges={['top']}>
        <View className="gap-4 p-4">
          <Cabecera alVolver={() => router.back()} />
          {perfilDuelos.fallo ? (
            <Aviso
              mensaje="No pudimos cargar tu perfil."
              detalle="Revisa tu conexión y vuelve a entrar a esta pantalla."
            />
          ) : (
            <EsqueletoLista filas={3} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  /* What the learner has, as the server knows it. An unknown slug — a
     figure added in a later release — falls back to initials instead
     of an empty tile. */
  const guardadaFigura = esFigura(perfil.avatar) ? perfil.avatar : null;
  const guardadoColor =
    typeof perfil.avatarColor === 'number' &&
    perfil.avatarColor >= 0 &&
    perfil.avatarColor < colorAvatar.length
      ? perfil.avatarColor
      : null;

  const actual = eleccion ?? { figura: guardadaFigura, color: guardadoColor };
  const alias = perfil.alias ?? '';

  const cambio = actual.figura !== guardadaFigura || actual.color !== guardadoColor;

  function escoger(siguiente: { figura?: Figura | null; color?: number | null }) {
    setGuardado(false);
    setEleccion({
      figura: siguiente.figura !== undefined ? siguiente.figura : actual.figura,
      color: siguiente.color !== undefined ? siguiente.color : actual.color,
    });
  }

  async function guardar() {
    /* `.then(() => true, () => false)` and not `.catch(() => null)`:
       a rejected save followed by an unconditional «Guardado» is a
       lie the learner acts on, and this project has shipped it once
       already. */
    const bien = await perfilDuelos
      .ponerAvatar({ avatar: actual.figura, color: actual.color })
      .then(
        () => true,
        () => false,
      );

    if (bien) {
      setGuardado(true);
      /* Clears the local pick so the screen renders from the server's
         answer from here on. Without this, a later failed save would
         still show the figure the learner tapped. */
      setEleccion(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-fondo" edges={['top']}>
      <ScrollView contentContainerClassName="gap-4 p-4 pb-10">
        <Cabecera alVolver={() => router.back()} />

        {/* The preview. Large, because this is the size it will be on
            the profile it is for. */}
        <Tarjeta className="items-center gap-3 py-6">
          <Avatar
            nombre={alias}
            tamano="grande"
            figura={actual.figura}
            color={actual.color}
          />
          <Texto estilo="apoyo" className="text-center">
            {actual.figura
              ? NOMBRE_DE_FIGURA[actual.figura]
              : 'Tus iniciales, como hasta ahora'}
          </Texto>
        </Tarjeta>

        {perfilDuelos.falloDeAvatar ? (
          <Aviso
            mensaje={perfilDuelos.falloDeAvatar.mensaje}
            detalle="Tu avatar sigue como estaba."
          />
        ) : null}

        {guardado ? (
          <Texto estilo="apoyo" className="text-ganado">
            Avatar guardado.
          </Texto>
        ) : null}

        {/* Colour first: it changes every figure below it, so picking
            a figure and then a colour means looking at the grid twice. */}
        <View className="gap-2">
          <Texto estilo="apoyo">Color</Texto>
          <View className="flex-row flex-wrap gap-2">
            {colorAvatar.map((hex, i) => (
              <Pressable
                key={hex}
                onPress={() => escoger({ color: i })}
                accessibilityRole="button"
                accessibilityState={{ selected: actual.color === i }}
                accessibilityLabel={`Color ${i + 1} de ${colorAvatar.length}`}
                className="min-h-control min-w-[44px] flex-1 basis-[18%] items-center justify-center"
              >
                {({ pressed }) => (
                  <View
                    /* The hex comes from `colorAvatar`, which is a
                       fixed palette and not a theme token, so there is
                       no class for it and `style` is correct here. The
                       ring is a class, so it follows the theme. */
                    style={{ backgroundColor: hex, opacity: pressed ? 0.6 : 1 }}
                    className={`h-9 w-9 rounded-chico ${
                      actual.color === i ? 'border-2 border-texto' : ''
                    }`}
                  />
                )}
              </Pressable>
            ))}
            {/* Back to the colour derived from the alias. Its own
                option rather than a long-press on a swatch: «the one
                the app picked for me» is a choice a learner makes. */}
            <Pressable
              onPress={() => escoger({ color: null })}
              accessibilityRole="button"
              accessibilityState={{ selected: actual.color === null }}
              accessibilityLabel="El color de siempre"
              className="min-h-control min-w-[44px] flex-1 basis-[18%] items-center justify-center"
            >
              {({ pressed }) => (
                <View
                  style={{ opacity: pressed ? 0.6 : 1 }}
                  className={`h-9 w-9 items-center justify-center rounded-chico bg-capa-alta ${
                    actual.color === null ? 'border-2 border-texto' : ''
                  }`}
                >
                  <Texto estilo="apoyo">Auto</Texto>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <View className="gap-2">
          <Texto estilo="apoyo">Figura</Texto>
          <View className="flex-row flex-wrap gap-2">
            {/* Initials, as one option among the figures rather than a
                separate control. Going back to them is the same kind
                of choice as picking the owl. */}
            <Pressable
              onPress={() => escoger({ figura: null })}
              accessibilityRole="button"
              accessibilityState={{ selected: actual.figura === null }}
              accessibilityLabel="Mis iniciales"
              className="min-h-control flex-1 basis-[20%] items-center justify-center py-1"
            >
              {({ pressed }) => (
                <View
                  style={{ opacity: pressed ? 0.6 : 1 }}
                  className={`h-[58px] w-full items-center justify-center rounded-medio bg-capa ${
                    actual.figura === null ? 'border-2 border-acento-texto' : 'border border-linea'
                  }`}
                >
                  <Avatar nombre={alias} tamano="chico" color={actual.color} />
                </View>
              )}
            </Pressable>

            {ORDEN_DE_FIGURAS.map((slug) => (
              <Pressable
                key={slug}
                onPress={() => escoger({ figura: slug })}
                accessibilityRole="button"
                accessibilityState={{ selected: actual.figura === slug }}
                accessibilityLabel={NOMBRE_DE_FIGURA[slug]}
                className="min-h-control flex-1 basis-[20%] items-center justify-center py-1"
              >
                {({ pressed }) => (
                  <View
                    style={{ opacity: pressed ? 0.6 : 1 }}
                    className={`h-[58px] w-full items-center justify-center rounded-medio bg-capa ${
                      actual.figura === slug
                        ? 'border-2 border-acento-texto'
                        : 'border border-linea'
                    }`}
                  >
                    {/* The figure in the app's own ink, not white on
                        the chosen colour: the grid is a list of shapes
                        to recognise, and 24 coloured tiles compete
                        with the preview for which one is the avatar. */}
                    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                      <Path
                        d={FIGURAS[slug]}
                        /* `stroke` takes a value, not a class: an SVG
                           `Path` has no `className`, and the two icon
                           molecules in `shared/ui` pass `color.*` the
                           same way. The accent marks the pick; the
                           muted ink keeps the other 23 quiet. */
                        stroke={
                          actual.figura === slug ? color.acentoTexto : color.textoApagado
                        }
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        <Boton
          cargando={perfilDuelos.guardandoAvatar}
          /* Disabled when nothing changed, so «Guardar» never sends a
             request that does nothing and reports success. */
          deshabilitado={!cambio || perfilDuelos.guardandoAvatar}
          alTocar={guardar}
        >
          Guardar avatar
        </Boton>
      </ScrollView>
    </SafeAreaView>
  );
}

function Cabecera({ alVolver }: { alVolver: () => void }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Texto estilo="titulo">Mi avatar</Texto>
      <Pressable
        onPress={alVolver}
        accessibilityRole="button"
        accessibilityLabel="Volver"
        className="min-h-control justify-center px-2"
      >
        {({ pressed }) => (
          <Texto estilo="cuerpo" style={{ opacity: pressed ? 0.6 : 1 }} className="text-acento-texto">
            Listo
          </Texto>
        )}
      </Pressable>
    </View>
  );
}
