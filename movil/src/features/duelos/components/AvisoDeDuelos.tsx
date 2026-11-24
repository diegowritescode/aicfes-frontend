import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMisDuelos } from '../hooks/useDuelos';

/**
 * That someone is waiting on you.
 *
 * On the home screen because there is nowhere else it can reach
 * anyone: reminders here are local notifications scheduled on the
 * device, so nothing can be pushed while the app is closed. A
 * challenge sent at noon was invisible until the learner happened to
 * open the duels screen — which, for someone who did not know a duel
 * existed, is never.
 *
 * Two different things, and only one of them is a request: a
 * challenge to answer, and a round waiting to be played. Both have
 * someone on the other end.
 */
export function AvisoDeDuelos() {
  const router = useRouter();
  const duelos = useMisDuelos();

  const porAceptar = duelos.porAceptar.length;
  const porJugar = duelos.enCurso.filter((d) => !d.miMarcador).length;

  if (porAceptar === 0 && porJugar === 0) return null;

  /* Named rather than counted when there is one. "Camilo te retó" is
     a person; "1 duelo pendiente" is a chore. */
  const texto = (() => {
    if (porAceptar === 1 && porJugar === 0) {
      const alias = duelos.porAceptar[0]?.contra?.alias;
      return alias ? `${alias} te retó` : 'Te retaron a un duelo';
    }
    if (porAceptar === 0 && porJugar === 1) {
      const alias = duelos.enCurso.find((d) => !d.miMarcador)?.contra?.alias;
      return alias ? `Te falta jugar contra ${alias}` : 'Tienes un duelo sin jugar';
    }
    const total = porAceptar + porJugar;
    return `${total} duelos te esperan`;
  })();

  return (
    <Pressable
      onPress={() => router.push('/duelos')}
      accessibilityRole="button"
      accessibilityLabel={`${texto}. Abrir duelos.`}
      className="gap-1 rounded-2xl border border-brand-bright/30 bg-brand-bright/5 p-4"
    >
      <Text className="text-[11.5px] font-bold uppercase tracking-widest text-brand-bright">
        Duelos
      </Text>
      <Text className="text-[15px] font-semibold leading-6 text-slate-900">{texto}</Text>
      <Text className="text-[13px] text-slate-500">
        {porAceptar > 0 ? 'Toca para responder' : 'Toca para jugar tu ronda'}
      </Text>
    </Pressable>
  );
}
