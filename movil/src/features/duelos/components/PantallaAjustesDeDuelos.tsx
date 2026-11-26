import { useState } from 'react';
import { Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import { Boton, Tarjeta, Texto } from '@/shared/ui';
import { Aviso } from '@/shared/ui/Aviso';
import { EsqueletoLista } from '@/shared/ui/Esqueleto';
import { useRouter } from 'expo-router';
import { useModeracion, usePerfilDeDuelos } from '../hooks/useDuelos';

/**
 * Name, privacy and blocked list.
 *
 * All in one screen because they are one subject: who can find me and
 * who cannot reach me. Splitting the guardian's authorisation into its
 * own flow would make it feel like a formality, which is the opposite
 * of what it is.
 */
export function PantallaAjustesDeDuelos({ onVolver }: { onVolver: () => void }) {
  const router = useRouter();
  const perfil = usePerfilDeDuelos();
  const moderacion = useModeracion();
  const [borrador, setBorrador] = useState('');
  const [guardado, setGuardado] = useState(false);

  if (perfil.cargando) {
    return (
      <View className="flex-1 px-5 py-6">
        <EsqueletoLista filas={3} />
      </View>
    );
  }

  const actual = perfil.perfil;

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-7 px-5 py-6">
      <Texto estilo="titulo">Duelos: mi cuenta</Texto>

      <View className="gap-3">
        <Texto estilo="rotulo">Mi nombre en la app</Texto>
        <Texto estilo="apoyo">
          Es como lo encuentran sus compañeros. No use su nombre completo ni su colegio.
        </Texto>
        <TextInput
          value={borrador || actual?.alias || ''}
          onChangeText={(t) => {
            setBorrador(t);
            setGuardado(false);
          }}
          placeholder="camilo11"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={16}
          /* Only the face is inline: a radius or a fill in a style
             object wins over the compiled class and the field loses
             it. */
          style={{ fontFamily: 'Inter_400Regular' }}
          className="min-h-boton rounded-medio border-[1.5px] border-borde-control bg-capa px-4 text-[15px] text-texto"
        />
        {perfil.falloDeAlias ? <Aviso mensaje={perfil.falloDeAlias.mensaje} /> : null}
        {guardado ? (
          <Texto estilo="apoyo" className="text-ganado">Nombre guardado.</Texto>
        ) : null}
        <Boton
          cargando={perfil.guardandoAlias}
          deshabilitado={perfil.guardandoAlias || borrador.trim().length === 0}
          alTocar={async () => {
            const r = await perfil.ponerAlias(borrador.trim()).catch(() => null);
            if (r) {
              setGuardado(true);
              setBorrador('');
            }
          }}
        >
          Guardar nombre
        </Boton>
      </View>

      {/* The legal gate, said in plain words rather than as a notice
          nobody reads. */}
      <View className="gap-3">
        <Texto estilo="rotulo">Autorización del acudiente</Texto>
        {actual?.tutorAutorizoEn ? (
          <Texto estilo="apoyo">
            Autorizado. Ya puede retar y ser retado.
          </Texto>
        ) : (
          <>
            <Texto estilo="apoyo">
              Para que otros estudiantes lo encuentren por su nombre, la ley colombiana pide la
              autorización de su papá, mamá o acudiente. Muéstrele esta pantalla antes de
              continuar.
            </Texto>
            <Texto estilo="apoyo">
              Sin esto, la app funciona completa: entrenar, simulacros, el peaje y repasar
              errores. Lo único que no funciona son los duelos.
            </Texto>
            <Boton
              cargando={perfil.guardandoAutorizacion}
              deshabilitado={perfil.guardandoAutorizacion}
              alTocar={() => void perfil.declararAutorizacion()}
            >
              Mi acudiente autoriza
            </Boton>
          </>
        )}
      </View>

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Texto estilo="pregunta">Que otros me encuentren</Texto>
            <Texto estilo="apoyo">
              Si lo apaga, nadie lo encuentra por su nombre. Conserva el nombre y sus duelos.
            </Texto>
          </View>
          <Switch
            value={actual?.aliasBuscable ?? false}
            onValueChange={(v) => void perfil.cambiarBuscable(v)}
          />
        </View>
      </View>

      <View className="gap-3">
        <Texto estilo="rotulo">Bloqueados</Texto>
        {moderacion.bloqueados.length === 0 ? (
          <Texto estilo="apoyo">No ha bloqueado a nadie.</Texto>
        ) : (
          moderacion.bloqueados.map((b) => (
            <Tarjeta key={b.bloqueado.id} variante="plana">
              <View className="flex-row items-center justify-between gap-3">
              <Texto estilo="opcion">{b.bloqueado.alias}</Texto>
                <Pressable
                  disabled={moderacion.bloqueando}
                  onPress={() => void moderacion.desbloquear(b.bloqueado.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Desbloquear a ${b.bloqueado.alias ?? 'esta persona'}`}
                  accessibilityState={{ disabled: moderacion.bloqueando }}
                  className="min-h-toque justify-center"
                >
                  <Texto estilo="apoyo" className="text-acento-texto">
                    Desbloquear
                  </Texto>
                </Pressable>
              </View>
            </Tarjeta>
          ))
        )}
        <Texto estilo="apoyo">
          Si alguien lo molesta, bloquéelo o denúncielo desde el duelo. Al denunciar lo bloqueamos
          de inmediato.
        </Texto>
      </View>

      {/* The way in for whoever moderates, and the only one.
          The drawer entry for Denuncias appears once this device
          holds a token — but the screen that takes the token was
          behind that entry, so there was no first time. This is that
          first time.

          Plain text at the bottom of a settings screen, with no
          explanation: a learner who taps it finds a box asking for
          something they do not have, which is as far as it goes. */}
      <Pressable
        onPress={() => router.push('/moderacion')}
        accessibilityRole="button"
        className="min-h-toque justify-center"
      >
        <Texto estilo="apoyo" className="text-center">Moderación</Texto>
      </Pressable>

      <Boton variante="contorno" alTocar={onVolver}>
        Volver
      </Boton>
    </ScrollView>
  );
}
