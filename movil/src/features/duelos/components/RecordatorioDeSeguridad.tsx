import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Tarjeta, Texto, color } from '@/shared/ui';
import { SEGURIDAD_AL_ESCRIBIR } from '../model/seguridad-en-linea';

/**
 * The online-safety reminder, above any field strangers read.
 *
 * Required by Play's Families policy for an app whose audience
 * includes minors and which lets them exchange freeform information:
 * «must provide an in-app reminder to be safe online and to be aware
 * of the real world risk of online interaction before allowing child
 * users to exchange freeform media or information.»
 *
 * Deliberately NOT a modal, and the reasons are worth keeping:
 *
 * - Google asks for a reminder, not for consent. Consent is the
 *   guardian authorisation that already gates the whole social half.
 *   A dialog with an «Entiendo» button would imply the learner
 *   accepted a condition, which is a different and heavier claim.
 * - A note that stays is better than a modal that fires once. It is
 *   still there on the twentieth edit, which is when somebody finally
 *   types their Instagram handle.
 * - It is one more tap in front of a text box the learner already
 *   decided to fill, and a reminder people learn to dismiss without
 *   reading has stopped being a reminder.
 *
 * `variante="plana"` rather than `acento`: the accent panel is for
 *  one thing per screen and the preview card above already owns it.
 *  Shouting here would not make it more read — the heading does that.
 */

/** 24px glyph at stroke 1.9, matching the rest of the system. */
const ESCUDO = 'M12 3l8 3v6c0 4.5-3.2 7.9-8 9-4.8-1.1-8-4.5-8-9V6Z';

export function RecordatorioDeSeguridad() {
  const texto = SEGURIDAD_AL_ESCRIBIR;

  return (
    <Tarjeta
      variante="plana"
      className="gap-3"
      /* Read as one block rather than six fragments. Without this a
         screen reader announces the heading, then four bullets and a
         closing line as unrelated items, and the warning arrives as
         debris. */
      accessibilityRole="summary"
      accessibilityLabel={`${texto.titulo}. ${texto.riesgo} Nunca escribas: ${texto.nunca.join(
        ' ',
      )} ${texto.salida}`}
    >
      <View className="flex-row items-start gap-2.5">
        <View className="mt-0.5">
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d={ESCUDO}
              stroke={color.alerta}
              strokeWidth={1.9}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>

        <View className="flex-1 gap-2">
          <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
            {texto.titulo}
          </Texto>
          <Texto estilo="apoyo">{texto.riesgo}</Texto>
        </View>
      </View>

      <View className="gap-1">
        <Texto estilo="rotulo">Nunca escribas aquí</Texto>
        {texto.nunca.map((cosa) => (
          <View key={cosa} className="flex-row gap-2">
            <Texto estilo="apoyo">•</Texto>
            <Texto estilo="apoyo" className="flex-1">
              {cosa}
            </Texto>
          </View>
        ))}
      </View>

      <Texto estilo="apoyo">{texto.salida}</Texto>
    </Tarjeta>
  );
}
