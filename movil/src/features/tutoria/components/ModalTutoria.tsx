import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
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

/* No opacity suffix on a token colour anywhere in this file.
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
          <Boton variante="plano" alTocar={intentarSalir} etiqueta="Cerrar y seguir">
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

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
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
                  alTocar={mandar}
                  deshabilitado={!texto.trim() || !estado}
                  cargando={enviando}
                  etiqueta="Enviar"
                >
                  Enviar
                </Boton>
              </View>
            )}

            <View className="flex-row justify-between gap-2">
              <Boton variante="plano" alTocar={intentarSalir}>
                Seguir sin repasar
              </Boton>
              <Boton variante="contorno" alTocar={onReintentar}>
                Volver a intentar
              </Boton>
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
