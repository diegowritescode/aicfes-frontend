import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { Avatar, Boton, Chip, Personaje, Tarjeta, Texto } from '@/shared/ui';
import { Aviso } from '@/shared/ui/Aviso';
import { EsqueletoLista } from '@/shared/ui/Esqueleto';
import { useAmigos, useBuscarJugadores, useMisDuelos, useModeracion, usePerfilDeDuelos } from '../hooks/useDuelos';
import { ModalDenuncia } from './ModalDenuncia';
import type { Duelo } from '../api/esquemas';

/**
 * Duels: what is waiting, and how to start one.
 *
 * Opens on what needs an answer, not on a search box. A learner with a
 * pending challenge should see it before anything else; one with none
 * is the only one who needs the search.
 *
 * The hierarchy is this screen's whole argument. A duel the learner
 * can act on is a raised `Tarjeta`; one they are only waiting on is
 * `plana`. The flat list this replaced rendered both the same way, so
 * «te toca» was indistinguishable from «no hay nada que hacer» — the
 * one distinction the screen exists to draw.
 */
export function PantallaDuelos({
  onJugar,
  onAjustes,
  onVerPerfil,
}: {
  onJugar: (dueloId: string, contra: string, rivalId: string | null) => void;
  onAjustes: () => void;
  /** Opens a search result's profile before deciding anything. */
  onVerPerfil: (usuarioId: string) => void;
}) {
  const { perfil, cargando: cargandoPerfil } = usePerfilDeDuelos();
  const duelos = useMisDuelos();
  const moderacion = useModeracion();
  const amigos = useAmigos();
  /* Who is being reported, or null. Held here rather than in each row
     so only one modal can be open. */
  const [denunciando, setDenunciando] = useState<{ id: string; alias: string } | null>(null);
  /* Open one frame after the panel mounts, never in the same one. A
     `<Modal>` mounted already visible showed a white screen with only
     its close button on a real phone: Android builds the modal's
     window on mount, and children rendered in that frame have nowhere
     to compose. Reported from the review screen, which had the same
     shape; `estabilidad.test.ts` now fails on it. */
  const [denunciaAbierta, setDenunciaAbierta] = useState(false);

  useEffect(() => {
    if (!denunciando) {
      setDenunciaAbierta(false);
      return;
    }
    const id = requestAnimationFrame(() => setDenunciaAbierta(true));
    return () => cancelAnimationFrame(id);
  }, [denunciando]);
  /* The search panel, folded away until asked for. The screen opens on
     what is waiting, and a text field above that is a question the
     learner with pending duels did not ask. */
  const [buscando, setBuscando] = useState(false);

  if (cargandoPerfil || duelos.cargando) {
    return (
      <View className="flex-1 px-5 py-6">
        <EsqueletoLista filas={4} />
      </View>
    );
  }

  /* The gate comes first and explains itself. A learner who taps
     "Retar" and gets an error has learned nothing; one who reads why
     can go fix it. */
  if (perfil && !perfil.visible) {
    return <Puerta perfil={perfil} onAjustes={onAjustes} />;
  }

  /* `enCurso` is two different situations and only one of them is a
     move: a round still to play, and a round already handed in. The
     count and the card hierarchy both follow this split. */
  const porJugar = duelos.enCurso.filter((d) => !d.miMarcador);
  const esperando = duelos.enCurso.filter((d) => d.miMarcador);
  const pendientes = duelos.porAceptar.length + porJugar.length;

  /* Nothing at all: no invitations, no rounds, no friends, nothing
     finished. Not an error — nobody has challenged them yet — so the
     search becomes the one thing to do rather than a footnote. */
  const vacio =
    duelos.porAceptar.length === 0 &&
    duelos.enCurso.length === 0 &&
    duelos.enviados.length === 0 &&
    duelos.terminados.length === 0 &&
    amigos.amigos.length === 0 &&
    amigos.porResponder.length === 0;

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-6 px-5 py-5"
      refreshControl={
        <RefreshControl refreshing={duelos.recargando} onRefresh={duelos.recargar} />
      }
    >
      <View className="min-h-[34px] flex-row items-center justify-between">
        <Texto estilo="titulo">Duelos</Texto>
        {pendientes > 0 ? (
          <Chip tono="acento">
            {pendientes === 1 ? '1 por jugar' : `${pendientes} por jugar`}
          </Chip>
        ) : null}
      </View>

      {duelos.fallo ? (
        <Aviso mensaje="No pudimos cargar sus duelos" detalle={duelos.fallo.mensaje} />
      ) : null}

      {vacio && !duelos.fallo ? <Vacio /> : null}

      {duelos.porAceptar.length > 0 ? (
        <Seccion rotulo="Lo están esperando">
          {duelos.porAceptar.map((d) => (
            <Invitacion
              key={d.id}
              duelo={d}
              respondiendo={duelos.respondiendo}
              onAceptar={async () => {
                await duelos.aceptar(d.id);
                onJugar(d.id, d.contra?.alias ?? 'su rival', d.contra?.id ?? null);
              }}
              onRechazar={() => void duelos.rechazar(d.id)}
              onDenunciar={
                d.contra
                  ? () => setDenunciando({ id: d.contra!.id, alias: d.contra!.alias ?? 'esta persona' })
                  : undefined
              }
              onBloquear={
                d.contra ? () => void moderacion.bloquear(d.contra!.id) : undefined
              }
            />
          ))}
        </Seccion>
      ) : null}

      {porJugar.length > 0 ? (
        <Seccion rotulo="Te toca">
          {porJugar.map((d) => (
            <FilaDeDuelo
              key={d.id}
              duelo={d}
              apoyo="5 preguntas. Juegue cuando pueda."
              accion={
                <Boton
                  ancho={false}
                  etiqueta={`Jugar contra ${d.contra?.alias ?? 'su rival'}`}
                  alTocar={() => onJugar(d.id, d.contra?.alias ?? 'su rival', d.contra?.id ?? null)}
                >
                  Jugar
                </Boton>
              }
            />
          ))}
        </Seccion>
      ) : null}

      {esperando.length > 0 ? (
        <Seccion rotulo="Esperando">
          {esperando.map((d) => (
            <FilaDeDuelo
              key={d.id}
              duelo={d}
              plana
              apoyo={`Respondió. Falta ${d.contra?.alias ?? 'su rival'}.`}
            />
          ))}
        </Seccion>
      ) : null}

      {amigos.porResponder.length > 0 ? (
        <Seccion rotulo="Te quieren agregar">
          {amigos.porResponder.map((a) => (
            <FilaDePersona
              key={a.id}
              nombre={a.amigo.alias ?? 'Alguien'}
              figura={a.amigo.avatar}
              color={a.amigo.avatarColor}
            >
              <Boton
                variante="plano"
                ancho={false}
                etiqueta={`Aceptar a ${a.amigo.alias ?? 'esta persona'}`}
                deshabilitado={amigos.respondiendo}
                alTocar={() => void amigos.responder({ id: a.id, acepta: true })}
              >
                Aceptar
              </Boton>
              <Pressable
                onPress={() => void amigos.responder({ id: a.id, acepta: false })}
                accessibilityRole="button"
                accessibilityLabel={`Rechazar a ${a.amigo.alias ?? 'esta persona'}`}
                className="min-h-toque justify-center px-2"
              >
                <Texto estilo="apoyo">No</Texto>
              </Pressable>
            </FilaDePersona>
          ))}
        </Seccion>
      ) : null}

      {/* Friends above the search box, because the common case is
          duelling the same three classmates. Typing an alias every
          time is friction with no purpose. */}
      {amigos.amigos.length > 0 ? (
        <Seccion rotulo="Tus amigos">
          {amigos.amigos.map((a) => (
            <FilaDePersona
              key={a.id}
              nombre={a.amigo.alias ?? 'Rival'}
              figura={a.amigo.avatar}
              color={a.amigo.avatarColor}
            >
              <Boton
                variante="plano"
                ancho={false}
                etiqueta={`Retar a ${a.amigo.alias ?? 'su amigo'}`}
                deshabilitado={duelos.retando}
                alTocar={() => void duelos.retar(a.amigo.id)}
              >
                Retar
              </Boton>
            </FilaDePersona>
          ))}
        </Seccion>
      ) : null}

      {duelos.enviados.length > 0 ? (
        <Seccion rotulo="Retos que envió">
          {duelos.enviados.map((d) => (
            <FilaDeDuelo key={d.id} duelo={d} plana apoyo="Sin responder todavía" />
          ))}
        </Seccion>
      ) : null}

      {duelos.terminados.length > 0 ? (
        <Seccion rotulo="Terminados">
          {duelos.terminados.map((d) => (
            <FilaDeDuelo
              key={d.id}
              duelo={d}
              plana
              apoyo={marcadorDicho(d)}
              accion={
                /* Green only when this learner won: a duel won is the
                   one thing on this list that was earned. A tie says
                   so in words, because a neutral «3–3» leaves the
                   reader to work out what happened. */
                <Chip tono={d.gane ? 'ganado' : 'neutro'}>
                  {d.gane === null ? 'Empate' : d.gane ? 'Ganaste' : 'Perdiste'}
                </Chip>
              }
            />
          ))}
        </Seccion>
      ) : null}

      {/* The search, and the only `principal` on the screen when there
          is nothing waiting. With duels pending it stays `contorno`:
          the answer then is the «Jugar» inside a card above, and a
          second filled button would make neither of them the answer. */}
      {buscando ? (
        <Buscador
          onRetar={duelos.retar}
          retando={duelos.retando}
          fallo={duelos.falloAlRetar}
          onAgregar={amigos.pedir}
          agregando={amigos.pidiendo}
          onVerPerfil={onVerPerfil}
        />
      ) : (
        <Boton ancho={false} variante={vacio ? 'principal' : 'contorno'} alTocar={() => setBuscando(true)}>
          Buscar a alguien
        </Boton>
      )}

      <Pressable
        onPress={onAjustes}
        accessibilityRole="button"
        className="min-h-toque justify-center"
      >
        <Texto estilo="apoyo" className="text-center text-acento-texto">
          Mi nombre, privacidad y bloqueados
        </Texto>
      </Pressable>

      {denunciando ? (
        <ModalDenuncia
          visible={denunciaAbierta}
          jugadorId={denunciando.id}
          alias={denunciando.alias}
          onCerrar={() => {
            setDenunciaAbierta(false);
            setDenunciando(null);
          }}
        />
      ) : null}
    </ScrollView>
  );
}

/**
 * Nobody has challenged them yet.
 *
 * Not an error, and not written as one. The character is in `espera`,
 * which is what `docs/PERSONAJE.md` allows it here: it records the
 * result of a duel and has nothing to record. It does not speak.
 */
function Vacio() {
  return (
    <View className="items-center gap-4 py-6">
      <Personaje pose="espera" tamano={88} />
      <View className="gap-1.5">
        <Texto estilo="pregunta" className="text-center">
          Todavía nadie lo ha retado
        </Texto>
        <Texto estilo="apoyo" className="text-center">
          Busque a un compañero por su nombre en la app. Los dos resuelven las mismas 5
          preguntas cuando puedan.
        </Texto>
      </View>
    </View>
  );
}

/** What a finished duel says, score included when there is one. */
function marcadorDicho(duelo: Duelo): string {
  if (duelo.miMarcador && duelo.marcadorDelOtro) {
    return `${duelo.miMarcador.aciertos} contra ${duelo.marcadorDelOtro.aciertos}`;
  }
  return 'Terminado';
}

/**
 * What stands between a learner and duels, said plainly.
 *
 * Two different reasons, and they are not interchangeable: one needs a
 * guardian's authorisation, the other needs a name. Telling someone
 * "no puede retar" without which one would leave them stuck.
 */
function Puerta({
  perfil,
  onAjustes,
}: {
  perfil: { alias: string | null; tutorAutorizoEn: string | null };
  onAjustes: () => void;
}) {
  const faltaAutorizacion = perfil.tutorAutorizoEn === null;

  return (
    <View className="flex-1 justify-center gap-5 px-5">
      <Texto estilo="titulo">Duelos</Texto>
      <Texto estilo="cuerpo">
        Rete a un compañero: los dos resuelven las mismas 5 preguntas cuando puedan. Gana quien
        acierte más.
      </Texto>

      {faltaAutorizacion ? (
        <Aviso
          tono="aviso"
          mensaje="Falta la autorización de su acudiente"
          detalle="Para que otros lo encuentren y usted pueda retarlos, su papá, mamá o acudiente tiene que autorizarlo. Todo lo demás de la app funciona sin esto."
        />
      ) : (
        <Aviso
          tono="aviso"
          mensaje="Escoja un nombre"
          detalle="Es el nombre con el que sus compañeros lo encuentran. No use su nombre completo."
        />
      )}

      <Boton alTocar={onAjustes}>{faltaAutorizacion ? 'Ir a autorizar' : 'Escoger nombre'}</Boton>
    </View>
  );
}

/** Finding someone to challenge. */
function Buscador({
  onRetar,
  retando,
  fallo,
  onAgregar,
  agregando,
  onVerPerfil,
}: {
  onRetar: (rivalId: string) => Promise<unknown>;
  retando: boolean;
  fallo: { mensaje: string } | null;
  onAgregar: (usuarioId: string) => Promise<unknown>;
  agregando: boolean;
  onVerPerfil: (usuarioId: string) => void;
}) {
  const busqueda = useBuscarJugadores();
  const [retado, setRetado] = useState<string | null>(null);
  const [agregado, setAgregado] = useState<string | null>(null);

  return (
    <Seccion rotulo="Buscar a alguien">
      <TextInput
        value={busqueda.termino}
        onChangeText={busqueda.setTermino}
        placeholder="Nombre de su compañero"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Nombre de su compañero"
        /* Only the font face is inline. The border, the radius and the
           fill stay in the className: a `borderRadius` or a
           `backgroundColor` in a style object wins over the compiled
           class and the field loses its fill. */
        style={{ fontFamily: 'Inter_400Regular' }}
        className="min-h-boton rounded-medio border-[1.5px] border-borde-control bg-capa px-4 text-[15px] text-texto"
      />

      {fallo ? <Aviso mensaje={fallo.mensaje} /> : null}

      {busqueda.termino.trim().length >= 2 && busqueda.resultados.length === 0 && !busqueda.buscando ? (
        <Texto estilo="apoyo">Nadie con ese nombre. Pregúntele cómo se llama en la app.</Texto>
      ) : null}

      {busqueda.resultados.map((j) => (
        <FilaDePersona
          key={j.id}
          nombre={j.alias ?? 'Rival'}
          descripcion={j.descripcion}
          figura={j.avatar}
          color={j.avatarColor}
          alAbrir={() => onVerPerfil(j.id)}
        >
          {/* Adding is offered beside challenging, because after one
              duel with someone you will want the second without
              typing their name again. */}
          {agregado === j.id ? (
            <Chip>Pedido</Chip>
          ) : (
            <Pressable
              disabled={agregando}
              onPress={async () => {
                const r = await onAgregar(j.id).catch(() => null);
                if (r) setAgregado(j.id);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Agregar a ${j.alias ?? 'esta persona'}`}
              accessibilityState={{ disabled: agregando }}
              className="min-h-toque justify-center px-2"
            >
              <Texto estilo="apoyo" className="text-acento-texto">
                Agregar
              </Texto>
            </Pressable>
          )}

          {retado === j.id ? (
            <Chip tono="ganado">Reto enviado</Chip>
          ) : (
            <Boton
              variante="plano"
              ancho={false}
              etiqueta={`Retar a ${j.alias ?? 'esta persona'}`}
              deshabilitado={retando}
              alTocar={async () => {
                const r = await onRetar(j.id).catch(() => null);
                if (r) setRetado(j.id);
              }}
            >
              Retar
            </Boton>
          )}
        </FilaDePersona>
      ))}
    </Seccion>
  );
}

function Seccion({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <View className="gap-2.5">
      <Texto estilo="rotulo">{rotulo}</Texto>
      {children}
    </View>
  );
}

/**
 * One duel, as a card.
 *
 * `plana` is not decoration here: it is how the screen says «this one
 * is not your move». A raised card is something to act on, and a row
 * that is only news must not be able to pass for one.
 */
function FilaDeDuelo({
  duelo,
  apoyo,
  accion,
  plana = false,
}: {
  duelo: Duelo;
  apoyo: string;
  accion?: React.ReactNode;
  plana?: boolean;
}) {
  const nombre = duelo.contra?.alias ?? 'Rival';

  return (
    <Tarjeta variante={plana ? 'plana' : 'alzada'}>
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          <Avatar
            nombre={nombre}
            figura={duelo.contra?.avatar}
            color={duelo.contra?.avatarColor}
          />
          <View className="flex-1 gap-0.5">
            {/* 14px semibold Inter, the artifact's name size. Not a
                `Texto` style, because the scale has no 14px semibold
                and inventing one here would put a fifteenth size in
                the system by the back door. The face is still named
                outright — a family plus a weight does not resolve. */}
            <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-[14px] text-texto">
              {nombre}
            </Text>
            <Texto estilo="apoyo">{apoyo}</Texto>
          </View>
        </View>
        {accion}
      </View>
    </Tarjeta>
  );
}

/**
 * Someone who is not a duel: a friend, a request, a search result.
 *
 * `plana`, because none of these is the reason the screen is open.
 */
function FilaDePersona({
  nombre,
  descripcion,
  figura,
  color,
  alAbrir,
  children,
}: {
  nombre: string;
  /** The figure this person picked; null falls back to initials. */
  figura?: string | null;
  /** Their background colour, 0-7; null derives it from the alias. */
  color?: number | null;
  /**
   * Only search results pass this.
   *
   * A name alone cannot answer «is this the Sofía I know?», which is
   * the question somebody about to send a friend request is actually
   * asking — and getting it wrong means a request to a stranger.
   */
  descripcion?: string | null;
  /**
   * Opens this person's profile. Only search results pass it.
   *
   * Diego asked for this by name: «me gustaría poder ver el perfil de
   * un usuario aunque no sea mi amigo pues, buscar y verlo, y si me
   * gusta lo que veo pues le envío la soli, como en Facebook». A
   * search result that can only be challenged or befriended forces
   * both decisions on two lines of text.
   *
   * The name and the avatar are the target, not the whole row: the
   * row's right-hand side already holds «Agregar» and «Retar», and a
   * press surface underneath them would swallow taps meant for those.
   */
  alAbrir?: () => void;
  children: React.ReactNode;
}) {
  const identidad = (
    <View className="flex-1 flex-row items-center gap-3">
      <Avatar nombre={nombre} figura={figura} color={color} />
      <View className="flex-1 gap-0.5">
        <Text
          style={{ fontFamily: 'Inter_600SemiBold' }}
          className="text-[14px] text-texto"
        >
          {nombre}
        </Text>
        {descripcion ? (
          /* Two lines at most. A 120-character description is short,
             but a row that grows with its text makes a list of
             results impossible to scan. */
          <Texto estilo="apoyo" numberOfLines={2}>
            {descripcion}
          </Texto>
        ) : null}
      </View>
    </View>
  );

  return (
    <Tarjeta variante="plana">
      <View className="flex-row items-center justify-between gap-3">
        {alAbrir ? (
          <Pressable
            onPress={alAbrir}
            accessibilityRole="button"
            accessibilityLabel={`Ver el perfil de ${nombre}`}
            className="flex-1"
          >
            {({ pressed }) => (
              /* Only the opacity is inline. A fill here would beat
                 the compiled class, which `tokens.test.ts` fails the
                 build over. */
              <View className="flex-1" style={{ opacity: pressed ? 0.6 : 1 }}>
                {identidad}
              </View>
            )}
          </Pressable>
        ) : (
          identidad
        )}
        <View className="flex-row items-center gap-1">{children}</View>
      </View>
    </Tarjeta>
  );
}

/**
 * An invitation, with the two ways out of it.
 *
 * Blocking and reporting are here and not only in settings. An
 * unwanted challenge is where harassment actually arrives, and a
 * report button a learner has to go hunting for in a settings screen
 * is one they will not find at the moment they need it.
 */
function Invitacion({
  duelo,
  respondiendo,
  onAceptar,
  onRechazar,
  onBloquear,
  onDenunciar,
}: {
  duelo: Duelo;
  respondiendo: boolean;
  onAceptar: () => void;
  onRechazar: () => void;
  onBloquear?: () => void;
  onDenunciar?: () => void;
}) {
  const nombre = duelo.contra?.alias ?? 'Alguien';

  return (
    <Tarjeta className="gap-3">
      <View className="flex-row items-center gap-3">
        <Avatar
          nombre={nombre}
          figura={duelo.contra?.avatar}
          color={duelo.contra?.avatarColor}
        />
        <View className="flex-1 gap-0.5">
          <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-[14px] text-texto">
            {nombre} lo retó
          </Text>
          <Texto estilo="apoyo">5 preguntas. Juegue cuando pueda.</Texto>
        </View>
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Boton deshabilitado={respondiendo} alTocar={onAceptar}>
            Aceptar
          </Boton>
        </View>
        <View className="flex-1">
          <Boton variante="contorno" deshabilitado={respondiendo} alTocar={onRechazar}>
            No, gracias
          </Boton>
        </View>
      </View>

      {onBloquear || onDenunciar ? (
        <View className="flex-row gap-5">
          {onBloquear ? (
            <Pressable
              onPress={onBloquear}
              accessibilityRole="button"
              accessibilityLabel={`Bloquear a ${nombre}`}
              className="min-h-toque justify-center"
            >
              <Texto estilo="apoyo">Bloquear</Texto>
            </Pressable>
          ) : null}
          {onDenunciar ? (
            <Pressable
              onPress={onDenunciar}
              accessibilityRole="button"
              accessibilityLabel={`Denunciar a ${nombre}`}
              className="min-h-toque justify-center"
            >
              <Texto estilo="apoyo">Denunciar</Texto>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Tarjeta>
  );
}
