import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { usePendientesDeModeracion, useTokenDeModeracion } from '../hooks/useModeracionCola';

/**
 * The notice that reports are waiting.
 *
 * It sits on the home screen because there is no other moment it can
 * reach anyone: reminders in this app are local notifications
 * scheduled on the device, so nothing can be pushed while the app is
 * closed. The honest version of "notify the moderator" is therefore
 * "answer the question the instant the app opens", which is this.
 *
 * Invisible without a token on the device, so a learner never sees it
 * at all.
 */
export function AvisoDeDenuncias() {
  const router = useRouter();
  const token = useTokenDeModeracion();
  const pendientes = usePendientesDeModeracion(token.tiene);

  /* Nothing while loading, nothing without a token, nothing when the
     queue is empty, and nothing on failure. A moderator whose token
     was rotated should not get an error banner over the learner's own
     progress screen; the moderation screen says so plainly instead. */
  if (!token.tiene || !pendientes.mensaje) return null;

  const grave = pendientes.urgencia !== 'por_revisar';

  return (
    <Pressable
      onPress={() => router.push('/moderacion')}
      accessibilityRole="button"
      accessibilityLabel={`${pendientes.mensaje}. Abrir denuncias.`}
      className={`gap-1 rounded-2xl border p-4 ${
        grave ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
      }`}
    >
      <Text
        className={`text-[11.5px] font-bold uppercase tracking-widest ${
          grave ? 'text-red-700' : 'text-amber-700'
        }`}
      >
        Denuncias
      </Text>
      <Text className="text-[15px] font-semibold leading-6 text-slate-900">
        {pendientes.mensaje}
      </Text>
      {pendientes.urgencia === 'muy_atrasada' ? (
        <Text className="text-[13px] leading-5 text-red-700">
          Quien denunció espera que alguien mire.
        </Text>
      ) : null}
      <Text className="text-[13px] text-slate-500">Toque para revisarlas</Text>
    </Pressable>
  );
}
