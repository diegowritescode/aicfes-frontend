import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton, color, Texto } from '@/shared/ui';
import { Aviso } from '@/shared/ui/Aviso';
import { NOMBRE_AREA, type Letra } from '@/shared/model/icfes';
import type { ItemGenerado } from '@/shared/pregunta/api/esquemas';
import { useTutoria } from '../hooks/useTutoria';

const LETRAS: readonly Letra[] = ['A', 'B', 'C', 'D'];

/**
 * The conversation about a question the learner just got wrong, with
 * the question beside it.
 *
 * The question is here because the tutor's advice is almost always
 * "read it again" — the subject line, option C, the second paragraph.
 * Following that advice used to mean closing the panel, reading, and
 * reopening it.
 *
 * It shows context, figure and all four options with the learner's own
 * choice marked, and never the correct answer: this component is not
 * given it. Printing it next to the thread would make the thread
 * decorative.
 *
 * On a phone two columns do not fit, so it is two tabs. The panel opens
 * on the conversation, because that is what the learner came for.
 */

/* Every `Boton` inside a row carries `ancho={false}`.
   The default is `w-full`, which is right for a button that owns its
   line and wrong for one sharing a row: it claims the whole width and
   flattens its siblings. That is what emptied this panel on a real
   phone — it opened showing nothing but Cerrar, and a dump of the
   screen had ten nodes and one piece of text. The title beside the
   button had been squeezed to zero width, and everything below it
   pushed off. `PantallaSimulacro` passes `ancho={false}` on every
   button in a row, which is why its modal works and this one did not.

   No opacity suffix on a token colour anywhere in this file.
   `bg-acento-suave/50` and `border-acento/60` were the last three in
   the app: the tinted surfaces come from the system
   (`acento-suave`), not from an alpha on the accent, which
   `AvisoDeDuelos` already records as «a fifth colour nobody chose».
   They are also where this panel stopped rendering on a real phone —
   it opened showing nothing but its Cerrar button, and everything
   below the header, the tabs included, was missing. */

type Pestana = 'pregunta' | 'repaso';

export function ModalTutoria({
  item,
  opcionElegida,
  visible,
  onReintentar,
  onSalir,
}: {
  item: ItemGenerado;
  opcionElegida: Letra;
  visible: boolean;
  onReintentar: () => void;
  onSalir: () => void;
}) {
  const {
    estado,
    cargando,
    fallo,
    esperaDefensa,
    sinTurnos,
    enviando,
    falloEnvio,
    enviar,
  } = useTutoria(visible ? item.id : null, visible ? opcionElegida : null);

  const [texto, setTexto] = useState('');
  const [pestana, setPestana] = useState<Pestana>('repaso');
  const [confirmandoSalida, setConfirmandoSalida] = useState(false);
  const finRef = useRef<React.ComponentRef<typeof ScrollView> | null>(null);

  /* Only worth confirming when there is something to lose. Asking
     someone who has written nothing is empty friction. */
  const escribioAlgo = (estado?.mensajes ?? []).some((m) => m.autor === 'estudiante');

  const intentarSalir = () => {
    if (escribioAlgo) setConfirmandoSalida(true);
    else onSalir();
  };

  const mandar = () => {
    const limpio = texto.trim();
    if (!limpio || enviando) return;
    enviar(limpio);
    setTexto('');
    /* Sending from «La pregunta» moves to the thread, because the
       thread is the only place the wait is visible. The tutor is a
       language model and takes seconds to answer; the «Pensando…»
       line and the learner's own message both live in the other tab,
       so from this one a send looked like nothing happened at all and
       the panel read as slow rather than busy. */
    setPestana('repaso');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={intentarSalir}>
      <SafeAreaView className="flex-1 bg-capa">
        <View className="flex-row items-start justify-between border-b border-linea px-5 py-4">
          <View className="flex-1">
            <Texto estilo="titulo">Repasemos esta pregunta</Texto>
            <Text className="mt-0.5 text-[13px] text-texto-apagado">
              {esperaDefensa
                ? 'Primero cuéntame qué pensaste'
                : `Le quedan ${estado?.turnosRestantes ?? 0} mensajes`}
            </Text>
          </View>
          <Boton variante="plano" ancho={false} alTocar={intentarSalir} etiqueta="Cerrar y seguir">
            Cerrar
          </Boton>
        </View>

        <View className="flex-row gap-1 border-b border-linea px-4 py-2">
          {(
            [
              ['pregunta', 'La pregunta'],
              ['repaso', 'Repaso'],
            ] as Array<[Pestana, string]>
          ).map(([clave, etiqueta]) => (
            <Pressable
              key={clave}
              onPress={() => setPestana(clave)}
              accessibilityRole="tab"
              accessibilityState={{ selected: pestana === clave }}
              className={`min-h-[44px] flex-1 items-center justify-center rounded-full ${
                pestana === clave ? 'bg-acento-suave' : ''
              }`}
            >
              <Text
                className={`text-[13.5px] font-semibold ${
                  pestana === clave ? 'text-acento-texto' : 'text-texto-apagado'
                }`}
              >
                {etiqueta}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* `behavior="padding"` on both platforms, which React
            Native's own version could not do: on Android it only
            accepted `undefined`, and inside a modal it had no inset to
            work from anyway. The panel is already a full-height sheet,
            so padding at the bottom is the right move — `height` would
            fight the `flex-1`. */}
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          {pestana === 'pregunta' ? (
            <ScrollView contentContainerClassName="gap-4 px-5 py-5">
              <Texto estilo="rotulo">{NOMBRE_AREA[item.area]}</Texto>
              {item.contexto ? (
                <View className="rounded-2xl bg-fondo p-4">
                  <Text className="text-[13.5px] leading-6 text-texto">{item.contexto}</Text>
                </View>
              ) : null}
              <Texto estilo="pregunta">{item.pregunta}</Texto>
              <View className="gap-2">
                {LETRAS.filter((l) => item.opciones[l]).map((letra) => {
                  const suya = letra === opcionElegida;
                  return (
                    <View
                      key={letra}
                      className={`flex-row gap-3 rounded-xl border p-3 ${
                        suya ? 'border-acento bg-acento-suave' : 'border-linea'
                      }`}
                    >
                      <View
                        className={`h-6 w-6 items-center justify-center rounded-full ${
                          suya ? 'bg-acento' : 'bg-capa-alta'
                        }`}
                      >
                        <Text
                          className={`text-[12px] font-bold ${
                            suya ? 'text-sobre-acento' : 'text-texto-apagado'
                          }`}
                        >
                          {letra}
                        </Text>
                      </View>
                      <Text className="flex-1 text-[13.5px] leading-5 text-texto">
                        {item.opciones[letra]}
                        {suya ? (
                          <Text className="text-[12px] font-semibold text-acento-texto">
                            {'  · tu respuesta'}
                          </Text>
                        ) : null}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          ) : (
            <ScrollView
              ref={finRef}
              contentContainerClassName="gap-3 px-5 py-5"
              onContentSizeChange={() => finRef.current?.scrollToEnd({ animated: true })}
            >
              {cargando ? <Text className="text-[14px] text-texto-apagado">Abriendo…</Text> : null}
              {fallo ? <Aviso mensaje={fallo.mensaje} detalle={fallo.detalle} /> : null}

              {estado?.mensajes.map((m, i) => (
                <View
                  key={i}
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    m.autor === 'estudiante'
                      ? 'self-end bg-acento'
                      : 'self-start bg-capa-alta'
                  }`}
                >
                  <Text
                    accessibilityLabel={`${m.autor === 'estudiante' ? 'Usted' : 'Tutor'}: ${m.contenido}`}
                    className={`text-[14px] leading-6 ${
                      m.autor === 'estudiante' ? 'text-sobre-acento' : 'text-texto'
                    }`}
                  >
                    {m.contenido}
                  </Text>
                </View>
              ))}

              {enviando ? (
                <Text accessibilityLiveRegion="polite" className="text-[13px] text-texto-apagado">
                  Pensando…
                </Text>
              ) : null}
              {falloEnvio ? <Aviso mensaje={falloEnvio.mensaje} detalle={falloEnvio.detalle} /> : null}
            </ScrollView>
          )}

          <View className="gap-3 border-t border-linea px-5 py-4">
            {sinTurnos ? (
              <Text className="rounded-xl bg-capa-alta px-4 py-3 text-[13.5px] leading-5 text-texto-apagado">
                Hasta aquí llega esta conversación. Intenta la pregunta otra vez con lo que
                acaban de hablar.
              </Text>
            ) : (
              <View className="flex-row items-end gap-2">
                <TextInput
                  value={texto}
                  onChangeText={setTexto}
                  editable={!enviando && Boolean(estado)}
                  multiline
                  placeholder={
                    esperaDefensa ? `Porque pensé que la ${opcionElegida}…` : 'Escribe tu duda'
                  }
                  placeholderTextColor={color.textoApagado}
                  accessibilityLabel={
                    esperaDefensa ? 'Por qué eligió esa opción' : 'Su mensaje'
                  }
                  className="max-h-28 min-h-[48px] flex-1 rounded-2xl border border-linea px-4 py-3 text-[14px] text-texto"
                />
                <Boton
                  ancho={false}
                  alTocar={mandar}
                  deshabilitado={!texto.trim() || !estado}
                  cargando={enviando}
                  etiqueta="Enviar"
                >
                  Enviar
                </Boton>
              </View>
            )}

            {/* Two short labels, because the row is 384dp wide on a
                common phone and «Seguir sin repasar» beside «Volver a
                intentar» asked for more than that. The first fix was
                to let them shrink, which truncated them to «Seguir sin
                re…» and «Volver a inte…» — a button nobody can read is
                worse than one that is too wide, and the learner caught
                it on the phone. Shortening the words is the fix; the
                shrink underneath is only the safety net for a bigger
                font size.

                Measured rather than guessed, in Nunito 700 at 16px
                against the 168dp each half gets on a 384dp screen:
                «Volver a intentar» is 125dp inside 120dp of room and
                «Intentar otra vez» is 123dp, so both still overflow.
                «Otra vez» is 63dp and «Seguir» 48dp, which leaves room
                for a wider font setting too.

                `etiqueta` carries the full sentence, so a screen
                reader still says «Intentar la pregunta otra vez» while
                the button shows two words. */}
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Boton variante="plano" alTocar={intentarSalir} etiqueta="Seguir sin repasar">
                  Seguir
                </Boton>
              </View>
              <View className="flex-1">
                <Boton
                  variante="contorno"
                  alTocar={onReintentar}
                  etiqueta="Intentar la pregunta otra vez"
                >
                  Otra vez
                </Boton>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>

        <Modal visible={confirmandoSalida} transparent animationType="fade">
          <View className="flex-1 items-center justify-center bg-black/40 px-6">
            <View className="w-full max-w-sm gap-4 rounded-3xl bg-capa p-6">
              <Texto estilo="titulo">¿Salir del repaso?</Texto>
              {/* True, and reassurance rather than warning: the point is
                  to make leaving safe, not frightening. */}
              <Text className="text-[13.5px] leading-6 text-texto-apagado">
                Tu conversación se guarda. Si vuelves a fallar esta pregunta, la retomas donde
                la dejaste.
              </Text>
              <View className="gap-2">
                <Boton alTocar={() => setConfirmandoSalida(false)}>
                  Seguir repasando
                </Boton>
                <Boton variante="plano" alTocar={onSalir}>
                  Salir
                </Boton>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}
