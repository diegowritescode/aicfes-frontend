import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Avatar, Boton, Tarjeta, Texto } from '@/shared/ui';
import { Aviso } from '@/shared/ui/Aviso';
import { EsqueletoLista } from '@/shared/ui/Esqueleto';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { useModeracion } from '@/features/duelos/hooks/useDuelos';

/**
 * Who this learner has blocked.
 *
 * Its own screen rather than the bottom section of the duel settings.
 * Unblocking somebody is a decision of its own, and it should not
 * require scrolling past your own alias and a legal notice to reach.
 *
 * A block works in both directions: neither of them finds the other,
 * and any duel between them was cancelled when it was made. Said on
 * the screen, because a one-way reading of it is the difference
 * between feeling safe and not.
 */
export default function RutaBloqueados() {
  const router = useRouter();
  const { cargando: cargandoSesion, autenticado } = useSesion();
  const moderacion = useModeracion();

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  return (
    <SafeAreaView className="flex-1 bg-fondo" edges={['top', 'bottom']}>
      <ScrollView contentContainerClassName="gap-5 px-5 py-5">
        <View className="flex-row items-center justify-between gap-3">
          <Texto estilo="titulo-grande">Bloqueados</Texto>
          <Boton variante="plano" ancho={false} alTocar={() => router.back()}>
            Atrás
          </Boton>
        </View>

        {moderacion.cargando ? <EsqueletoLista filas={2} /> : null}

        {/* Before the empty state, because a failed fetch and an
            empty list both arrive as `[]`. «No has bloqueado a
            nadie» over a request that never answered tells somebody
            their blocks are gone. */}
        {moderacion.fallo ? (
          <Aviso
            mensaje={moderacion.fallo.mensaje}
            detalle={moderacion.fallo.detalle}
          />
        ) : null}

        {!moderacion.cargando &&
        !moderacion.fallo &&
        moderacion.bloqueados.length === 0 ? (
          <Tarjeta variante="plana" className="gap-1">
            <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
              No has bloqueado a nadie
            </Texto>
            <Texto estilo="apoyo">
              Si alguien te molesta, puedes bloquearlo o denunciarlo desde su
              perfil o desde el duelo. Al denunciar lo bloqueamos de inmediato.
            </Texto>
          </Tarjeta>
        ) : null}

        {moderacion.bloqueados.map((b) => (
          <Tarjeta key={b.bloqueado.id} className="flex-row items-center gap-3">
            <Avatar
              nombre={b.bloqueado.alias ?? ''}
              figura={b.bloqueado.avatar}
              color={b.bloqueado.avatarColor}
            />
            <View className="flex-1">
              <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
                {b.bloqueado.alias ?? 'Sin nombre'}
              </Texto>
            </View>
            <Pressable
              disabled={moderacion.bloqueando}
              onPress={() => void moderacion.desbloquear(b.bloqueado.id)}
              accessibilityRole="button"
              accessibilityLabel={`Desbloquear a ${b.bloqueado.alias ?? 'esta persona'}`}
              accessibilityState={{ disabled: moderacion.bloqueando }}
              className="min-h-control justify-center px-1"
            >
              <Texto estilo="apoyo" className="text-acento-texto">
                Desbloquear
              </Texto>
            </Pressable>
          </Tarjeta>
        ))}

        {moderacion.bloqueados.length > 0 ? (
          <Texto estilo="apoyo">
            Mientras estén bloqueados, ninguno de los dos encuentra al otro ni
            puede retarlo.
          </Texto>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
