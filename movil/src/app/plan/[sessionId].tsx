import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Boton } from '@/shared/ui/Boton';
import { Aviso } from '@/shared/ui/Aviso';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { useRetroalimentacion } from '@/features/feedback/hooks/useRetroalimentacion';

/**
 * The plan written after a session.
 *
 * It is not generated on arrival. Writing it costs a model request,
 * and a learner who finished a session may well want to leave — asking
 * first means the ones who want it get it, and the ones who do not are
 * not charged for it.
 */
export default function RutaPlan() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const { cargando: cargandoSesion, autenticado } = useSesion();
  const { plan, cargando, generar } = useRetroalimentacion(sessionId ?? null);

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;
  if (!sessionId) return <Redirect href="/inicio" />;

  return (
    <SafeAreaView className="flex-1 bg-wash">
      <ScrollView contentContainerClassName="gap-6 px-5 py-8">
        <View className="gap-2">
          <Text className="text-[12px] font-bold uppercase tracking-widest text-slate-400">
            Después de la sesión
          </Text>
          <Text className="text-[26px] font-bold tracking-tight text-slate-900">
            Su plan de estudio
          </Text>
        </View>

        {cargando ? <Text className="text-[14px] text-slate-500">Buscando su plan…</Text> : null}

        {!cargando && !plan ? (
          <View className="gap-3 rounded-2xl border border-slate-200 bg-white p-5">
            <Text className="text-[14px] leading-6 text-slate-600">
              Podemos escribirle un plan a partir de lo que acaba de responder: qué le salió
              bien, qué falló y por dónde seguir.
            </Text>
            <Boton onPress={() => generar.mutate()} cargando={generar.isPending}>
              {generar.isPending ? 'Escribiendo…' : 'Escribir mi plan'}
            </Boton>
          </View>
        ) : null}

        {generar.isError ? <Aviso mensaje={generar.error.mensaje} /> : null}

        {plan ? (
          <View className="gap-5">
            <View className="gap-2 rounded-2xl border border-slate-200 bg-white p-5">
              <Text className="text-[14px] leading-6 text-slate-700">{plan.summary}</Text>
            </View>

            <Seccion titulo="Lo que le salió bien" puntos={plan.strengths} />
            <Seccion titulo="Lo que hay que trabajar" puntos={plan.weaknesses} />
            <Seccion titulo="Por dónde seguir" puntos={plan.plan} />
          </View>
        ) : null}

        <Boton variante="contorno" onPress={() => router.replace('/inicio')} ancho>
          Volver al inicio
        </Boton>
      </ScrollView>
    </SafeAreaView>
  );
}

/** A list, or nothing at all: an empty heading is worse than no heading. */
function Seccion({ titulo, puntos }: { titulo: string; puntos?: string[] | null }) {
  if (!puntos || puntos.length === 0) return null;
  return (
    <View className="gap-2">
      <Text className="text-[13px] font-bold uppercase tracking-widest text-slate-500">
        {titulo}
      </Text>
      {puntos.map((p, i) => (
        <View key={i} className="flex-row gap-2 rounded-2xl border border-slate-200 bg-white p-4">
          <Text className="text-[14px] text-slate-400">{'•'}</Text>
          <Text className="flex-1 text-[13.5px] leading-6 text-slate-700">{p}</Text>
        </View>
      ))}
    </View>
  );
}
