import { Linking, Pressable, ScrollView, View } from 'react-native';
import { Boton, Chip, Encabezado, Tarjeta, Texto } from '@/shared/ui';
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
 *
 * There is exactly one `principal` button here and it moves: while a
 * permission is pending it is the one that asks for it, and once they
 * are all in it becomes the one that picks the apps. Whatever the
 * learner has to do next is the only filled button on the screen, so
 * «Volver» is flat and never competes with it.
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
        <Texto estilo="titulo">Aquí no podemos bloquear apps</Texto>
        <Texto estilo="apoyo">
          Esta función necesita la app instalada en un Android. Todo lo demás
          funciona igual.
        </Texto>
        <Boton variante="contorno" alTocar={alVolver}>
          Volver
        </Boton>
      </View>
    );
  }

  /* How many are in, for the chip beside the heading. A learner part
     way through six permissions has no other way to see how far along
     they are, and the rows themselves do not add up. */
  const concedidos = bloqueo.pasos.filter((p) => p.concedido).length;

  /* Pending but nothing left to ask for: every remaining permission
     is restricted by the system. */
  const todoRestringido =
    !bloqueo.siguiente && bloqueo.pasos.some((p) => !p.concedido);

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-6 px-5 py-6">
      <View className="gap-2">
        <Texto estilo="titulo-grande">Bloquear apps</Texto>
        <Texto estilo="apoyo">
          Cuando abras una app bloqueada, te pedimos cinco preguntas. Las
          resuelves y se abre.
        </Texto>
      </View>

      {bloqueo.fallo ? <Aviso mensaje={bloqueo.fallo} /> : null}

      <View className="gap-2.5">
        <Encabezado
          rotulo="Permisos"
          derecha={
            bloqueo.pasos.length > 0 ? (
              <Chip tono={bloqueo.listo ? 'ganado' : 'neutro'}>
                {concedidos} de {bloqueo.pasos.length}
              </Chip>
            ) : undefined
          }
        />

        {ordenar(bloqueo.pasos).map((paso) => (
          <ChipDePermiso key={paso.id} paso={paso} />
        ))}

        {/* A heading with nothing under it reads as a screen that
            failed to load — which is exactly how a wrong method name
            surfaced once. Every case now says something. */}
        {bloqueo.pasos.length === 0 ? (
          <Tarjeta variante="plana">
            <Texto estilo="apoyo">
              {bloqueo.sinPasos
                ? 'Este teléfono no pide permisos extra.'
                : 'No pudimos leer los permisos. Cierra y vuelve a abrir la app.'}
            </Texto>
          </Tarjeta>
        ) : null}

        {bloqueo.siguiente ? (
          <>
            {/* The button names what it will ask for. "Pedir el
                siguiente" told the learner nothing about what screen
                was about to open, which is why it read as a gamble. */}
            <Boton alTocar={() => void bloqueo.pedirSiguiente()}>
              {textoDelBoton(bloqueo.siguiente)}
            </Boton>

            {/* The way past a step this phone will not report.
                Reported from a Xiaomi: «Seguir viva en segundo plano»
                is read from the system's battery-optimization list,
                while MIUI's own «Permitir uso en segundo plano» is a
                different switch that does not write to it. The
                learner turns it on, Settings shows it on, and the app
                still reads it off — truthfully, because it is not the
                same setting.

                Without this the queue stopped there for good: the
                button kept naming that step, and the optional ones
                behind it could never be reached. One recommended step
                walled the whole setup.

                Flat and below, never beside: skipping is the lesser
                answer, and a learner who can grant it should. The
                line underneath says what it costs, because a skip
                offered without a consequence reads as "this does not
                matter", and then nobody grants it. */}
            {bloqueo.sePuedeOmitirSiguiente ? (
              <>
                <Boton variante="plano" alTocar={() => void bloqueo.omitirSiguiente()}>
                  Ya lo activé, o lo dejo así
                </Boton>
                <Texto estilo="apoyo" className="text-center">
                  Lo saltamos y seguimos. Si tu teléfono no nos deja verlo, el
                  bloqueo igual funciona: puede fallar si Android nos apaga.
                </Texto>
              </>
            ) : null}
          </>
        ) : todoRestringido ? (
          /* Permissions are pending but every one of them is
             restricted by the system, so there is nothing this app
             can ask for. Without this the heading sat above six
             ungranted rows and no button at all, which reads as a
             screen that failed — the same failure mode the empty
             list above already learned to avoid.

             Settings is the only way through, so the screen says so
             and opens it.

             A flat card and not a raised one: the thing to act on is
             the button under it, and this is the explanation of why
             there is no other way forward. */
          <Tarjeta variante="plana" className="gap-3">
            <Texto estilo="apoyo">
              Estos permisos los da Android, no la app. Ábrelos en los ajustes
              del teléfono y vuelve.
            </Texto>
            <Boton alTocar={() => void Linking.openSettings()}>
              Abrir los ajustes
            </Boton>
          </Tarjeta>
        ) : null}
      </View>

      <View className="gap-2.5">
        <Encabezado rotulo="Qué se bloquea" />

        {bloqueo.listo ? (
          <>
            {bloqueo.appsSeleccionadas === 0 ? (
              /* Nothing picked yet, so this is what the screen is for
                 and it gets the filled button — unless a permission is
                 still asking above.

                 `listo` counts only the required steps, so an optional
                 one left pending puts a permission button and this one
                 on screen together. Two filled buttons make neither of
                 them the answer, and the permission is the one the
                 learner is already looking at. */
              <Boton
                variante={bloqueo.siguiente ? 'contorno' : 'principal'}
                alTocar={alElegirApps}
              >
                Escoger apps
              </Boton>
            ) : (
              <Pressable
                onPress={alElegirApps}
                accessibilityRole="button"
                accessibilityLabel={`${
                  bloqueo.bloqueado
                    ? `${bloqueo.appsSeleccionadas} ${bloqueo.appsSeleccionadas === 1 ? 'app bloqueada' : 'apps bloqueadas'}`
                    : `${bloqueo.appsSeleccionadas} ${bloqueo.appsSeleccionadas === 1 ? 'app escogida, sin bloquear' : 'apps escogidas, sin bloquear'}`
                }. Cambiar`}
              >
                <Tarjeta className="flex-row items-center justify-between gap-3">
                  {/* "Bloqueada" only when the system says it is. The
                      screen used to say it on the strength of a selection
                      being saved, which is not the same thing and told a
                      learner they were protected when they were not. */}
                  <View className="flex-1 gap-0.5">
                    <Texto estilo="opcion" style={{ fontFamily: 'Inter_600SemiBold' }}>
                      {bloqueo.appsSeleccionadas === 1
                        ? '1 app'
                        : `${bloqueo.appsSeleccionadas} apps`}
                    </Texto>
                    <Texto estilo="apoyo">
                      {bloqueo.bloqueado ? 'Bloqueadas ahora' : 'Escogidas, sin bloquear'}
                    </Texto>
                  </View>
                  <Texto estilo="cuerpo" className="text-acento-texto">
                    Cambiar
                  </Texto>
                </Tarjeta>
              </Pressable>
            )}

            {bloqueo.appsSeleccionadas > 0 ? (
              <Boton variante="plano" alTocar={() => void bloqueo.quitarTodo()}>
                Quitar el bloqueo de todas
              </Boton>
            ) : null}
          </>
        ) : (
          /* Flat, because there is nothing to act on here: the action
             is the permission button above. */
          <Tarjeta variante="plana">
            <Texto estilo="apoyo">
              Primero los permisos de arriba. Sin ellos no podemos bloquear nada.
            </Texto>
          </Tarjeta>
        )}
      </View>

      {/* Flat: the screen's own action is one of the buttons above,
          and a second outlined button at the bottom pulled the eye
          away from it. */}
      <Boton variante="plano" alTocar={alVolver}>
        Volver
      </Boton>
    </ScrollView>
  );
}
