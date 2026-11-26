import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  BarraRespuesta,
  Boton,
  Cifra,
  Encabezado,
  FilaMateria,
  Tarjeta,
  Texto,
} from '@/shared/ui';
import { NOMBRE_AREA, type Area } from '@/shared/model/icfes';
import { useSimulacro } from '@/features/simulacro/hooks/useSimulacro';
import { areasPorPrioridad } from '@/features/simulacro/model/reglas';

/**
 * The report a sitting produces, which is the reason to sit one.
 *
 * It leads with what went worst, because that ordering is the study
 * plan. A score alone tells a learner they did badly; this tells them
 * at what.
 */
export default function RutaResultados() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { simulacro, cargando } = useSimulacro(id);

  if (cargando) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-fondo">
        <Texto estilo="cuerpo" className="text-texto-apagado">
          Cargando resultados…
        </Texto>
      </SafeAreaView>
    );
  }

  if (!id) return <Redirect href="/inicio" />;

  const resultados = simulacro?.resultados;
  if (!resultados) {
    return (
      <SafeAreaView className="flex-1 justify-center gap-4 bg-fondo px-6">
        <Texto estilo="cuerpo" className="text-texto-apagado">
          No encontramos los resultados de este simulacro.
        </Texto>
        <Boton alTocar={() => router.replace('/inicio')}>Volver al inicio</Boton>
      </SafeAreaView>
    );
  }

  const areas = areasPorPrioridad(resultados);
  const flojas = areas.filter((a) => a.total > 0 && a.porcentaje < 70);

  return (
    <SafeAreaView className="flex-1 bg-fondo">
      <ScrollView contentContainerClassName="gap-5 px-5 py-6">
        <Encabezado rotulo="Simulacro terminado" />

        <View className="gap-1.5">
          <Cifra valor={resultados.correctas} unidad={`de ${resultados.total} correctas`} />
          <Texto estilo="apoyo">
            {resultados.porcentaje}% de respuestas correctas.
            {simulacro?.expirado ? ' Se acabó el tiempo antes de terminar.' : ''}
          </Texto>
        </View>

        <View className="gap-3">
          <Encabezado rotulo="Por área, de la más floja a la más firme" />
          <Tarjeta className="gap-4">
            {areas.map((a) => {
              const medida = a.total > 0;
              return (
                <FilaMateria
                  key={a.area}
                  nombre={NOMBRE_AREA[a.area as Area] ?? a.area}
                  porcentaje={a.porcentaje}
                  /* An area the sitting never asked about is not a
                     zero. `FilaMateria` says «Sin practicar» instead
                     of claiming a result nobody produced. */
                  medida={medida}
                  detalle={
                    medida
                      ? `${a.correctas} de ${a.total} correctas`
                      : 'Sin preguntas de esta área'
                  }
                />
              );
            })}
          </Tarjeta>
        </View>

        {flojas.length > 0 ? (
          <Tarjeta variante="acento" className="gap-2">
            <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
              Por dónde empezar
            </Texto>
            <Texto estilo="cuerpo" className="text-texto-apagado">
              {flojas.map((a) => NOMBRE_AREA[a.area as Area] ?? a.area).join(', ')}. Son las que
              quedaron por debajo del 70%.
            </Texto>
          </Tarjeta>
        ) : null}
      </ScrollView>

      <BarraRespuesta>
        <Boton alTocar={() => router.replace('/inicio')}>Volver al inicio</Boton>
        <Boton variante="contorno" alTocar={() => router.replace('/simulacro')}>
          Hacer otro simulacro
        </Boton>
      </BarraRespuesta>
    </SafeAreaView>
  );
}
