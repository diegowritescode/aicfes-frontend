import { View } from 'react-native';
import { Texto } from '../atomos/Texto';

/**
 * One subject and how it is going.
 *
 * A 7px bar, flat, no shadow, no number inside it. The percentage
 * sits at the end of the label line where it can be read as text —
 * a figure printed on a 7px bar is unreadable on a cheap screen.
 *
 * The bar is `acento`, not green-for-good and amber-for-bad. The old
 * dashboard coloured it by threshold and that turned every subject
 * under 70 % into an accusation; four amber bars is what a learner
 * who has just started always sees. Weakness is the product's input,
 * not a verdict, so the bar reports the number and shuts up.
 *
 * Never measured is not the same as zero. An empty bar with «0 %»
 * claims a result nobody produced, so it says so in words instead.
 */

export function FilaMateria({
  nombre,
  porcentaje,
  medida = true,
  detalle,
}: {
  nombre: string;
  porcentaje: number;
  /** False when the learner has not answered anything in this subject. */
  medida?: boolean;
  /** «18 de 25 correctas». Optional: the artifact's dashboard omits it. */
  detalle?: string;
}) {
  return (
    <View className="gap-[7px]">
      <View className="flex-row items-baseline justify-between">
        <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
          {nombre}
        </Texto>
        <Texto estilo="apoyo">{medida ? `${porcentaje}%` : 'Sin practicar'}</Texto>
      </View>
      <View
        className="h-[7px] overflow-hidden rounded-pildora bg-capa-alta"
        accessibilityRole="progressbar"
        accessibilityLabel={
          medida ? `${nombre}, ${porcentaje} por ciento` : `${nombre}, todavía sin practicar`
        }
        accessibilityValue={medida ? { min: 0, max: 100, now: porcentaje } : undefined}
      >
        <View
          className="h-full rounded-pildora bg-acento"
          /* A 1 % result still shows a sliver: a bar at literal zero
             width is indistinguishable from the «sin practicar» case
             the line above just ruled out. */
          style={{ width: medida ? `${Math.max(2, Math.min(100, porcentaje))}%` : 0 }}
        />
      </View>
      {detalle ? <Texto estilo="apoyo">{detalle}</Texto> : null}
    </View>
  );
}
