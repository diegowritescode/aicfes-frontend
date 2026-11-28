import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Avatar, Boton, Tarjeta, Texto } from '@/shared/ui';
import { Aviso } from '@/shared/ui/Aviso';
import { EsqueletoLista } from '@/shared/ui/Esqueleto';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { useDescripcion, usePerfilDeDuelos } from '@/features/duelos/hooks/useDuelos';
import { RecordatorioDeSeguridad } from '@/features/duelos/components/RecordatorioDeSeguridad';

/**
 * Editing what other learners see of you.
 *
 * The alias and the description, which used to live inside the duel
 * settings behind the Jugar tab. They were filed there because alias
 * search is a duels feature — true of the plumbing, wrong for the
 * person: «what is my name in this app» is not a question anybody
 * goes to a game screen to answer, and Diego could not find his own
 * profile at all.
 *
 * The preview at the top is the point of the screen. Both fields are
 * read by strangers, and a form that shows you a text box but never
 * the result lets somebody write a description they would not have
 * written if they had seen it on a card.
 */
export default function RutaPerfilPublico() {
  const router = useRouter();
  const { cargando: cargandoSesion, autenticado } = useSesion();
  const perfilDuelos = usePerfilDeDuelos();
  const { guardar } = useDescripcion();

  /* Both fields are seeded from the server once and then owned here.
     Binding straight to the query would wipe what is being typed the
     moment anything in the `duelos` tree refetches. */
  const [alias, setAlias] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState<string | null>(null);
  const [guardadoAlias, setGuardadoAlias] = useState(false);
  const [guardadaDescripcion, setGuardadaDescripcion] = useState(false);

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  const actual = perfilDuelos.perfil;

  if (perfilDuelos.cargando && !actual) {
    return (
      <SafeAreaView className="flex-1 bg-fondo" edges={['top', 'bottom']}>
        <View className="px-5 py-6">
          <EsqueletoLista filas={3} />
        </View>
      </SafeAreaView>
    );
  }

  /* Seeded after the loading guard, so the first value is the stored
     one rather than the empty string shown while loading. */
  if (alias === null && actual) setAlias(actual.alias ?? '');
  if (descripcion === null && actual) setDescripcion(actual.descripcion ?? '');

  const aliasEscrito = (alias ?? '').trim();
  const descripcionEscrita = descripcion ?? '';

  return (
    <SafeAreaView className="flex-1 bg-fondo" edges={['top', 'bottom']}>
      <ScrollView contentContainerClassName="gap-6 px-5 py-5">
        <View className="flex-row items-center justify-between gap-3">
          <Texto estilo="titulo-grande">Mi perfil</Texto>
          <Boton variante="plano" ancho={false} alTocar={() => router.back()}>
            Atrás
          </Boton>
        </View>

        {/* What a stranger sees, rendered from what is in the boxes
            right now rather than from what is saved. Someone typing
            a name watches the avatar change colour under it, which
            is also the only explanation this app ever gives for why
            the colour is what it is. */}
        <Tarjeta className="items-center gap-3 py-5">
          <Avatar nombre={aliasEscrito} tamano="grande" />
          <Texto estilo="titulo">
            {aliasEscrito || 'Sin nombre todavía'}
          </Texto>
          {descripcionEscrita.trim() ? (
            <Texto estilo="apoyo" numberOfLines={2} className="text-center">
              {descripcionEscrita}
            </Texto>
          ) : (
            <Texto estilo="apoyo" className="text-center">
              Así te ven los demás
            </Texto>
          )}
        </Tarjeta>

        {/* Said once, here, rather than as a line of small print
            under each field. A learner who reads one thing on this
            screen should read this.

            This replaced a shorter card that said «no escribas tu
            nombre completo, tu teléfono, tu dirección ni tu colegio».
            Right instinct, and it was already in the right place —
            but Play's Families policy asks for two things that
            sentence did not have: the «real world risk of online
            interaction» named rather than implied, and a way out when
            something goes wrong. The text lives in
            `seguridad-en-linea.ts` so the wording is under test. */}
        <RecordatorioDeSeguridad />

        <View className="gap-3">
          <Texto estilo="rotulo">Mi nombre en la app</Texto>
          <TextInput
            value={alias ?? ''}
            onChangeText={(t) => {
              setAlias(t);
              setGuardadoAlias(false);
            }}
            placeholder="camilo11"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={16}
            /* Only the face is inline: a radius or a fill in a style
               object wins over the compiled class and the field
               loses it. */
            style={{ fontFamily: 'Inter_400Regular' }}
            className="min-h-boton rounded-medio border-[1.5px] border-borde-control bg-capa px-4 text-[15px] text-texto"
          />
          {perfilDuelos.falloDeAlias ? (
            <Aviso mensaje={perfilDuelos.falloDeAlias.mensaje} />
          ) : null}
          {guardadoAlias ? (
            <Texto estilo="apoyo" className="text-ganado">
              Nombre guardado.
            </Texto>
          ) : null}
          <Boton
            variante="contorno"
            cargando={perfilDuelos.guardandoAlias}
            deshabilitado={
              perfilDuelos.guardandoAlias ||
              aliasEscrito.length === 0 ||
              /* Nothing to save when it has not changed. A button
                 that fires a request to store the same string is how
                 you get «ALIAS_TOMADO» against your own alias. */
              aliasEscrito === (actual?.alias ?? '')
            }
            alTocar={async () => {
              const r = await perfilDuelos.ponerAlias(aliasEscrito).catch(() => null);
              if (r) setGuardadoAlias(true);
            }}
          >
            Guardar nombre
          </Boton>
        </View>

        <View className="gap-3">
          <Texto estilo="rotulo">Una línea sobre mí</Texto>
          <TextInput
            value={descripcion ?? ''}
            onChangeText={(t) => {
              setDescripcion(t);
              setGuardadaDescripcion(false);
            }}
            placeholder="Me falta física y me sobra lectura"
            /* The same 120 the column and the request schema use.
               Free text written by minors and read by minors: the
               length is part of what keeps it from holding a phone
               number and a plea. */
            maxLength={120}
            multiline
            style={{ fontFamily: 'Inter_400Regular', minHeight: 72 }}
            className="rounded-medio border-[1.5px] border-borde-control bg-capa px-4 py-3 text-[15px] text-texto"
          />
          <Texto estilo="apoyo">{descripcionEscrita.length} de 120</Texto>
          {guardadaDescripcion ? (
            <Texto estilo="apoyo" className="text-ganado">
              Descripción guardada.
            </Texto>
          ) : null}
          <Boton
            variante="contorno"
            cargando={guardar.isPending}
            deshabilitado={guardar.isPending}
            alTocar={async () => {
              /* `then(ok, fail)` rather than `.catch(() => null)`
                 followed by an unconditional flag. The earlier
                 version swallowed the rejection and then said
                 «Descripción guardada.» over a save that failed —
                 the learner closes the screen believing the text is
                 stored. The alias path above already did this
                 correctly; this one did not. */
              const ok = await guardar
                .mutateAsync(descripcionEscrita)
                .then(() => true, () => false);
              if (ok) setGuardadaDescripcion(true);
            }}
          >
            Guardar descripción
          </Boton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
