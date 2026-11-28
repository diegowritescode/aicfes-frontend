import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BarraRespuesta,
  Boton,
  Chip,
  Contexto,
  Encabezado,
  Explicacion,
  Opcion,
  Progreso,
  Texto,
  type EstadoOpcion,
} from '@/shared/ui';
import { Aviso } from '@/shared/ui/Aviso';
import { NOMBRE_AREA, type Letra } from '@/shared/model/icfes';
import { ModalTutoria } from '@/features/tutoria/components/ModalTutoria';
import { useExamen } from '../hooks/useExamen';
import { debeAbrirTutoria, esCorrecta, explicacionDe } from '@/shared/pregunta/model/reglas';

const LETRAS: readonly Letra[] = ['A', 'B', 'C', 'D'];

/**
 * Training: answer, find out immediately, and talk about it when it
 * went wrong.
 *
 * The opposite of a sitting on purpose. Here the verdict is the point:
 * the gap between "you failed" and "here is what you got wrong" is
 * where studying happens, and closing it while the mistake is still
 * warm is the whole reason this mode exists.
 *
 * The stimulus goes through `Contexto` and the button sits outside the
 * scroll view. Before that, a Lectura Crítica item printed its
 * 1200-character passage in full and pushed the question, the four
 * options and «Responder» below the fold: the learner scrolled a
 * screen and a half through text before finding out what was asked,
 * and then had to scroll the same distance back to answer.
 */
export function PantallaExamen({
  examen,
  alTerminar,
}: {
  examen: ReturnType<typeof useExamen>;
  alTerminar: () => void;
}) {
  const [elegida, setElegida] = useState<Letra | null>(null);
  const [respondida, setRespondida] = useState(false);
  const [tutoriaAbierta, setTutoriaAbierta] = useState(false);

  const item = examen.item;
  if (!item) return null;

  const confirmar = () => {
    if (!elegida || respondida) return;
    examen.responder(elegida);
    setRespondida(true);
    /* The panel does NOT open by itself.
    
       It used to, on every wrong answer, and the reasoning was that
       the learner's thinking is still fresh. That reasoning is right
       about WHEN tutoring works and wrong about what the screen owes
       them first: the modal covered the result it was reacting to.
       Diego answered, and before he could see which option was
       correct or read the explanation underneath, a panel asked him
       what he had been thinking — about a question whose outcome he
       had not been shown.
    
       So the screen resolves the question first: the options colour
       in, the explanation appears, and «No entiendo por qué» sits
       below it for whoever wants more. That button is the one the
       ADR 17 flow was always written for — opening a thread is free
       and returns the stored explanation, and a learner who taps it
       has already decided the explanation was not enough. */
  };

  const siguiente = () => {
    setElegida(null);
    setRespondida(false);
    if (examen.esUltima) {
      alTerminar();
      return;
    }
    examen.avanzar();
  };

  const estadoDe = (letra: Letra): EstadoOpcion => {
    if (!respondida) return elegida === letra ? 'elegida' : 'pendiente';
    if (letra === item.respuesta_correcta) return 'correcta';
    if (letra === elegida) return 'fallada';
    return 'apagada';
  };

  const acerto = respondida && elegida ? esCorrecta(item, elegida) : false;
  const correctas = examen.respuestas.filter((r) => r.isCorrect).length;

  return (
    <SafeAreaView className="flex-1 bg-fondo">
      <ScrollView contentContainerClassName="gap-4 px-5 py-5">
        <Encabezado
          rotulo={NOMBRE_AREA[item.area]}
          derecha={
            <Chip tono="acento">
              {examen.indice + 1} de {examen.items.length}
            </Chip>
          }
        />

        <Progreso
          hechas={examen.respuestas.length}
          total={examen.items.length}
          dicho={`Pregunta ${examen.indice + 1} de ${examen.items.length}, ${correctas} correctas`}
        />

        {item.contexto ? <Contexto>{item.contexto}</Contexto> : null}

        <Texto estilo="pregunta">{item.pregunta}</Texto>

        <View className="gap-[9px]" accessibilityRole="radiogroup">
          {LETRAS.filter((l) => item.opciones[l]).map((letra) => (
            <Opcion
              key={letra}
              letra={letra}
              estado={estadoDe(letra)}
              /* No handler once answered: `Opcion` disables itself on
                 a resolved state, and leaving one attached would make
                 a dead row look tappable. */
              alTocar={respondida ? undefined : () => setElegida(letra)}
            >
              {item.opciones[letra] ?? ''}
            </Opcion>
          ))}
        </View>

        {respondida ? (
          <View accessibilityLiveRegion="polite" className="gap-3">
            <Explicacion acerto={acerto}>
              {elegida ? explicacionDe(item, elegida) : (item.justificacion ?? '')}
            </Explicacion>
            {/* `debeAbrirTutoria` still decides, just not when to
                open the panel — now whether to offer it. It answers
                «can this item say anything useful about the option
                they picked?», and a button that opens a thread whose
                first message is empty teaches the learner that the
                panel is noise. */}
            {elegida && debeAbrirTutoria(item, elegida) ? (
              <Boton variante="contorno" alTocar={() => setTutoriaAbierta(true)}>
                No entiendo por qué
              </Boton>
            ) : null}
          </View>
        ) : null}

        {examen.guardar.isError ? <Aviso
            mensaje={examen.guardar.error.mensaje}
            detalle={examen.guardar.error.detalle}
          /> : null}
      </ScrollView>

      <BarraRespuesta>
        {respondida ? (
          <Boton alTocar={siguiente}>
            {examen.esUltima ? 'Ver resultados' : 'Siguiente'}
          </Boton>
        ) : (
          /* Named even while it is disabled. A greyed-out «Responder»
             reads as broken and gets tapped; «Elige una opción» says
             what is missing. */
          <Boton alTocar={confirmar} deshabilitado={!elegida}>
            {elegida ? 'Responder' : 'Elige una opción'}
          </Boton>
        )}
      </BarraRespuesta>

      {elegida && !acerto ? (
        <ModalTutoria
          item={item}
          opcionElegida={elegida}
          visible={tutoriaAbierta}
          onSalir={() => setTutoriaAbierta(false)}
          onReintentar={() => {
            setTutoriaAbierta(false);
            /* The first answer stays recorded. What they knew before
               the explanation is the honest measure. */
            setRespondida(false);
            setElegida(null);
            examen.reintentar();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}
