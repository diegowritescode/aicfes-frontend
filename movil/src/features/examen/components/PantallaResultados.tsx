import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BarraRespuesta,
  Boton,
  Cifra,
  Encabezado,
  FilaMateria,
  Tarjeta,
  Texto,
} from '@/shared/ui';
import { Aviso } from '@/shared/ui/Aviso';
import { NOMBRE_AREA, type Area } from '@/shared/model/icfes';
import type { useExamen } from '../hooks/useExamen';
import { areasMasFlojas } from '@/shared/pregunta/model/reglas';

/**
 * What a training run came to.
 *
 * It saves on arrival and says so if that fails. The web version
 * discarded the result of its own save, so a run could vanish with
 * the screen still reporting a score — the learner saw the number,
 * and nothing was recorded.
 */
export function PantallaResultados({
  examen,
  alSalir,
  alVerPlan,
}: {
  examen: ReturnType<typeof useExamen>;
  alSalir: () => void;
  /** Offered only when the session was recorded: a plan needs one. */
  alVerPlan?: (sessionId: string) => void;
}) {
  const resumen = examen.resumen();
  const guardar = examen.guardar;

  useEffect(() => {
    if (guardar.isIdle) guardar.mutate();
  }, [guardar]);

  const flojas = areasMasFlojas(resumen.porArea);

  return (
    <SafeAreaView className="flex-1 bg-fondo">
      <ScrollView contentContainerClassName="gap-5 px-5 py-6">
        <Encabezado rotulo="Sesión terminada" />

        <View className="gap-1.5">
          <Cifra valor={resumen.correctas} unidad={`de ${resumen.total} correctas`} />
          <Texto estilo="apoyo">{resumen.porcentaje}% de respuestas correctas.</Texto>
        </View>

        {/* A run that was not saved has to say so. Silence here is how
            the web version lost answers while showing a score. */}
        {guardar.isError ? (
          <Aviso
            tono="aviso"
            mensaje="No pudimos guardar esta sesión. Tu progreso de hoy puede no aparecer en el panel."
            detalle={guardar.error?.detalle}
          />
        ) : null}

        {flojas.length > 0 ? (
          <View className="gap-3">
            <Encabezado rotulo="Por área" />
            <Tarjeta className="gap-4">
              {flojas.map((a) => (
                <FilaMateria
                  key={a.area}
                  nombre={NOMBRE_AREA[a.area as Area] ?? a.area}
                  porcentaje={a.porcentaje}
                  detalle={`${a.correct} de ${a.total} correctas`}
                />
              ))}
            </Tarjeta>
          </View>
        ) : null}
      </ScrollView>

      <BarraRespuesta>
        {/* Only when the session exists and was saved: a plan is
            written from a session, and offering one that cannot be
            written is a promise we would break on the next tap. */}
        {examen.sessionId && alVerPlan && !guardar.isError ? (
          <Boton alTocar={() => alVerPlan(examen.sessionId!)}>
            Ver mi plan de estudio
          </Boton>
        ) : null}
        <Boton variante="contorno" alTocar={alSalir}>
          Volver al inicio
        </Boton>
      </BarraRespuesta>
    </SafeAreaView>
  );
}
