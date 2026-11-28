import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Boton, Tarjeta, Texto } from '@/shared/ui';
import { Aviso } from '@/shared/ui/Aviso';
import { EsqueletoPanel } from '@/shared/ui/Esqueleto';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { usePanel } from '@/features/panel/hooks/usePanel';
import { misionesPendientes } from '@/features/panel/model/reglas';
import type { Mision } from '@/features/panel/api/esquemas';

/**
 * Today's challenges, with room.
 *
 * They were three cards crushed between the weekly report and the
 * achievements on «Yo», capped at three by a `.slice(0, 3)` because
 * there was no room for more. Diego named this one: «retos de hoy,
 * ya no van a estar ahí aplastados sino que vista propia».
 *
 * The cap is gone. A screen that exists for them can show all of
 * them, and the finished ones now appear too — crossed off rather
 * than hidden, because a list that silently drops what you did looks
 * like a list you are not making progress on.
 */
export default function RutaRetos() {
  const router = useRouter();
  const { cargando: cargandoSesion, autenticado } = useSesion();
  const { panel, cargando, fallo, recargar } = usePanel();

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  const pendientes = panel ? misionesPendientes(panel) : [];
  /* Everything the pending list filtered out: completed, or progress
     already at target. Shown, because «3 de 3» with a full bar is
     the only reward this screen has to give. */
  const hechas = (panel?.missions.items ?? []).filter(
    (m) => m.status === 'completed' || m.progress >= m.target,
  );

  const xpEnJuego = pendientes.reduce((s, m) => s + m.xpReward, 0);

  return (
    <SafeAreaView className="flex-1 bg-fondo" edges={['top', 'bottom']}>
      <ScrollView
        contentContainerClassName="gap-5 px-5 py-5"
        refreshControl={
          <RefreshControl refreshing={cargando} onRefresh={() => void recargar()} />
        }
      >
        <View className="flex-row items-center justify-between gap-3">
          <Texto estilo="titulo-grande">Retos de hoy</Texto>
          <Boton variante="plano" ancho={false} alTocar={() => router.back()}>
            Atrás
          </Boton>
        </View>

        {cargando && !panel ? <EsqueletoPanel /> : null}

        {fallo && !panel ? (
          <Aviso mensaje={fallo.mensaje} detalle={fallo.detalle} />
        ) : null}

        {/* What is left on the table, in one line. The three cards
            each carried their own «· 20 XP» and nobody was adding
            them up. */}
        {pendientes.length > 0 ? (
          <Texto estilo="apoyo">
            Te quedan {xpEnJuego} XP por ganar hoy.
          </Texto>
        ) : null}

        {pendientes.map((m) => (
          <TarjetaDeReto key={m.id} mision={m} />
        ))}

        {!cargando && panel && pendientes.length === 0 && hechas.length > 0 ? (
          <Tarjeta variante="acento" className="gap-1">
            <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
              Terminaste los retos de hoy
            </Texto>
            <Texto estilo="apoyo">
              Mañana hay otros. Puedes seguir practicando igual.
            </Texto>
          </Tarjeta>
        ) : null}

        {/* `panel &&`, because a failed load also leaves both lists
            empty — and «hoy no hay retos» is a statement about the
            learner's day, not about the network. */}
        {!cargando && panel && pendientes.length === 0 && hechas.length === 0 ? (
          <Tarjeta variante="plana" className="gap-1">
            <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
              Hoy no hay retos
            </Texto>
            <Texto estilo="apoyo">
              Aparecen cuando empiezas a estudiar.
            </Texto>
          </Tarjeta>
        ) : null}

        {hechas.length > 0 ? (
          <View className="gap-3">
            <Texto estilo="rotulo">Ya hechos</Texto>
            {hechas.map((m) => (
              <Tarjeta key={m.id} variante="plana" className="flex-row items-center gap-3">
                <View className="flex-1">
                  <Texto estilo="cuerpo">{m.title}</Texto>
                </View>
                <Texto estilo="apoyo" className="text-ganado">
                  +{m.xpReward} XP
                </Texto>
              </Tarjeta>
            ))}
          </View>
        ) : null}

        {pendientes.length > 0 ? (
          <Boton alTocar={() => router.push('/entrenar')}>Practicar</Boton>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function TarjetaDeReto({ mision }: { mision: Mision }) {
  const parte = Math.min(100, (mision.progress / mision.target) * 100);

  return (
    <Tarjeta className="gap-2">
      <View className="flex-row items-baseline justify-between gap-3">
        <Texto
          estilo="cuerpo"
          style={{ fontFamily: 'Inter_600SemiBold' }}
          className="flex-1"
        >
          {mision.title}
        </Texto>
        <Texto estilo="apoyo">{mision.xpReward} XP</Texto>
      </View>
      <View
        className="h-1.5 overflow-hidden rounded-pildora bg-capa-alta"
        /* Decoration over the numbers written underneath, so hidden
           rather than read out twice. */
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View
          className="h-full rounded-pildora bg-acento"
          style={{ width: `${parte}%` }}
        />
      </View>
      <Texto estilo="apoyo">
        {mision.progress} de {mision.target}
      </Texto>
    </Tarjeta>
  );
}
