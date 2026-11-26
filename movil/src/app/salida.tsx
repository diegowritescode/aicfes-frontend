import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Boton, Texto } from '@/shared/ui';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { useBloqueo } from '@/features/bloqueo/hooks/useBloqueo';
import { almacenPeaje } from '@/core/almacenamiento/peaje';
import { MINUTOS_DESBLOQUEO } from '@/features/offline/model/peaje';
import {
  MINUTOS_DE_EMERGENCIA,
  puedeUsarEmergencia,
  quedanHoy,
  textoDelBoton,
  usarEmergencia,
  type UsoDeEmergencia,
} from '@/features/offline/model/emergencia';

/**
 * The choices, when the learner taps "Ver opciones" on the shield.
 *
 * Reported as a real problem: from the shield there appeared to be
 * no way out but the exercises. The counted emergency existed — one
 * tap inside the toll — and nobody could find it. A way out nobody
 * can find is a way out that does not exist.
 *
 * The count is why this is a screen rather than a shield button. The
 * module offers a native `snooze`, but the shield has no memory of
 * how many times it was pressed today, so that button would be
 * unlimited — and an unlimited way out is the one a procrastinator
 * presses every time.
 */
export default function RutaSalida() {
  const { cargando, autenticado } = useSesion();

  if (cargando) return <SafeAreaView className="flex-1 bg-fondo" />;
  if (!autenticado) return <Redirect href="/entrar" />;

  return <Opciones />;
}

function Opciones() {
  const router = useRouter();
  const bloqueo = useBloqueo();
  const [uso, setUso] = useState<UsoDeEmergencia | null>(null);
  const [leyendo, setLeyendo] = useState(true);
  const concedido = useRef(false);

  useEffect(() => {
    let vivo = true;
    void almacenPeaje.leerEmergencias<UsoDeEmergencia>().then((u) => {
      if (!vivo) return;
      setUso(u);
      setLeyendo(false);
    });
    return () => {
      vivo = false;
    };
  }, []);

  /* Back stays blocked here as it is in the toll. This screen is one
     of the shield's two doors, and a gesture that walks past it
     would be a third. */
  useEffect(() => {
    const s = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => s.remove();
  }, []);

  /* The same breathing room the toll grants, for the same reason:
     the blocked app is still in the foreground for a moment and the
     shield would fire on it again. Revoked on leaving unless
     something was earned. */
  useEffect(() => {
    void bloqueo.respiro();
    return () => {
      if (!concedido.current) void bloqueo.terminarRespiro();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolver = useCallback(() => {
    router.replace('/peaje');
  }, [router]);

  const gastar = useCallback(async () => {
    if (!puedeUsarEmergencia(uso)) return;

    const siguiente = usarEmergencia(uso);
    setUso(siguiente);
    await almacenPeaje.guardarEmergencias(siguiente);

    concedido.current = true;
    await bloqueo.conceder(MINUTOS_DE_EMERGENCIA);

    /* Back to the app they were reaching for, where the platform
       allows it. */
    const handle = await almacenPeaje.leerAppBloqueada();
    if (handle) await bloqueo.abrirApp(handle);

    router.replace('/inicio');
  }, [uso, bloqueo, router]);

  const cerrar = useCallback(() => {
    router.replace('/inicio');
  }, [router]);

  if (leyendo) return <SafeAreaView className="flex-1 bg-fondo" />;

  const restantes = quedanHoy(uso);

  return (
    <SafeAreaView className="flex-1 bg-fondo">
      <View className="flex-1 justify-center gap-6 px-5">
        <View className="gap-2">
          <Texto estilo="titulo-grande">Esa app está en pausa</Texto>
          <Texto estilo="apoyo">
            Cinco preguntas y la abres por {MINUTOS_DESBLOQUEO} minutos de uso.
          </Texto>
        </View>

        <Boton alTocar={resolver}>Resolver las preguntas</Boton>

        <View className="gap-2">
          {/* The count is named before the tap, because the count is
              the whole design: it makes using one a decision rather
              than a reflex. */}
          <Boton
            variante="contorno"
            deshabilitado={restantes <= 0}
            alTocar={() => void gastar()}
          >
            {textoDelBoton(restantes)}
          </Boton>
          <Texto estilo="apoyo" className="text-center">
            {restantes > 0
              ? `${MINUTOS_DE_EMERGENCIA} minutos, sin ejercicios. Mañana vuelven a ser dos.`
              : 'Mañana tendrás dos otra vez.'}
          </Texto>
        </View>

        <Boton variante="plano" alTocar={cerrar}>
          Mejor no entro
        </Boton>
      </View>
    </SafeAreaView>
  );
}
