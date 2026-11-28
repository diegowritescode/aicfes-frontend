import { useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Boton, Texto } from '@/shared/ui';
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
      <ScrollView className="flex-1 bg-capa" contentContainerClassName="gap-5 px-5 py-8">
        {enviada ? (
          <>
            <Texto estilo="titulo">Denuncia enviada</Texto>
            <Texto estilo="cuerpo">
              Bloqueamos a {alias}: no lo vuelve a ver ni puede retarlo. Una persona de nuestro
              equipo va a revisar lo que nos contó.
            </Texto>
            <Boton alTocar={cerrar}>Listo</Boton>
          </>
        ) : (
          <>
            <Texto estilo="titulo">Denunciar a {alias}</Texto>
            <Texto estilo="cuerpo">
              Al denunciar lo bloqueamos de inmediato. No tiene que esperar a que alguien revise.
            </Texto>

            <View className="gap-2">
              {MOTIVOS.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => setMotivo(m.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: motivo === m.id }}
                  className={`min-h-toque justify-center rounded-medio border-[1.5px] px-4 ${
                    motivo === m.id
                      ? 'border-acento bg-acento-suave'
                      : 'border-borde-control bg-capa'
                  }`}
                >
                  <Texto estilo="opcion">{m.texto}</Texto>
                </Pressable>
              ))}
            </View>

            <TextInput
              value={detalle}
              onChangeText={setDetalle}
              placeholder="¿Qué pasó? (opcional)"
              multiline
              maxLength={1000}
              /* Only the face is inline. A `borderRadius` or a fill in
                 a style object wins over the compiled class and the
                 field loses it. */
              style={{ fontFamily: 'Inter_400Regular' }}
              className="min-h-[90px] rounded-medio border-[1.5px] border-borde-control bg-capa px-4 py-3 text-[15px] text-texto"
            />

            {fallo ? <Aviso mensaje={fallo} /> : null}

            <Boton
              cargando={denunciando}
              deshabilitado={denunciando || motivo === null}
              alTocar={async () => {
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

            <Boton variante="contorno" alTocar={cerrar}>
              Cancelar
            </Boton>
          </>
        )}
      </ScrollView>
    </Modal>
  );
}
