import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { Boton } from '@/shared/ui';
import { Aviso } from '@/shared/ui/Aviso';
import { EsqueletoLista } from '@/shared/ui/Esqueleto';
import { useColaDeModeracion, usePendientesDeModeracion, useTokenDeModeracion } from '../hooks/useModeracionCola';
import type { Denuncia } from '../api/esquemas';

const MOTIVO: Record<Denuncia['motivo'], string> = {
  acoso: 'Acoso',
  alias_ofensivo: 'Nombre ofensivo',
  suplantacion: 'Suplantación',
  otro: 'Otro',
};

/**
 * Reading and acting on reports, from the phone.
 *
 * It exists because the queue was readable only from a terminal, and a
 * queue you have to sit at a computer to read is a queue that waits
 * until the weekend. The learner who reported harassment was told a
 * person would look at it.
 *
 * Hidden entirely without a token on the device, so a learner never
 * sees that any of this is here.
 */
export function PantallaModeracion({
  onVolver,
  esModerador = false,
}: {
  onVolver: () => void;
  /* Whether the signed-in account holds the role. With it, nothing
     needs pasting (ADR 34); the token screen is for the fallback. */
  esModerador?: boolean;
}) {
  const token = useTokenDeModeracion();
  const puede = esModerador || token.tiene;
  const pendientes = usePendientesDeModeracion(puede);
  const cola = useColaDeModeracion(puede);

  if (token.cargando) {
    return (
      <View className="flex-1 px-5 py-6">
        <EsqueletoLista filas={3} />
      </View>
    );
  }

  if (!puede) {
    return <PedirToken onGuardar={token.guardar} onVolver={onVolver} />;
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-6 px-5 py-6"
      refreshControl={<RefreshControl refreshing={cola.recargando} onRefresh={cola.refrescar} />}
    >
      <Text className="text-[22px] font-bold text-texto">Denuncias</Text>

      {pendientes.mensaje ? (
        <Aviso
          tono={pendientes.urgencia === 'por_revisar' ? 'aviso' : 'error'}
          mensaje={pendientes.mensaje}
          detalle={
            pendientes.urgencia === 'muy_atrasada'
              ? 'Esta cola no se está atendiendo. Quien denunció espera que alguien mire.'
              : undefined
          }
        />
      ) : null}

      {cola.fallo ? (
        <Aviso
          mensaje="No pudimos leer la cola"
          detalle={`${cola.fallo.mensaje} Si rotó el token, vuelva a pegarlo abajo.`}
        />
      ) : null}

      {cola.cargando ? <EsqueletoLista filas={3} /> : null}

      {!cola.cargando && cola.denuncias.length === 0 && !cola.fallo ? (
        <Text className="text-[15px] leading-6 text-texto-apagado">
          Nada sin revisar. Cuando alguien denuncie, aparece aquí con la más vieja primero.
        </Text>
      ) : null}

      {cola.falloAlActuar ? <Aviso mensaje={cola.falloAlActuar.mensaje} /> : null}

      {cola.denuncias.map((d) => (
        <TarjetaDenuncia
          key={d.id}
          denuncia={d}
          ocupado={cola.resolviendo || cola.retirando}
          onRevisada={() => void cola.resolver({ id: d.id, estado: 'revisada' })}
          onDescartada={() => void cola.resolver({ id: d.id, estado: 'descartada' })}
          onRetirar={() => void cola.retirar(d.denunciado.id)}
        />
      ))}

      {/* Only when a token is what is being used. Offering to remove
          a token that was never pasted reads as a broken button. */}
      {token.tiene ? (
        <Pressable
          onPress={() => void token.borrar()}
          className="py-2"
          accessibilityRole="button"
        >
          <Text className="text-center text-[13px] text-texto-apagado">
            Quitar el token de este teléfono
          </Text>
        </Pressable>
      ) : null}

      <Boton variante="contorno" alTocar={onVolver}>
        Volver
      </Boton>
    </ScrollView>
  );
}

/**
 * One report, with what is needed to judge it.
 *
 * `personasQueLoDenunciaron` is shown next to the total because they
 * answer different questions: three complaints from one person may be
 * a fight between two learners, and one each from three people is a
 * pattern.
 */
function TarjetaDenuncia({
  denuncia,
  ocupado,
  onRevisada,
  onDescartada,
  onRetirar,
}: {
  denuncia: Denuncia;
  ocupado: boolean;
  onRevisada: () => void;
  onDescartada: () => void;
  onRetirar: () => void;
}) {
  const [confirmarRetiro, setConfirmarRetiro] = useState(false);
  const patron = denuncia.personasQueLoDenunciaron > 1;

  return (
    <View className="gap-3 rounded-2xl border border-linea bg-capa p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-[15px] font-semibold text-texto">
            {denuncia.denunciado.alias ?? 'sin nombre'}
          </Text>
          <Text className="text-[13px] text-texto-apagado">
            {MOTIVO[denuncia.motivo]} · denunció {denuncia.denunciante.alias ?? 'alguien'}
          </Text>
        </View>
        {patron ? (
          <View className="rounded-pildora bg-alerta-suave px-2.5 py-1">
            <Text className="text-[11px] font-semibold text-alerta">
              {denuncia.personasQueLoDenunciaron} personas
            </Text>
          </View>
        ) : null}
      </View>

      {denuncia.detalle ? (
        <Text className="text-[14px] leading-5 text-texto">“{denuncia.detalle}”</Text>
      ) : (
        <Text className="text-[13px] italic text-texto-apagado">Sin detalle</Text>
      )}

      <Text className="text-[12px] text-texto-apagado">
        {denuncia.denunciasTotales === 1
          ? 'Primera denuncia sobre esta cuenta'
          : `${denuncia.denunciasTotales} denuncias en total, de ${denuncia.personasQueLoDenunciaron} ${
              denuncia.personasQueLoDenunciaron === 1 ? 'persona' : 'personas'
            }`}
        {denuncia.denunciado.aliasBuscable ? '' : ' · ya está fuera de búsqueda'}
      </Text>

      <View className="flex-row flex-wrap gap-2">
        <Boton variante="plano" deshabilitado={ocupado} alTocar={onRevisada}>
          Revisada
        </Boton>
        <Boton ancho={false} variante="contorno" deshabilitado={ocupado} alTocar={onDescartada}>
          No había nada
        </Boton>
      </View>

      {denuncia.denunciado.aliasBuscable ? (
        confirmarRetiro ? (
          <View className="gap-2 rounded-xl bg-capa-alta p-3">
            <Text className="text-[13px] leading-5 text-texto">
              Deja de ser encontrable y se cancelan sus duelos abiertos. No se borra nada: conserva
              cuenta, historial y nombre, y puede volver a activarse desde sus ajustes.
            </Text>
            <View className="flex-row gap-2">
              <Boton
                deshabilitado={ocupado}
                alTocar={() => {
                  setConfirmarRetiro(false);
                  onRetirar();
                }}
              >
                Sí, retirar
              </Boton>
              <Boton ancho={false}
                variante="contorno"
                alTocar={() => setConfirmarRetiro(false)}
              >
                Cancelar
              </Boton>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => setConfirmarRetiro(true)} accessibilityRole="button">
            <Text className="text-[13px] text-alerta">Sacar de búsqueda</Text>
          </Pressable>
        )
      ) : null}
    </View>
  );
}

/**
 * Pasting the token in.
 *
 * Once per device. It goes to the keystore, not to a file the app
 * reads back in plain text — and it is still a secret on a phone that
 * can be lost, which is why rotating it is one command on the server.
 */
function PedirToken({
  onGuardar,
  onVolver,
}: {
  onGuardar: (token: string) => Promise<boolean>;
  onVolver: () => void;
}) {
  const [valor, setValor] = useState('');
  const [fallo, setFallo] = useState<string | null>(null);

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 py-8">
      <Text className="text-[22px] font-bold text-texto">Moderación</Text>
      <Text className="text-[15px] leading-6 text-texto-apagado">
        Pegue el token de moderación del servidor. Se guarda cifrado en este teléfono y no se
        vuelve a pedir.
      </Text>
      <Text className="text-[13px] leading-5 text-texto-apagado">
        Si pierde el teléfono, genere uno nuevo en el servidor: eso invalida este de inmediato.
      </Text>

      <TextInput
        value={valor}
        onChangeText={(t) => {
          setValor(t);
          setFallo(null);
        }}
        placeholder="Token"
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        className="rounded-xl border border-borde-control px-4 py-3 text-[15px] text-texto"
      />

      {fallo ? <Aviso mensaje={fallo} /> : null}

      <Boton ancho={false}
        deshabilitado={valor.trim().length === 0}
        alTocar={async () => {
          const ok = await onGuardar(valor);
          if (!ok) setFallo('No pudimos guardarlo en este teléfono.');
          else setValor('');
        }}
      >
        Guardar
      </Boton>

      <Boton ancho={false} variante="contorno" alTocar={onVolver}>
        Volver
      </Boton>
    </ScrollView>
  );
}
