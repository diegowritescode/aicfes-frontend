import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Boton } from '@/shared/ui/Boton';
import { Aviso } from '@/shared/ui/Aviso';
import { useModeracion } from '../hooks/useDuelos';
import type { MotivoDenuncia } from '../api/esquemas';

/**
 * Reporting someone.
 *
 * Reachable from a duel, which is where the harassment happens. A
 * report button only in a settings screen is a report button nobody
 * finds at the moment they need it.
 *
 * Reporting also blocks, on the server, and the screen says so before
 * the tap rather than after: someone reporting harassment wants it to
 * stop now, and being told "ya no lo volverá a ver" is the part that
 * matters to them.
 */
const MOTIVOS: ReadonlyArray<{ id: MotivoDenuncia; texto: string }> = [
  { id: 'acoso', texto: 'Me está molestando' },
  { id: 'alias_ofensivo', texto: 'Su nombre es ofensivo' },
  { id: 'suplantacion', texto: 'Se hace pasar por otra persona' },
  { id: 'otro', texto: 'Otra cosa' },
];

export function ModalDenuncia({
  visible,
  jugadorId,
  alias,
  onCerrar,
}: {
  visible: boolean;
  jugadorId: string;
  alias: string;
  onCerrar: () => void;
}) {
  const { denunciar, denunciando } = useModeracion();
  const [motivo, setMotivo] = useState<MotivoDenuncia | null>(null);
  const [detalle, setDetalle] = useState('');
  const [enviada, setEnviada] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  const cerrar = () => {
    setMotivo(null);
    setDetalle('');
    setEnviada(false);
    setFallo(null);
    onCerrar();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={cerrar}>
      <ScrollView className="flex-1 bg-white" contentContainerClassName="gap-5 px-5 py-8">
        {enviada ? (
          <>
            <Text className="text-[22px] font-bold text-slate-900">Denuncia enviada</Text>
            <Text className="text-[15px] leading-6 text-slate-600">
              Bloqueamos a {alias}: no lo vuelve a ver ni puede retarlo. Una persona de nuestro
              equipo va a revisar lo que nos contó.
            </Text>
            <Boton onPress={cerrar}>Listo</Boton>
          </>
        ) : (
          <>
            <Text className="text-[22px] font-bold text-slate-900">Denunciar a {alias}</Text>
            <Text className="text-[15px] leading-6 text-slate-600">
              Al denunciar lo bloqueamos de inmediato. No tiene que esperar a que alguien revise.
            </Text>

            <View className="gap-2">
              {MOTIVOS.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => setMotivo(m.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: motivo === m.id }}
                  className={`rounded-xl border px-4 py-3 ${
                    motivo === m.id
                      ? 'border-brand-bright bg-brand-bright/10'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  <Text className="text-[15px] text-slate-800">{m.texto}</Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              value={detalle}
              onChangeText={setDetalle}
              placeholder="¿Qué pasó? (opcional)"
              multiline
              maxLength={1000}
              className="min-h-[90px] rounded-xl border border-slate-300 px-4 py-3 text-[15px] text-slate-900"
            />

            {fallo ? <Aviso mensaje={fallo} /> : null}

            <Boton
              cargando={denunciando}
              deshabilitado={denunciando || motivo === null}
              onPress={async () => {
                if (!motivo) return;
                setFallo(null);
                const r = await denunciar({
                  denunciadoId: jugadorId,
                  motivo,
                  detalle: detalle.trim() || undefined,
                }).catch((e: { mensaje?: string }) => {
                  setFallo(e?.mensaje ?? 'No pudimos enviar la denuncia.');
                  return null;
                });
                if (r) setEnviada(true);
              }}
            >
              Denunciar y bloquear
            </Boton>

            <Boton variante="contorno" onPress={cerrar}>
              Cancelar
            </Boton>
          </>
        )}
      </ScrollView>
    </Modal>
  );
}
