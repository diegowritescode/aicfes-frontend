import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Boton, FilaMateria, Tarjeta, Texto } from '@/shared/ui';
import { Aviso } from '@/shared/ui/Aviso';
import { EsqueletoPanel } from '@/shared/ui/Esqueleto';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { useDesgloseXp, usePanel } from '@/features/panel/hooks/usePanel';
import { DesgloseXp } from '@/features/panel/components/DesgloseXp';
import { areaMasFloja, filasDeArea } from '@/features/panel/model/reglas';
import { NOMBRE_AREA } from '@/shared/model/icfes';

/**
 * The five subjects, and where the XP came from.
 *
 * Both were sections stacked on «Yo» among six others. They belong
 * together and nowhere else: the subjects say where this learner
 * stands and the breakdown says what the level was made of, and a
 * screen that is only about progress can give each of them room.
 *
 * It ends in a button, which the sections never had. A learner who
 * reads that their weakest subject is physics and is then offered
 * nothing has been informed and not helped.
 */
export default function RutaMaterias() {
  const router = useRouter();
  const { cargando: cargandoSesion, autenticado } = useSesion();
  const { panel, cargando, fallo, recargar } = usePanel();
  const { desglose } = useDesgloseXp();

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  /* Weakest first, unmeasured last. */
  const filas = panel ? filasDeArea(panel) : [];
  const floja = panel ? areaMasFloja(panel) : null;

  return (
    <SafeAreaView className="flex-1 bg-fondo" edges={['top', 'bottom']}>
      <ScrollView
        contentContainerClassName="gap-5 px-5 py-5"
        refreshControl={
          <RefreshControl refreshing={cargando} onRefresh={() => void recargar()} />
        }
      >
        <View className="flex-row items-center justify-between gap-3">
          <Texto estilo="titulo-grande">Mis materias</Texto>
          <Boton variante="plano" ancho={false} alTocar={() => router.back()}>
            Atrás
          </Boton>
        </View>

        {cargando && !panel ? <EsqueletoPanel /> : null}

        {fallo && !panel ? (
          <Aviso mensaje={fallo.mensaje} detalle={fallo.detalle} />
        ) : null}

        {/* One card holding the rows, not a card each. Five bordered
            cards in a column made five subjects read as five separate
            verdicts; they are one picture of where someone stands. */}
        {filas.length > 0 ? (
          <Tarjeta className="gap-[14px]">
            {filas.map((f) => (
              <FilaMateria
                key={f.area}
                nombre={NOMBRE_AREA[f.area]}
                porcentaje={f.porcentaje}
                medida={f.medida}
              />
            ))}
          </Tarjeta>
        ) : null}

        {/* Gated on the panel existing, not only on «not loading».
            When the request fails `filas` is `[]` too, and «todavía
            no hay nada medido» over a failed load tells a learner
            their work was not counted. */}
        {!cargando && panel && filas.length === 0 ? (
          <Tarjeta variante="plana" className="gap-1">
            <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
              Todavía no hay nada medido
            </Texto>
            <Texto estilo="apoyo">
              Responde unas preguntas y aquí aparece cómo vas en cada materia.
            </Texto>
          </Tarjeta>
        ) : null}

        <DesgloseXp datos={desglose} />

        {/* The conclusion. Carries the weak area so the button does
            what the screen just said. */}
        <Boton
          alTocar={() =>
            router.push(floja ? `/entrenar?area=${floja.area}` : '/entrenar')
          }
        >
          {floja ? `Practicar ${NOMBRE_AREA[floja.area]}` : 'Practicar'}
        </Boton>
      </ScrollView>
    </SafeAreaView>
  );
}
