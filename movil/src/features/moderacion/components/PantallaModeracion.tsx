import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { Boton } from '@/shared/ui/Boton';
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
export function PantallaModeracion({ onVolver }: { onVolver: () => void }) {
  const token = useTokenDeModeracion();
  const pendientes = usePendientesDeModeracion(token.tiene);
  const cola = useColaDeModeracion(token.tiene);

  if (token.cargando) {
    return (
      <View className="flex-1 px-5 py-6">
        <EsqueletoLista filas={3} />
      </View>
    );
  }

  if (!token.tiene) {
    return <PedirToken onGuardar={token.guardar} onVolver={onVolver} />;
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-6 px-5 py-6"
      refreshControl={<RefreshControl refreshing={cola.recargando} onRefresh={cola.refrescar} />}
    >
      <Text className="text-[22px] font-bold text-slate-900">Denuncias</Text>

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
        <Text className="text-[15px] leading-6 text-slate-600">
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

      <Pressable
        onPress={() => void token.borrar()}
        className="py-2"
        accessibilityRole="button"
      >
        <Text className="text-center text-[13px] text-slate-500">
          Quitar el token de este teléfono
        </Text>
      </Pressable>

      <Boton variante="contorno" onPress={onVolver}>
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
    <View className="gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-[15px] font-semibold text-slate-900">
            {denuncia.denunciado.alias ?? 'sin nombre'}
          </Text>
          <Text className="text-[13px] text-slate-500">
            {MOTIVO[denuncia.motivo]} · denunció {denuncia.denunciante.alias ?? 'alguien'}
          </Text>
        </View>
        {patron ? (
          <View className="rounded-full bg-red-100 px-2.5 py-1">
            <Text className="text-[11px] font-semibold text-red-700">
              {denuncia.personasQueLoDenunciaron} personas
            </Text>
          </View>
        ) : null}
      </View>

      {denuncia.detalle ? (
        <Text className="text-[14px] leading-5 text-slate-700">“{denuncia.detalle}”</Text>
      ) : (
        <Text className="text-[13px] italic text-slate-400">Sin detalle</Text>
      )}

      <Text className="text-[12px] text-slate-500">
        {denuncia.denunciasTotales === 1
          ? 'Primera denuncia sobre esta cuenta'
          : `${denuncia.denunciasTotales} denuncias en total, de ${denuncia.personasQueLoDenunciaron} ${
              denuncia.personasQueLoDenunciaron === 1 ? 'persona' : 'personas'
            }`}
        {denuncia.denunciado.aliasBuscable ? '' : ' · ya está fuera de búsqueda'}
      </Text>

      <View className="flex-row flex-wrap gap-2">
        <Boton tamano="medio" variante="suave" deshabilitado={ocupado} onPress={onRevisada}>
          Revisada
        </Boton>
        <Boton tamano="medio" variante="contorno" deshabilitado={ocupado} onPress={onDescartada}>
          No había nada
        </Boton>
      </View>

      {denuncia.denunciado.aliasBuscable ? (
        confirmarRetiro ? (
          <View className="gap-2 rounded-xl bg-slate-50 p-3">
            <Text className="text-[13px] leading-5 text-slate-700">
              Deja de ser encontrable y se cancelan sus duelos abiertos. No se borra nada: conserva
              cuenta, historial y nombre, y puede volver a activarse desde sus ajustes.
            </Text>
            <View className="flex-row gap-2">
              <Boton
                tamano="medio"
                deshabilitado={ocupado}
                onPress={() => {
                  setConfirmarRetiro(false);
                  onRetirar();
                }}
              >
                Sí, retirar
              </Boton>
              <Boton
                tamano="medio"
                variante="contorno"
                onPress={() => setConfirmarRetiro(false)}
              >
                Cancelar
              </Boton>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => setConfirmarRetiro(true)} accessibilityRole="button">
            <Text className="text-[13px] text-red-700">Sacar de búsqueda</Text>
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
      <Text className="text-[22px] font-bold text-slate-900">Moderación</Text>
      <Text className="text-[15px] leading-6 text-slate-600">
        Pegue el token de moderación del servidor. Se guarda cifrado en este teléfono y no se
        vuelve a pedir.
      </Text>
      <Text className="text-[13px] leading-5 text-slate-500">
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
        className="rounded-xl border border-slate-300 px-4 py-3 text-[15px] text-slate-900"
      />

      {fallo ? <Aviso mensaje={fallo} /> : null}

      <Boton
        deshabilitado={valor.trim().length === 0}
        onPress={async () => {
          const ok = await onGuardar(valor);
          if (!ok) setFallo('No pudimos guardarlo en este teléfono.');
          else setValor('');
        }}
      >
        Guardar
      </Boton>

      <Boton variante="contorno" onPress={onVolver}>
        Volver
      </Boton>
    </ScrollView>
  );
}
