import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { NOMBRE_AREA } from '@/shared/model/icfes';
import type { ItemGenerado } from '../api/esquemas';

/**
 * Context, figure and question.
 *
 * Long context collapses to about eight lines with a real control to
 * expand, rather than living in its own scroll view. A nested scroll
 * inside a scrolling screen is the classic reading trap: on a phone
 * the inner box eats the swipe and the page stops moving.
 */
export function Enunciado({ item }: { item: ItemGenerado }) {
  const [abierto, setAbierto] = useState(false);
  /* A bank question can arrive without a stimulus, so this reads the
     length defensively rather than assuming one exists. */
  const contexto = item.contexto ?? '';
  const largo = contexto.length > 420;

  return (
    <View className="gap-4">
      <Text className="text-[11.5px] font-bold uppercase tracking-widest text-brand-bright">
        {NOMBRE_AREA[item.area]}
      </Text>

      {item.contexto ? (
        <View className="gap-2">
          <View className="rounded-2xl bg-wash p-5">
            <Text
              numberOfLines={largo && !abierto ? 8 : undefined}
              className="text-[14.5px] leading-7 text-slate-700"
            >
              {contexto}
            </Text>
          </View>
          {largo ? (
            <Pressable
              onPress={() => setAbierto((v) => !v)}
              accessibilityRole="button"
              accessibilityState={{ expanded: abierto }}
              className="min-h-[44px] justify-center"
            >
              <Text className="text-[13px] font-semibold text-brand-bright">
                {abierto ? 'Mostrar menos' : 'Ver todo el texto'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <Text className="text-[17px] font-semibold leading-7 text-slate-900">
        {item.pregunta}
      </Text>
    </View>
  );
}
