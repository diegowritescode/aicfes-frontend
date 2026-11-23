import { useCallback, useEffect, useState, type ComponentType } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Boton } from '@/shared/ui/Boton';

/**
 * A bench for the native blocking module, not a feature.
 *
 * `expo-screen-time` is ten days old with 74 weekly downloads and no
 * issue ever reported — which is not a quality signal, it is an
 * absence of users. Before building weeks of the study toll on top of
 * it, this screen answers one question per button on a real phone:
 * does each piece do what its documentation says?
 *
 * Deliberately ugly and deliberately temporary. It is deleted once
 * the answers are known, and nothing else imports it.
 *
 * It does not run in Expo Go: the module ships native code, so this
 * needs a development build.
 */

type Linea = { readonly texto: string; readonly ok: boolean | null };

export default function RutaBloqueoPrueba() {
  const router = useRouter();
  const [registro, setRegistro] = useState<Linea[]>([]);
  const [mostrarSelector, setMostrarSelector] = useState(false);

  const anotar = useCallback((texto: string, ok: boolean | null = null) => {
    setRegistro((previo) => [...previo, { texto, ok }]);
  }, []);

  /* Loaded on demand rather than imported at the top, so the screen
     still renders in Expo Go and says why it cannot work there. */
  const cargarModulo = useCallback(async () => {
    try {
      const mod = await import('expo-screen-time');
      return mod;
    } catch (error) {
      anotar(`No se pudo cargar el módulo: ${String(error)}`, false);
      return null;
    }
  }, [anotar]);

  const probarCapacidades = useCallback(async () => {
    const mod = await cargarModulo();
    if (!mod) return;
    try {
      const caps = mod.default.getCapabilities();
      anotar(`capacidades: ${JSON.stringify(caps)}`, true);
    } catch (error) {
      anotar(`getCapabilities falló: ${String(error)}`, false);
    }
  }, [anotar, cargarModulo]);

  const probarPermisos = useCallback(async () => {
    const mod = await cargarModulo();
    if (!mod) return;
    try {
      const estado = await mod.default.getScreenTimePermissionsAsync();
      anotar(`permisos: granted=${estado.granted}`, estado.granted);
      for (const paso of estado.steps ?? []) {
        anotar(
          `  paso ${paso.id}: ${paso.status}${paso.required ? ' (requerido)' : ''}`,
        );
      }
    } catch (error) {
      anotar(`getScreenTimePermissions falló: ${String(error)}`, false);
    }
  }, [anotar, cargarModulo]);

  const pedirSiguientePermiso = useCallback(async () => {
    const mod = await cargarModulo();
    if (!mod) return;
    try {
      /* One step at a time: the module advances the onboarding by a
         single step per call, and each one opens a system settings
         screen. */
      const estado = await mod.default.requestScreenTimePermissionsAsync();
      anotar(`tras pedir: granted=${estado.granted}`, estado.granted);
    } catch (error) {
      anotar(`requestScreenTimePermissions falló: ${String(error)}`, false);
    }
  }, [anotar, cargarModulo]);

  const probarBloqueo = useCallback(async () => {
    const mod = await cargarModulo();
    if (!mod) return;
    try {
      /* The selection id is ours to name; what it points at is
         whatever the learner picked in the native picker. */
      mod.default.blockSelection('prueba');
      anotar(`bloqueado: isBlocked=${mod.default.isBlocked()}`, mod.default.isBlocked());
    } catch (error) {
      anotar(`blockSelection falló: ${String(error)}`, false);
    }
  }, [anotar, cargarModulo]);

  const probarDesbloqueo = useCallback(async () => {
    const mod = await cargarModulo();
    if (!mod) return;
    try {
      const grant = await mod.default.temporaryUnlock(15 * 60);
      anotar(`desbloqueo temporal: ${JSON.stringify(grant)}`, true);
      anotar(`restante: ${mod.default.getRemainingUnlockSeconds()}s`);
    } catch (error) {
      /* Expected to fail with NO_ACTIVE_BLOCK when nothing is
         blocked, which is itself an answer. */
      anotar(`temporaryUnlock: ${String(error)}`, false);
    }
  }, [anotar, cargarModulo]);

  const probarQuitar = useCallback(async () => {
    const mod = await cargarModulo();
    if (!mod) return;
    try {
      mod.default.unblockAll();
      anotar(`desbloqueado todo: isBlocked=${mod.default.isBlocked()}`, true);
    } catch (error) {
      anotar(`unblockAll falló: ${String(error)}`, false);
    }
  }, [anotar, cargarModulo]);

  return (
    <SafeAreaView className="flex-1 bg-wash">
      <ScrollView contentContainerClassName="gap-4 px-5 py-6">
        <View className="gap-2">
          <Text className="text-[22px] font-bold tracking-tight text-slate-900">
            Banco de pruebas: bloqueo
          </Text>
          <Text className="text-[13px] leading-5 text-slate-500">
            Pantalla temporal. Cada botón prueba una pieza del módulo nativo en
            este teléfono. No es una función de la app.
          </Text>
          {Platform.OS !== 'android' ? (
            <Text className="text-[13px] leading-5 text-amber-700">
              En iOS esto necesita el permiso de Apple, que todavía no está
              pedido. Los botones van a fallar.
            </Text>
          ) : null}
        </View>

        <View className="gap-2">
          <Boton onPress={probarCapacidades} ancho>1. ¿Qué dice que puede hacer?</Boton>
          <Boton onPress={probarPermisos} variante="contorno" ancho>2. ¿Qué permisos hay?</Boton>
          <Boton onPress={pedirSiguientePermiso} variante="contorno" ancho>3. Pedir el siguiente</Boton>
          <Boton onPress={() => setMostrarSelector((v) => !v)} variante="contorno" ancho>
            4. {mostrarSelector ? 'Ocultar' : 'Abrir'} el selector de apps
          </Boton>
          <Boton onPress={probarBloqueo} variante="contorno" ancho>5. Bloquear</Boton>
          <Boton onPress={probarDesbloqueo} variante="contorno" ancho>6. Desbloquear 15 min</Boton>
          <Boton onPress={probarQuitar} variante="contorno" ancho>7. Quitar el bloqueo</Boton>
        </View>

        {mostrarSelector ? <Selector alAnotar={anotar} /> : null}

        <View className="gap-1.5 rounded-2xl border border-slate-200 bg-white p-4">
          <Text className="text-[12px] font-bold uppercase tracking-widest text-slate-400">
            Lo que respondió
          </Text>
          {registro.length === 0 ? (
            <Text className="text-[13px] text-slate-400">Todavía nada.</Text>
          ) : null}
          {registro.map((linea, i) => (
            <Text
              key={i}
              selectable
              className={`text-[12px] leading-5 ${
                linea.ok === true
                  ? 'text-emerald-700'
                  : linea.ok === false
                    ? 'text-rose-700'
                    : 'text-slate-600'
              }`}
            >
              {linea.texto}
            </Text>
          ))}
        </View>

        <Boton variante="suave" onPress={() => setRegistro([])} ancho>
          Limpiar
        </Boton>
        <Boton variante="contorno" onPress={() => router.replace('/inicio')} ancho>
          Volver
        </Boton>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * The native picker, which is the only way to choose what to block.
 *
 * JavaScript never learns which apps were picked — the module hands
 * back opaque tokens, deliberately, for privacy. So "block Instagram
 * and TikTok" cannot be written in code: the learner marks them here.
 */
function Selector({ alAnotar }: { alAnotar: (t: string, ok?: boolean | null) => void }) {
  /* Typed loosely on purpose: this is a bench, the module is ten days
     old, and pinning its prop types here would mean maintaining a
     second copy of them for a screen that gets deleted. */
  const [Picker, setPicker] = useState<ComponentType<Record<string, unknown>> | null>(
    null,
  );

  useEffect(() => {
    let vivo = true;
    void import('expo-screen-time')
      .then((mod) => {
        if (vivo) setPicker(() => mod.ActivityPicker as never);
      })
      .catch((error) => {
        if (vivo) alAnotar(`No se pudo cargar el selector: ${String(error)}`, false);
      });
    return () => {
      vivo = false;
    };
  }, [alAnotar]);

  if (!Picker) {
    return <Text className="text-[13px] text-slate-500">Cargando el selector…</Text>;
  }

  return (
    <View className="h-96 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <Picker selectionId="prueba" />
    </View>
  );
}
