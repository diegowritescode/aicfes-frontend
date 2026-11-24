import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ENTRADAS, entradasDeModeracion, entradaActiva } from './model/menu';
import { useHayTokenDeModeracion } from './useHayTokenDeModeracion';

/**
 * The menu, as a sheet over the screen.
 *
 * A `Modal` rather than a real drawer: expo-router's drawer brings in
 * react-navigation's drawer and a gesture handler, which is a lot of
 * native surface for a list of five links. This is one component and
 * it closes on the hardware back button, which is what a learner
 * expects.
 *
 * It exists because the dashboard had grown four navigation cards on
 * top of the level, the streak, the missions, the achievements, the XP
 * breakdown and a reminder. The dashboard should say how you are
 * doing; where to go next belongs behind a button.
 */
export function Menu({
  abierto,
  rutaActual,
  onCerrar,
  onIr,
  onSalir,
  email,
  esModerador = false,
}: {
  abierto: boolean;
  rutaActual: string;
  onCerrar: () => void;
  onIr: (ruta: string) => void;
  onSalir: () => void;
  email?: string;
  /* Passed in rather than read here: the profile that carries it
     lives in `features`, and `shared` must not import from there. */
  esModerador?: boolean;
}) {
  const hayToken = useHayTokenDeModeracion(esModerador);
  const activa = entradaActiva(rutaActual);

  return (
    <Modal
      visible={abierto}
      animationType="slide"
      transparent
      /* Android's back button closes it. Without this it would exit
         the screen behind the menu instead, which is the kind of thing
         that makes an app feel broken. */
      onRequestClose={onCerrar}
    >
      <View className="flex-1 bg-black/30">
        {/* Tapping the dimmed area closes it, which is how every sheet
            on both platforms behaves. */}
        <Pressable
          className="flex-1"
          onPress={onCerrar}
          accessibilityRole="button"
          accessibilityLabel="Cerrar el menú"
        />

        <SafeAreaView edges={['bottom']} className="rounded-t-3xl bg-white">
          <View className="gap-1 px-5 pb-2 pt-5">
            <Text className="text-[12px] font-bold uppercase tracking-widest text-slate-400">
              ¿Qué hacemos?
            </Text>
          </View>

          <ScrollView contentContainerClassName="gap-2 px-5 pb-4">
            {[
              ...ENTRADAS,
              ...entradasDeModeracion(hayToken),
            ].map((entrada) => {
              const aqui = activa?.ruta === entrada.ruta;
              return (
                <Pressable
                  key={entrada.ruta}
                  onPress={() => onIr(entrada.ruta)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: aqui }}
                  accessibilityLabel={`${entrada.titulo}. ${entrada.descripcion}`}
                  className={`gap-0.5 rounded-2xl border p-4 ${
                    aqui ? 'border-brand-bright bg-sky-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <Text
                    className={`text-[15px] font-semibold ${
                      aqui ? 'text-brand-bright' : 'text-slate-900'
                    }`}
                  >
                    {entrada.titulo}
                  </Text>
                  <Text className="text-[12.5px] leading-5 text-slate-500">
                    {entrada.descripcion}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View className="gap-3 border-t border-slate-100 px-5 py-4">
            {email ? (
              <Text className="text-[12px] text-slate-400" numberOfLines={1}>
                {email}
              </Text>
            ) : null}
            <Pressable onPress={onSalir} accessibilityRole="button" hitSlop={8}>
              <Text className="text-[13px] font-semibold text-rose-600">
                Cerrar sesión
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
