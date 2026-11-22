import { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton } from '@/shared/ui/Boton';
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
}: {
  examen: ReturnType<typeof useExamen>;
  alSalir: () => void;
}) {
  const resumen = examen.resumen();
  const guardar = examen.guardar;

  useEffect(() => {
    if (guardar.isIdle) guardar.mutate();
  }, [guardar]);

  const flojas = areasMasFlojas(resumen.porArea);

  return (
    <SafeAreaView className="flex-1 bg-wash">
      <ScrollView contentContainerClassName="gap-6 px-5 py-8">
        <View className="gap-1.5">
          <Text className="text-[12px] font-bold uppercase tracking-widest text-slate-400">
            Sesión terminada
          </Text>
          <Text className="text-[32px] font-bold tracking-tight text-slate-900">
            {resumen.correctas} de {resumen.total}
          </Text>
          <Text className="text-[15px] text-slate-600">
            {resumen.porcentaje}% de respuestas correctas.
          </Text>
        </View>

        {/* A run that was not saved has to say so. Silence here is how
            the web version lost answers while showing a score. */}
        {guardar.isError ? (
          <Aviso
            tono="aviso"
            mensaje="No pudimos guardar esta sesión. Su progreso de hoy puede no aparecer en el panel."
          />
        ) : null}

        {flojas.length > 0 ? (
          <View className="gap-3">
            <Text className="text-[13px] font-bold uppercase tracking-widest text-slate-500">
              Por área
            </Text>
            {flojas.map((a) => (
              <View key={a.area} className="gap-2 rounded-2xl border border-slate-200 bg-white p-4">
                <View className="flex-row items-baseline justify-between">
                  <Text className="text-[14.5px] font-semibold text-slate-800">
                    {NOMBRE_AREA[a.area as Area] ?? a.area}
                  </Text>
                  <Text className="text-[14px] font-bold text-slate-700">{a.porcentaje}%</Text>
                </View>
                <View className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <View
                    className={`h-full rounded-full ${a.porcentaje < 70 ? 'bg-alerta' : 'bg-exito'}`}
                    style={{ width: `${Math.max(2, a.porcentaje)}%` }}
                  />
                </View>
                <Text className="text-[12.5px] text-slate-500">
                  {a.correct} de {a.total} correctas
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <Boton onPress={alSalir} ancho>
          Volver al inicio
        </Boton>
      </ScrollView>
    </SafeAreaView>
  );
}
