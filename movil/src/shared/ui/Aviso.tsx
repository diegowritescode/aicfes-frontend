import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

/**
 * Something went wrong, said once, where it happened.
 *
 * It announces itself to a screen reader: a learner who cannot see the
 * red box would otherwise tap the button again and wonder why nothing
 * happens.
 *
 * `detalle` is the technical cause, hidden behind a tap. A phone has no
 * console, so without somewhere to put it a field report is just "sin
 * conexión" and the real error — a refused handshake, a DNS miss, our
 * own deadline firing — is lost. It stays collapsed because it is not
 * written for a learner; it is written for whoever has to fix it.
 */
export function Aviso({
  mensaje,
  tono = 'error',
  detalle,
}: {
  mensaje: string;
  tono?: 'error' | 'aviso';
  detalle?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const marco = tono === 'error' ? 'bg-rose-50' : 'bg-amber-50';
  const texto = tono === 'error' ? 'text-rose-700' : 'text-amber-800';
  const tenue = tono === 'error' ? 'text-rose-400' : 'text-amber-500';

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className={`gap-2 rounded-2xl px-4 py-3 ${marco}`}
    >
      <Text className={`text-[13.5px] leading-relaxed ${texto}`}>{mensaje}</Text>

      {detalle ? (
        <>
          <Pressable
            onPress={() => setAbierto((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={abierto ? 'Ocultar detalle técnico' : 'Ver detalle técnico'}
            hitSlop={8}
          >
            <Text className={`text-[11.5px] font-semibold uppercase tracking-wide ${tenue}`}>
              {abierto ? 'Ocultar detalle' : 'Ver detalle'}
            </Text>
          </Pressable>

          {abierto ? (
            <Text selectable className={`text-[11.5px] leading-5 ${tenue}`}>
              {detalle}
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
