import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Boton, Chip, Encabezado, Tarjeta, Texto } from '@/shared/ui';
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
    <SafeAreaView className="flex-1 bg-fondo">
      <ScrollView contentContainerClassName="gap-5 px-5 py-6">
        <View className="gap-2">
          <Texto estilo="titulo-grande">Simulacro</Texto>
          <Texto estilo="cuerpo" className="text-texto-apagado">
            Como el examen real: puedes saltar preguntas, volver atrás y cambiar lo que
            respondiste. No sabes si acertaste hasta entregar.
          </Texto>
        </View>

        {enCurso ? (
          /* The tinted panel, used once: resuming is what this screen
             is for whenever there is something to resume. */
          <Tarjeta variante="acento" className="gap-2">
            <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
              Tienes un simulacro sin terminar
            </Texto>
            <Texto estilo="apoyo">
              De {enCurso.totalPreguntas} preguntas. El tiempo sigue corriendo desde que lo
              empezaste.
            </Texto>
            <View className="mt-1">
              <Boton alTocar={() => router.push(`/simulacro/${enCurso.id}`)}>
                Continuar donde iba
              </Boton>
            </View>
          </Tarjeta>
        ) : null}

        {fallo ? <Aviso mensaje={fallo.mensaje} detalle={fallo.detalle} /> : null}

        <View className="gap-3">
          <Encabezado rotulo="Qué tan largo" />
          {LARGOS.map((largo) => {
            const alcanza = alcanzaElBanco(largo.preguntas, maximo);
            return (
              <Tarjeta
                key={largo.preguntas}
                variante={alcanza ? 'alzada' : 'plana'}
                className="gap-2"
              >
                <View className="flex-row items-baseline justify-between">
                  <Texto estilo="cuerpo" style={{ fontFamily: 'Nunito_800ExtraBold' }}>
                    {largo.titulo}
                  </Texto>
                  <Chip>
                    {largo.preguntas} preguntas · {largo.minutos} min
                  </Chip>
                </View>
                <Texto estilo="cuerpo" className="text-texto-apagado">
                  {largo.para}
                </Texto>

                {alcanza ? (
                  <View className="mt-1">
                    <Boton
                      variante="contorno"
                      alTocar={() => void empezar(largo.preguntas)}
                      cargando={iniciando === largo.preguntas}
                      deshabilitado={iniciando !== null}
                    >
                      Empezar
                    </Boton>
                  </View>
                ) : (
                  /* The reason is ours, not theirs: the bank is still
                     being filled. Offering a length that then fails
                     wastes the one thing the learner brought, which is
                     the decision to sit down and study. */
                  <Texto estilo="apoyo" className="rounded-chico bg-capa px-3 py-2.5">
                    Todavía no hay preguntas suficientes para este largo. Estamos llenando el
                    banco.
                  </Texto>
                )}
              </Tarjeta>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
