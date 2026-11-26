import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { BarraRespuesta, Boton, Encabezado, Texto } from '@/shared/ui';
import { Aviso } from '@/shared/ui/Aviso';
import { EsqueletoPregunta } from '@/shared/ui/Esqueleto';
import { NOMBRE_AREA, type Area, type Dificultad } from '@/shared/model/icfes';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { useExamen } from '@/features/examen/hooks/useExamen';
import { PantallaExamen } from '@/features/examen/components/PantallaExamen';
import { PantallaResultados } from '@/features/examen/components/PantallaResultados';

/**
 * Training: pick an area, answer, find out immediately.
 *
 * One route holds the three states of a run because they are one
 * thing — the answers live in the hook, and routing between screens
 * would mean handing them across a boundary. That handoff is exactly
 * where the web version lost them.
 */

const AREAS: readonly Area[] = ['MAT', 'LC', 'CN', 'SOC', 'ING'];
/** Null means "all five, mixed", at the exam's own proportions. */
type Seleccion = Area | 'MIXTO';
const CANTIDADES = [5, 10, 15] as const;

/**
 * One choice in a row of them.
 *
 * The chosen one is tinted and outlined, not merely bolder: on a
 * cheap screen in daylight a weight change alone is invisible, and a
 * learner who cannot tell which area is selected starts the wrong
 * session.
 */
function Ficha({
  elegida,
  etiqueta,
  alTocar,
  estira = false,
}: {
  elegida: boolean;
  etiqueta: string;
  alTocar: () => void;
  estira?: boolean;
}) {
  return (
    <Pressable
      onPress={alTocar}
      accessibilityRole="radio"
      accessibilityState={{ checked: elegida }}
      className={[
        'min-h-toque justify-center rounded-pildora border-[1.5px] px-4',
        estira ? 'flex-1 items-center' : '',
        elegida ? 'border-acento bg-acento-suave' : 'border-borde-control bg-capa',
      ].join(' ')}
    >
      <Texto
        estilo="cuerpo"
        style={{ fontFamily: 'Inter_600SemiBold' }}
        className={elegida ? 'text-acento-texto' : 'text-texto-apagado'}
      >
        {etiqueta}
      </Texto>
    </Pressable>
  );
}

export default function RutaEntrenar() {
  const router = useRouter();
  const { cargando, autenticado } = useSesion();
  const examen = useExamen();

  const [area, setArea] = useState<Seleccion>('MIXTO');
  const [dificultad] = useState<Dificultad>('media');
  const [cantidad, setCantidad] = useState<number>(5);

  if (cargando) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  if (examen.estado === 'respondiendo') {
    return <PantallaExamen examen={examen} alTerminar={examen.terminar} />;
  }

  if (examen.estado === 'terminado') {
    return (
      <PantallaResultados
        examen={examen}
        alSalir={() => router.replace('/inicio')}
        alVerPlan={(sessionId) => router.replace(`/plan/${sessionId}`)}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-fondo">
      <ScrollView contentContainerClassName="gap-6 px-5 py-6">
        <View className="gap-2">
          <Texto estilo="titulo-grande">Entrenar</Texto>
          <Texto estilo="cuerpo" className="text-texto-apagado">
            Sabes al instante si acertaste, y puedes hablar con el tutor cuando no.
          </Texto>
        </View>

        <View className="gap-3">
          <Encabezado rotulo="Área" />
          <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
            <Ficha
              elegida={area === 'MIXTO'}
              etiqueta="Las cinco mezcladas"
              alTocar={() => setArea('MIXTO')}
            />
            {AREAS.map((a) => (
              <Ficha
                key={a}
                elegida={area === a}
                etiqueta={NOMBRE_AREA[a]}
                alTocar={() => setArea(a)}
              />
            ))}
          </View>
        </View>

        <View className="gap-3">
          <Encabezado rotulo="Cuántas preguntas" />
          <View className="flex-row gap-2" accessibilityRole="radiogroup">
            {CANTIDADES.map((n) => (
              <Ficha
                key={n}
                estira
                elegida={cantidad === n}
                etiqueta={String(n)}
                alTocar={() => setCantidad(n)}
              />
            ))}
          </View>
        </View>

        {examen.preparar.isError ? <Aviso
            mensaje={examen.preparar.error.mensaje}
            detalle={examen.preparar.error.detalle}
          /> : null}

        {examen.preparar.isPending ? (
          /* The bank answers in under a second when it has enough, and
             generating the rest takes minutes. The learner cannot tell
             which is happening, so the skeleton shows the shape of
             what is coming and the line below explains the slow case
             without promising the fast one. */
          <View className="gap-4">
            <EsqueletoPregunta />
            <Texto estilo="apoyo" className="text-center">
              Si nos faltan preguntas, las escribimos ahora. Eso sí puede tardar
              un par de minutos.
            </Texto>
          </View>
        ) : null}
      </ScrollView>

      <BarraRespuesta>
        <Boton
          alTocar={() => examen.preparar.mutate({ area, dificultad, n: cantidad })}
          cargando={examen.preparar.isPending}
        >
          {examen.preparar.isPending ? 'Preparando preguntas…' : 'Empezar'}
        </Boton>
      </BarraRespuesta>
    </SafeAreaView>
  );
}
