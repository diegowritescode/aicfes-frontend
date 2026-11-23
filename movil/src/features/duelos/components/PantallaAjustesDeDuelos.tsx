import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { Boton } from '@/shared/ui/Boton';
import { Aviso } from '@/shared/ui/Aviso';
import { EsqueletoLista } from '@/shared/ui/Esqueleto';
import { useModeracion, usePerfilDeDuelos } from '../hooks/useDuelos';

/**
 * Name, privacy and blocked list.
 *
 * All in one screen because they are one subject: who can find me and
 * who cannot reach me. Splitting the guardian's authorisation into its
 * own flow would make it feel like a formality, which is the opposite
 * of what it is.
 */
export function PantallaAjustesDeDuelos({ onVolver }: { onVolver: () => void }) {
  const perfil = usePerfilDeDuelos();
  const moderacion = useModeracion();
  const [borrador, setBorrador] = useState('');
  const [guardado, setGuardado] = useState(false);

  if (perfil.cargando) {
    return (
      <View className="flex-1 px-5 py-6">
        <EsqueletoLista filas={3} />
      </View>
    );
  }

  const actual = perfil.perfil;

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-7 px-5 py-6">
      <Text className="text-[22px] font-bold text-slate-900">Duelos: mi cuenta</Text>

      <View className="gap-3">
        <Text className="text-[13px] font-semibold uppercase tracking-wide text-slate-500">
          Mi nombre en la app
        </Text>
        <Text className="text-[13px] leading-5 text-slate-600">
          Es como lo encuentran sus compañeros. No use su nombre completo ni su colegio.
        </Text>
        <TextInput
          value={borrador || actual?.alias || ''}
          onChangeText={(t) => {
            setBorrador(t);
            setGuardado(false);
          }}
          placeholder="camilo11"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={16}
          className="rounded-xl border border-slate-300 px-4 py-3 text-[15px] text-slate-900"
        />
        {perfil.falloDeAlias ? <Aviso mensaje={perfil.falloDeAlias.mensaje} /> : null}
        {guardado ? (
          <Text className="text-[13px] text-emerald-700">Nombre guardado.</Text>
        ) : null}
        <Boton
          cargando={perfil.guardandoAlias}
          deshabilitado={perfil.guardandoAlias || borrador.trim().length === 0}
          onPress={async () => {
            const r = await perfil.ponerAlias(borrador.trim()).catch(() => null);
            if (r) {
              setGuardado(true);
              setBorrador('');
            }
          }}
        >
          Guardar nombre
        </Boton>
      </View>

      {/* The legal gate, said in plain words rather than as a notice
          nobody reads. */}
      <View className="gap-3">
        <Text className="text-[13px] font-semibold uppercase tracking-wide text-slate-500">
          Autorización del acudiente
        </Text>
        {actual?.tutorAutorizoEn ? (
          <Text className="text-[13px] leading-5 text-slate-600">
            Autorizado. Ya puede retar y ser retado.
          </Text>
        ) : (
          <>
            <Text className="text-[13px] leading-5 text-slate-600">
              Para que otros estudiantes lo encuentren por su nombre, la ley colombiana pide la
              autorización de su papá, mamá o acudiente. Muéstrele esta pantalla antes de
              continuar.
            </Text>
            <Text className="text-[13px] leading-5 text-slate-600">
              Sin esto, la app funciona completa: entrenar, simulacros, el peaje y repasar
              errores. Lo único que no funciona son los duelos.
            </Text>
            <Boton
              cargando={perfil.guardandoAutorizacion}
              deshabilitado={perfil.guardandoAutorizacion}
              onPress={() => void perfil.declararAutorizacion()}
            >
              Mi acudiente autoriza
            </Boton>
          </>
        )}
      </View>

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-[15px] font-semibold text-slate-900">
              Que otros me encuentren
            </Text>
            <Text className="text-[13px] leading-5 text-slate-600">
              Si lo apaga, nadie lo encuentra por su nombre. Conserva el nombre y sus duelos.
            </Text>
          </View>
          <Switch
            value={actual?.aliasBuscable ?? false}
            onValueChange={(v) => void perfil.cambiarBuscable(v)}
          />
        </View>
      </View>

      <View className="gap-3">
        <Text className="text-[13px] font-semibold uppercase tracking-wide text-slate-500">
          Bloqueados
        </Text>
        {moderacion.bloqueados.length === 0 ? (
          <Text className="text-[13px] text-slate-500">No ha bloqueado a nadie.</Text>
        ) : (
          moderacion.bloqueados.map((b) => (
            <View
              key={b.bloqueado.id}
              className="flex-row items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
            >
              <Text className="text-[15px] text-slate-800">{b.bloqueado.alias}</Text>
              <Pressable
                disabled={moderacion.bloqueando}
                onPress={() => void moderacion.desbloquear(b.bloqueado.id)}
              >
                <Text className="text-[13px] text-brand-bright">Desbloquear</Text>
              </Pressable>
            </View>
          ))
        )}
        <Text className="text-[12px] leading-5 text-slate-500">
          Si alguien lo molesta, bloquéelo o denúncielo desde el duelo. Al denunciar lo bloqueamos
          de inmediato.
        </Text>
      </View>

      <Boton variante="contorno" onPress={onVolver}>
        Volver
      </Boton>
    </ScrollView>
  );
}
