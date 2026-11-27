import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import {
  BarraRespuesta,
  Boton,
  Chip,
  Encabezado,
  Tarjeta,
  Texto,
} from '@/shared/ui';
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
 * The other way to study, which is not this drill.
 *
 * Only the simulacro now. Contrarreloj used to sit above it and moved
 * to Jugar: you answer against a clock there, not against a syllabus,
 * and a learner looking for a timed run was looking in the wrong
 * place for the duel beside it. What is left here is study — pick an
 * area, answer, find out — and the simulacro is the long version of
 * exactly that.
 *
 * It carries the fact that decides whether you want it today — how
 * long — rather than a pitch.
 */
const MODOS = [
  {
    ruta: '/simulacro',
    titulo: 'Simulacro',
    dato: '25 a 254 preguntas',
    descripcion:
      'El examen completo, con su nota al final. Puedes saltar preguntas y volver atrás, y no sabes si acertaste hasta entregar.',
  },
] as const;

/**
 * One mode, as a card you can read before you tap.
 *
 * Same shape as the rungs in contrarreloj and the lengths in
 * simulacro: title with the fact beside it, one line of what it is,
 * and the way in. `contorno` and not `principal` — «Empezar» at the
 * bottom of this screen already spends the accent.
 */
function TarjetaModo({
  titulo,
  dato,
  descripcion,
  etiquetaBoton,
  alTocar,
}: {
  titulo: string;
  dato: string;
  descripcion: string;
  etiquetaBoton: string;
  alTocar: () => void;
}) {
  return (
    <Tarjeta className="gap-2">
      <View className="flex-row items-baseline justify-between gap-3">
        <Texto estilo="cuerpo" style={{ fontFamily: 'Nunito_800ExtraBold' }}>
          {titulo}
        </Texto>
        <Chip>{dato}</Chip>
      </View>
      <Texto estilo="cuerpo" className="text-texto-apagado">
        {descripcion}
      </Texto>
      <View className="mt-1">
        <Boton variante="contorno" alTocar={alTocar} etiqueta={`${etiquetaBoton}: ${titulo}`}>
          {etiquetaBoton}
        </Boton>
      </View>
    </Tarjeta>
  );
}

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

        <View className="gap-3">
          <Encabezado rotulo="La versión larga" />
          {MODOS.map((m) => (
            <TarjetaModo
              key={m.ruta}
              titulo={m.titulo}
              dato={m.dato}
              descripcion={m.descripcion}
              etiquetaBoton="Abrir"
              /* `push` and not `replace`: these are places the learner
                 goes and comes back from, and the back gesture should
                 land on Entrenar rather than walk out of the app. */
              alTocar={() => router.push(m.ruta)}
            />
          ))}
        </View>

        {/* Its own heading, because it is not a way to practice: you
            do not answer anything here, you decide which apps charge
            you five questions. Filed under «Otras formas de
            practicar» it would read as a sixth drill, and someone
            looking for a session would open it and find a settings
            page. */}
        <View className="gap-3">
          <Encabezado rotulo="Para obligarte a practicar" />
          <TarjetaModo
            titulo="Bloquear apps"
            dato="5 preguntas por entrada"
            descripcion="Eliges cuáles apps quedan cerradas. Cuando abres una, el peaje te pide cinco preguntas antes de dejarte pasar."
            etiquetaBoton="Configurar"
            alTocar={() => router.push('/bloqueo')}
          />
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

      {/* The tab bar belongs to this state only — the configurator.
          Once `respondiendo` takes over, the screen returns early and
          the bar is gone with it: a tab bar during a live drill is an
          invitation to abandon it. Below the answer bar, because the
          answer bar is what the learner came for. */}
    </SafeAreaView>
  );
}
