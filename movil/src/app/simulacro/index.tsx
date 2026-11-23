import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Boton } from '@/shared/ui/Boton';
import { Aviso } from '@/shared/ui/Aviso';
import type { Fallo } from '@/core/http/cliente';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import {
  useCapacidadBanco,
  useSimulacrosPrevios,
} from '@/features/simulacro/hooks/useSimulacro';
import { iniciarSimulacro } from '@/features/simulacro/api/peticiones';
import { alcanzaElBanco } from '@/features/simulacro/model/reglas';

/**
 * Choosing a sitting, and resuming one still open.
 *
 * The unfinished sitting is at the top for a reason: a learner whose
 * connection dropped at question 40 comes back here, and what they
 * need is the way back in — not a fresh sitting that throws the first
 * forty away.
 */

const LARGOS = [
  { preguntas: 25, titulo: 'Corto', minutos: 27, para: 'Para medir cómo va, sin bloquear la tarde.' },
  { preguntas: 50, titulo: 'Medio', minutos: 53, para: 'El equilibrio entre señal y tiempo.' },
  { preguntas: 100, titulo: 'Largo', minutos: 106, para: 'Ya se parece al cansancio del examen.' },
  { preguntas: 254, titulo: 'Completo', minutos: 270, para: 'El examen entero, al ritmo real.' },
] as const;

export default function RutaInicioSimulacro() {
  const router = useRouter();
  const { cargando: cargandoSesion, autenticado } = useSesion();
  const { enCurso } = useSimulacrosPrevios();
  const { maximo } = useCapacidadBanco();

  const [iniciando, setIniciando] = useState<number | null>(null);
  const [fallo, setFallo] = useState<Fallo | null>(null);

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  const empezar = async (preguntas: number) => {
    setIniciando(preguntas);
    setFallo(null);
    const r = await iniciarSimulacro(preguntas);
    setIniciando(null);
    if (!r.ok) {
      setFallo(r.fallo);
      return;
    }
    router.push(`/simulacro/${r.datos.id}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-wash">
      <ScrollView contentContainerClassName="gap-5 px-5 py-8">
        <View className="gap-2">
          <Text className="text-[26px] font-bold tracking-tight text-slate-900">Simulacro</Text>
          <Text className="text-[14.5px] leading-6 text-slate-600">
            Como el examen real: puedes saltar preguntas, volver atrás y cambiar lo que
            respondiste. No sabes si acertaste hasta entregar.
          </Text>
        </View>

        {enCurso ? (
          <View className="gap-3 rounded-2xl border border-brand-bright/40 bg-brand-soft/20 p-5">
            <Text className="text-[15px] font-bold text-slate-900">
              Tiene un simulacro sin terminar
            </Text>
            <Text className="text-[13.5px] leading-6 text-slate-600">
              De {enCurso.totalPreguntas} preguntas. El tiempo sigue corriendo desde que lo
              empezó.
            </Text>
            <Boton onPress={() => router.push(`/simulacro/${enCurso.id}`)}>
              Continuar donde iba
            </Boton>
          </View>
        ) : null}

        {fallo ? <Aviso mensaje={fallo.mensaje} detalle={fallo.detalle} /> : null}

        <View className="gap-3">
          {LARGOS.map((largo) => {
            const alcanza = alcanzaElBanco(largo.preguntas, maximo);
            return (
              <View
                key={largo.preguntas}
                className={`gap-2 rounded-2xl border border-slate-200 p-5 ${
                  alcanza ? 'bg-white' : 'bg-slate-50'
                }`}
              >
                <Text className="text-[16px] font-bold text-slate-900">{largo.titulo}</Text>
                <Text className="text-[12.5px] font-semibold text-slate-500">
                  {largo.preguntas} preguntas · {largo.minutos} min
                </Text>
                <Text className="text-[13.5px] leading-6 text-slate-600">{largo.para}</Text>

                {alcanza ? (
                  <Boton
                    variante="contorno"
                    onPress={() => void empezar(largo.preguntas)}
                    cargando={iniciando === largo.preguntas}
                    deshabilitado={iniciando !== null}
                  >
                    Empezar
                  </Boton>
                ) : (
                  /* The reason is ours, not theirs: the bank is still
                     being filled. Offering a length that then fails
                     wastes the one thing the learner brought, which is
                     the decision to sit down and study. */
                  <Text className="rounded-xl bg-white px-3 py-2.5 text-[12.5px] leading-5 text-slate-500">
                    Todavía no hay preguntas suficientes para este largo. Estamos llenando el
                    banco.
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
