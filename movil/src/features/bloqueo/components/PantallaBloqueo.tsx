import { Pressable, ScrollView, Text, View } from 'react-native';
import { Boton } from '@/shared/ui/Boton';
import { Aviso } from '@/shared/ui/Aviso';
import { EsqueletoLista } from '@/shared/ui/Esqueleto';
import { ChipDePermiso } from './ChipDePermiso';
import { ordenar, textoDelBoton } from '../model/permisos';
import { useBloqueo } from '../hooks/useBloqueo';

/**
 * Setting up the toll: permissions, then apps.
 *
 * In that order because it is the order that works — the picker is
 * useless until the permissions are granted, and showing it first
 * teaches a learner that the feature is broken.
 */
export function PantallaBloqueo({
  alElegirApps,
  alVolver,
}: {
  alElegirApps: () => void;
  alVolver: () => void;
}) {
  const bloqueo = useBloqueo();

  if (bloqueo.cargando) {
    return (
      <View className="flex-1 px-5 py-6">
        <EsqueletoLista filas={4} />
      </View>
    );
  }

  if (bloqueo.disponible === false) {
    return (
      <View className="flex-1 justify-center gap-4 px-5">
        <Text className="text-[20px] font-bold text-slate-900">
          Aquí no podemos bloquear apps
        </Text>
        <Text className="text-[14.5px] leading-6 text-slate-600">
          Esta función necesita la app instalada en un Android. Todo lo demás
          funciona igual.
        </Text>
        <Boton variante="contorno" onPress={alVolver}>
          Volver
        </Boton>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-6 px-5 py-6">
      <View className="gap-2">
        <Text className="text-[22px] font-bold tracking-tight text-slate-900">
          Bloquear apps
        </Text>
        <Text className="text-[14px] leading-6 text-slate-600">
          Cuando abras una app bloqueada, te pedimos cinco preguntas. Las
          resuelves y se abre.
        </Text>
      </View>

      {bloqueo.fallo ? <Aviso mensaje={bloqueo.fallo} /> : null}

      <View className="gap-2.5">
        <Text className="text-[12px] font-bold uppercase tracking-widest text-slate-400">
          Permisos
        </Text>
        {ordenar(bloqueo.pasos).map((paso) => (
          <ChipDePermiso key={paso.id} paso={paso} />
        ))}

        {bloqueo.siguiente ? (
          /* The button names what it will ask for. "Pedir el
             siguiente" told the learner nothing about what screen
             was about to open, which is why it read as a gamble. */
          <Boton onPress={() => void bloqueo.pedirSiguiente()}>
            {textoDelBoton(bloqueo.siguiente)}
          </Boton>
        ) : null}
      </View>

      <View className="gap-2.5">
        <Text className="text-[12px] font-bold uppercase tracking-widest text-slate-400">
          Qué se bloquea
        </Text>

        {bloqueo.listo ? (
          <>
            <Pressable
              onPress={alElegirApps}
              accessibilityRole="button"
              className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5"
            >
              <Text className="text-[15px] text-slate-800">
                {bloqueo.appsSeleccionadas === 0
                  ? 'Escoger apps'
                  : bloqueo.appsSeleccionadas === 1
                    ? '1 app bloqueada'
                    : `${bloqueo.appsSeleccionadas} apps bloqueadas`}
              </Text>
              <Text className="text-[15px] text-brand-bright">Cambiar</Text>
            </Pressable>

            {bloqueo.appsSeleccionadas > 0 ? (
              <Pressable onPress={() => void bloqueo.quitarTodo()} className="py-2">
                <Text className="text-center text-[13px] text-slate-500">
                  Quitar el bloqueo de todas
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <Text className="text-[13.5px] leading-6 text-slate-500">
            Primero los permisos de arriba. Sin ellos no podemos bloquear nada.
          </Text>
        )}
      </View>

      <Boton variante="contorno" onPress={alVolver}>
        Volver
      </Boton>
    </ScrollView>
  );
}
