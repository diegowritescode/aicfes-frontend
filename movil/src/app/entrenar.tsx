import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Boton } from '@/shared/ui/Boton';
import { Aviso } from '@/shared/ui/Aviso';
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
const CANTIDADES = [5, 10, 15] as const;

export default function RutaEntrenar() {
  const router = useRouter();
  const { cargando, autenticado } = useSesion();
  const examen = useExamen();

  const [area, setArea] = useState<Area>('MAT');
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
    <SafeAreaView className="flex-1 bg-wash">
      <ScrollView contentContainerClassName="gap-6 px-5 py-8">
        <View className="gap-2">
          <Text className="text-[26px] font-bold tracking-tight text-slate-900">Entrenar</Text>
          <Text className="text-[14.5px] leading-6 text-slate-600">
            Sabe al instante si acertó, y puede hablar con el tutor cuando no.
          </Text>
        </View>

        <View className="gap-3">
          <Text className="text-[13px] font-bold uppercase tracking-widest text-slate-500">
            Área
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {AREAS.map((a) => (
              <Pressable
                key={a}
                onPress={() => setArea(a)}
                accessibilityRole="radio"
                accessibilityState={{ checked: area === a }}
                className={`min-h-[44px] justify-center rounded-full border px-4 ${
                  area === a ? 'border-brand-bright bg-brand-soft/40' : 'border-slate-200 bg-white'
                }`}
              >
                <Text
                  className={`text-[13.5px] font-semibold ${
                    area === a ? 'text-brand' : 'text-slate-600'
                  }`}
                >
                  {NOMBRE_AREA[a]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-3">
          <Text className="text-[13px] font-bold uppercase tracking-widest text-slate-500">
            Cuántas preguntas
          </Text>
          <View className="flex-row gap-2">
            {CANTIDADES.map((n) => (
              <Pressable
                key={n}
                onPress={() => setCantidad(n)}
                accessibilityRole="radio"
                accessibilityState={{ checked: cantidad === n }}
                className={`min-h-[44px] flex-1 items-center justify-center rounded-full border ${
                  cantidad === n
                    ? 'border-brand-bright bg-brand-soft/40'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <Text
                  className={`text-[14px] font-semibold ${
                    cantidad === n ? 'text-brand' : 'text-slate-600'
                  }`}
                >
                  {n}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {examen.preparar.isError ? <Aviso mensaje={examen.preparar.error.mensaje} /> : null}

        <Boton
          onPress={() => examen.preparar.mutate({ area, dificultad, n: cantidad })}
          cargando={examen.preparar.isPending}
          tamano="grande"
          ancho
        >
          {examen.preparar.isPending ? 'Preparando preguntas…' : 'Empezar'}
        </Boton>

        {examen.preparar.isPending ? (
          /* Generating takes minutes, and a spinner with no explanation
             reads as a hang. Saying why is what keeps them waiting. */
          <Text className="text-center text-[13px] leading-5 text-slate-500">
            Estamos escribiendo preguntas nuevas para usted. Puede tardar un minuto.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
