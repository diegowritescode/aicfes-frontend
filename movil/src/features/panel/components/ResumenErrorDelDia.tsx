import { Pressable, Text, View } from 'react-native';
import type { ErrorDelDia } from '../api/esquemas';

/**
 * The question of the day, as one line on the dashboard.
 *
 * The card used to hold the whole question — stimulus, four options,
 * explanation — which on a Lectura Crítica item with an email in it
 * filled the screen before the learner reached anything else. The
 * dashboard is a summary; a question is a task, and a task belongs on
 * its own screen.
 *
 * What stays here is the invitation and the reason, because the reason
 * is what makes it worth a tap: this is a question you got wrong, not
 * a random one.
 */
export function ResumenErrorDelDia({
  pregunta,
  onAbrir,
}: {
  pregunta: NonNullable<ErrorDelDia>;
  onAbrir: () => void;
}) {
  return (
    <Pressable
      onPress={onAbrir}
      accessibilityRole="button"
      accessibilityLabel={`Tu pregunta de hoy. ${pregunta.motivo}. Tocar para responder.`}
      className="gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4"
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-[12px] font-bold uppercase tracking-widest text-amber-700">
          Tu pregunta de hoy
        </Text>
        <Text className="text-[12px] font-semibold text-amber-700">Responder →</Text>
      </View>
      <Text className="text-[13.5px] leading-5 text-amber-900">{pregunta.motivo}</Text>
    </Pressable>
  );
}
