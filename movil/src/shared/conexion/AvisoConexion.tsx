import { Text, View } from 'react-native';
import { anunciar, type EstadoConexion } from '@/core/http/model/conexion';

/**
 * The network, mentioned only when it changes what the learner can do.
 *
 * Deliberately not a persistent banner. An app that says "sin
 * conexión" above a dashboard that works teaches people to ignore the
 * message, including the time it matters.
 */
export function AvisoConexion({
  conexion,
  hayDatos,
  esDeCache = false,
}: {
  conexion: EstadoConexion;
  hayDatos: boolean;
  esDeCache?: boolean;
}) {
  const anuncio = anunciar({ conexion, hayDatos, esDeCache });
  if (anuncio.tipo === 'nada') return null;

  const bloqueo = anuncio.tipo === 'bloqueo';

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className={
        bloqueo
          ? 'gap-2 rounded-2xl border border-linea bg-capa p-5'
          : 'rounded-xl bg-fallo-suave px-4 py-2.5'
      }
    >
      <Text
        className={
          bloqueo
            ? 'text-[14px] leading-6 text-texto-apagado'
            : 'text-[12.5px] leading-5 text-fallo'
        }
      >
        {anuncio.mensaje}
      </Text>
    </View>
  );
}
