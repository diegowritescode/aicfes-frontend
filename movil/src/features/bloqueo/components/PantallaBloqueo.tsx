import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Boton, Texto } from '@/shared/ui';
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
        <Text className="text-[20px] font-bold text-texto">
          Aquí no podemos bloquear apps
        </Text>
        <Text className="text-[14.5px] leading-6 text-texto-apagado">
          Esta función necesita la app instalada en un Android. Todo lo demás
          funciona igual.
        </Text>
        <Boton variante="contorno" alTocar={alVolver}>
          Volver
        </Boton>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-6 px-5 py-6">
      <View className="gap-2">
        <Text className="text-[22px] font-bold tracking-tight text-texto">
          Bloquear apps
        </Text>
        <Text className="text-[14px] leading-6 text-texto-apagado">
          Cuando abras una app bloqueada, te pedimos cinco preguntas. Las
          resuelves y se abre.
        </Text>
      </View>

      {bloqueo.fallo ? <Aviso mensaje={bloqueo.fallo} /> : null}

      <View className="gap-2.5">
        <Text className="text-[12px] font-bold uppercase tracking-widest text-texto-apagado">
          Permisos
        </Text>
        {ordenar(bloqueo.pasos).map((paso) => (
          <ChipDePermiso key={paso.id} paso={paso} />
        ))}

        {/* A heading with nothing under it reads as a screen that
            failed to load — which is exactly how a wrong method name
            surfaced once. Every case now says something. */}
        {bloqueo.pasos.length === 0 ? (
          <Text className="text-[13.5px] leading-6 text-texto-apagado">
            {bloqueo.sinPasos
              ? 'Este teléfono no pide permisos extra.'
              : 'No pudimos leer los permisos. Cierra y vuelve a abrir la app.'}
          </Text>
        ) : null}

        {bloqueo.siguiente ? (
          /* The button names what it will ask for. "Pedir el
             siguiente" told the learner nothing about what screen
             was about to open, which is why it read as a gamble. */
          <Boton alTocar={() => void bloqueo.pedirSiguiente()}>
            {textoDelBoton(bloqueo.siguiente)}
          </Boton>
        ) : bloqueo.pasos.some((p) => !p.concedido) ? (
          /* Permissions are pending but every one of them is
             restricted by the system, so there is nothing this app
             can ask for. Without this the heading sat above six
             ungranted rows and no button at all, which reads as a
             screen that failed — the same failure mode the empty
             list above already learned to avoid.

             Settings is the only way through, so the screen says so
             and opens it. */
          <>
            <Texto estilo="apoyo">
              Estos permisos los da Android, no la app. Ábrelos en los ajustes
              del teléfono y vuelve.
            </Texto>
            <Boton variante="contorno" alTocar={() => void Linking.openSettings()}>
              Abrir los ajustes
            </Boton>
          </>
        ) : null}
      </View>

      <View className="gap-2.5">
        <Text className="text-[12px] font-bold uppercase tracking-widest text-texto-apagado">
          Qué se bloquea
        </Text>

        {bloqueo.listo ? (
          <>
            <Pressable
              onPress={alElegirApps}
              accessibilityRole="button"
              className="flex-row items-center justify-between rounded-xl border border-linea bg-capa px-4 py-3.5"
            >
              {/* "Bloqueada" only when the system says it is. The
                  screen used to say it on the strength of a selection
                  being saved, which is not the same thing and told a
                  learner they were protected when they were not. */}
              <Text className="text-[15px] text-texto">
                {bloqueo.appsSeleccionadas === 0
                  ? 'Escoger apps'
                  : bloqueo.bloqueado
                    ? bloqueo.appsSeleccionadas === 1
                      ? '1 app bloqueada'
                      : `${bloqueo.appsSeleccionadas} apps bloqueadas`
                    : bloqueo.appsSeleccionadas === 1
                      ? '1 app escogida, sin bloquear'
                      : `${bloqueo.appsSeleccionadas} apps escogidas, sin bloquear`}
              </Text>
              <Text className="text-[15px] text-acento-texto">Cambiar</Text>
            </Pressable>

            {bloqueo.appsSeleccionadas > 0 ? (
              <Pressable onPress={() => void bloqueo.quitarTodo()} className="py-2">
                <Text className="text-center text-[13px] text-texto-apagado">
                  Quitar el bloqueo de todas
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <Text className="text-[13.5px] leading-6 text-texto-apagado">
            Primero los permisos de arriba. Sin ellos no podemos bloquear nada.
          </Text>
        )}
      </View>

      <Boton variante="contorno" alTocar={alVolver}>
        Volver
      </Boton>
    </ScrollView>
  );
}
