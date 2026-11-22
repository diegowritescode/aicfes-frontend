import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Boton } from '@/shared/ui/Boton';
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
      <SafeAreaView className="flex-1 items-center justify-center bg-wash">
        <Text className="text-[14px] text-slate-500">Cargando resultados…</Text>
      </SafeAreaView>
    );
  }

  if (!id) return <Redirect href="/inicio" />;

  const resultados = simulacro?.resultados;
  if (!resultados) {
    return (
      <SafeAreaView className="flex-1 justify-center gap-4 bg-wash px-6">
        <Text className="text-[15px] text-slate-600">
          No encontramos los resultados de este simulacro.
        </Text>
        <Boton onPress={() => router.replace('/inicio')}>Volver al inicio</Boton>
      </SafeAreaView>
    );
  }

  const areas = areasPorPrioridad(resultados);
  const flojas = areas.filter((a) => a.total > 0 && a.porcentaje < 70);

  return (
    <SafeAreaView className="flex-1 bg-wash">
      <ScrollView contentContainerClassName="gap-6 px-5 py-8">
        <View className="gap-1.5">
          <Text className="text-[12px] font-bold uppercase tracking-widest text-slate-400">
            Simulacro terminado
          </Text>
          <Text className="text-[32px] font-bold tracking-tight text-slate-900">
            {resultados.correctas} de {resultados.total}
          </Text>
          <Text className="text-[15px] text-slate-600">
            {resultados.porcentaje}% de respuestas correctas.
            {simulacro?.expirado ? ' Se acabó el tiempo antes de terminar.' : ''}
          </Text>
        </View>

        <View className="gap-3">
          <Text className="text-[13px] font-bold uppercase tracking-widest text-slate-500">
            Por área, de la más floja a la más firme
          </Text>
          {areas.map((a) => {
            const medida = a.total > 0;
            return (
              <View key={a.area} className="gap-2 rounded-2xl border border-slate-200 bg-white p-4">
                <View className="flex-row items-baseline justify-between">
                  <Text className="text-[14.5px] font-semibold text-slate-800">
                    {NOMBRE_AREA[a.area as Area] ?? a.area}
                  </Text>
                  <Text className="text-[14px] font-bold text-slate-700">
                    {medida ? `${a.porcentaje}%` : '—'}
                  </Text>
                </View>
                <View className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <View
                    className={`h-full rounded-full ${
                      a.porcentaje < 70 ? 'bg-alerta' : 'bg-exito'
                    }`}
                    style={{ width: `${medida ? Math.max(2, a.porcentaje) : 0}%` }}
                  />
                </View>
                <Text className="text-[12.5px] text-slate-500">
                  {medida ? `${a.correctas} de ${a.total} correctas` : 'Sin preguntas de esta área'}
                </Text>
              </View>
            );
          })}
        </View>

        {flojas.length > 0 ? (
          <View className="gap-2 rounded-2xl border border-alerta/40 bg-amber-50/60 p-5">
            <Text className="text-[14.5px] font-bold text-slate-800">Por dónde empezar</Text>
            <Text className="text-[13.5px] leading-6 text-slate-600">
              {flojas.map((a) => NOMBRE_AREA[a.area as Area] ?? a.area).join(', ')}. Son las que
              quedaron por debajo del 70%.
            </Text>
          </View>
        ) : null}

        <View className="gap-2">
          <Boton onPress={() => router.replace('/inicio')} ancho>
            Volver al inicio
          </Boton>
          <Boton variante="contorno" onPress={() => router.replace('/simulacro')} ancho>
            Hacer otro simulacro
          </Boton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
