import { ScrollView, View } from 'react-native';
import {
  Boton,
  CabeceraDePerfil,
  FilaMateria,
  Tarjeta,
  Texto,
  TiraDeCifras,
} from '@/shared/ui';
import { Aviso } from '@/shared/ui/Aviso';
import { EsqueletoLista } from '@/shared/ui/Esqueleto';
import { NOMBRE_AREA } from '@/shared/model/icfes';
import type { PerfilPublico } from '../api/esquemas';
import { usePerfilDeAmigo, usePerfilPublico } from '../hooks/useDuelos';
import { desdeCuando } from '../model/fechas';

/**
 * Somebody else, in full.
 *
 * What this replaced showed an alias and one line of description.
 * That is a business card, not a profile, and it gave a learner no
 * way to answer the question they open a profile to answer: is this
 * person worth duelling, and are they who I think they are.
 *
 * Now it shows the level, the streak, the subjects and the
 * achievements — when that learner shares them. Three separate rules
 * decide, all of them on the server:
 *
 *   - A friend always sees everything, because accepting a request is
 *     consent given to a named person.
 *   - A stranger sees the numbers only if this learner turned
 *     «mostrar mi progreso» on, which is off by default.
 *   - Nobody ever sees the email, the plan or when the account was
 *     last awake.
 *
 * The screen never decides any of that. It renders what arrived, and
 * `progresoOculto` tells it whether an absent `progreso` means «they
 * keep this private» or «this failed to load» — two states that look
 * identical and must not read the same.
 */
export function PantallaPerfil({
  usuarioId,
  alCerrar,
  /* Passed in rather than imported, because sending a request, going
     to a duel and reporting all belong to screens that already own
     those mutations. A profile that could itself mutate a friendship
     would be a second place where that logic lives. */
  alPedirAmistad,
  pidiendoAmistad = false,
  alRetar,
  alDenunciar,
}: {
  usuarioId: string;
  alCerrar: () => void;
  alPedirAmistad?: (id: string) => void;
  pidiendoAmistad?: boolean;
  alRetar?: (id: string) => void;
  alDenunciar?: (perfil: { id: string; alias: string | null }) => void;
}) {
  const { perfil, cargando, fallo } = usePerfilPublico(usuarioId);
  /* The weeks-in-a-row streak between these two, which only the
     friend endpoint computes. Fetched only once the public profile
     says they are friends, so a stranger's profile never fires a
     request the server would refuse. Nothing was dropped when this
     screen replaced the old friend profile — this is that card. */
  const esAmigo = perfil?.relacion === 'amigos';
  const amistad = usePerfilDeAmigo(esAmigo ? usuarioId : null);

  return (
    <ScrollView className="flex-1 bg-fondo" contentContainerClassName="gap-5 px-5 py-5">
      <View className="flex-row items-center justify-between gap-3">
        <Texto estilo="titulo-grande">Perfil</Texto>
        <Boton variante="plano" ancho={false} alTocar={alCerrar}>
          Atrás
        </Boton>
      </View>

      {cargando ? <EsqueletoLista filas={3} /> : null}

      {fallo ? <Aviso mensaje={fallo.mensaje} detalle={fallo.detalle} /> : null}

      {perfil ? (
        <Cuerpo
          perfil={perfil}
          juntos={amistad.perfil?.racha ?? null}
          alPedirAmistad={alPedirAmistad}
          pidiendoAmistad={pidiendoAmistad}
          alRetar={alRetar}
          alDenunciar={alDenunciar}
        />
      ) : null}
    </ScrollView>
  );
}

function Cuerpo({
  perfil,
  juntos,
  alPedirAmistad,
  pidiendoAmistad,
  alRetar,
  alDenunciar,
}: {
  perfil: PerfilPublico;
  juntos: { semanas: number; duelos: number; estaSemanaYa: boolean } | null;
  alPedirAmistad?: (id: string) => void;
  pidiendoAmistad: boolean;
  alRetar?: (id: string) => void;
  alDenunciar?: (perfil: { id: string; alias: string | null }) => void;
}) {
  const esAmigo = perfil.relacion === 'amigos';

  return (
    <>
      <CabeceraDePerfil
        alias={perfil.alias}
        descripcion={perfil.descripcion}
        nota={
          esAmigo && perfil.amigosDesde
            ? `Amigos desde ${desdeCuando(perfil.amigosDesde)}`
            : null
        }
        accion={<AccionPrincipal
          perfil={perfil}
          alPedirAmistad={alPedirAmistad}
          pidiendoAmistad={pidiendoAmistad}
          alRetar={alRetar}
        />}
      />

      {/* The three figures, when they travel. Level and streak are
          what one learner compares themselves against; the subjects
          below are the detail behind them. */}
      {perfil.progreso ? (
        <Tarjeta>
          <TiraDeCifras
            cifras={[
              { etiqueta: 'Nivel', valor: perfil.progreso.nivel },
              { etiqueta: 'Racha', valor: perfil.progreso.racha },
              { etiqueta: 'Logros', valor: perfil.progreso.logros.length },
            ]}
          />
        </Tarjeta>
      ) : null}

      {/* Said out loud rather than rendered as a gap. An empty
          profile reads as a broken one, and the learner looking at it
          would blame the app instead of understanding that this is a
          choice the other person made. */}
      {perfil.progresoOculto ? (
        <Tarjeta variante="plana" className="gap-1">
          <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
            No comparte su progreso
          </Texto>
          <Texto estilo="apoyo">
            {perfil.alias ?? 'Esta persona'} decidió que su nivel y sus materias
            sean privados. Si llegan a ser amigos, los vas a ver.
          </Texto>
        </Tarjeta>
      ) : null}

      {/* Friends only. The head-to-head appears once they have
          actually played — a 0-0 record on a new friendship is noise
          — but the weekly streak card shows even at zero, because
          «todavía no han jugado juntos» is an invitation and an
          absent card is not. */}
      {esAmigo ? (
        <View className="gap-3">
          <Texto estilo="rotulo">Entre los dos</Texto>

          {perfil.caraACara && perfil.caraACara.jugados > 0 ? (
            <Tarjeta>
              <TiraDeCifras
                cifras={[
                  { etiqueta: 'Ganados', valor: perfil.caraACara.ganados },
                  { etiqueta: 'Perdidos', valor: perfil.caraACara.perdidos },
                  /* Shown always, including at zero: «ganados +
                     perdidos» not adding up to «jugados» is the kind
                     of thing a 16-year-old notices and distrusts. */
                  { etiqueta: 'Empates', valor: perfil.caraACara.empatados },
                ]}
              />
            </Tarjeta>
          ) : null}

          {juntos ? (
            <Tarjeta variante="plana" className="gap-1">
              {juntos.semanas > 0 ? (
                <>
                  <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
                    {juntos.semanas} {juntos.semanas === 1 ? 'semana' : 'semanas'}{' '}
                    seguidas jugando
                  </Texto>
                  {/* Said plainly rather than with a warning colour:
                      the streak has a week of grace, so «falta esta
                      semana» is information, not an alarm. */}
                  {!juntos.estaSemanaYa ? (
                    <Texto estilo="apoyo">Esta semana todavía no han jugado.</Texto>
                  ) : null}
                </>
              ) : (
                <Texto estilo="apoyo">
                  {juntos.duelos > 0
                    ? 'La racha se cortó. Un duelo esta semana la empieza otra vez.'
                    : 'Todavía no han jugado un duelo juntos.'}
                </Texto>
              )}
            </Tarjeta>
          ) : null}
        </View>
      ) : null}

      {perfil.progreso && perfil.progreso.areas.length > 0 ? (
        <View className="gap-3">
          <Texto estilo="rotulo">Sus materias</Texto>
          <Tarjeta className="gap-[14px]">
            {perfil.progreso.areas.map((a) => (
              <FilaMateria
                key={a.area}
                nombre={NOMBRE_AREA[a.area]}
                porcentaje={a.accuracy}
                medida
              />
            ))}
          </Tarjeta>
        </View>
      ) : null}

      {perfil.progreso && perfil.progreso.logros.length > 0 ? (
        <View className="gap-3">
          <Texto estilo="rotulo">Logros</Texto>
          <Tarjeta className="gap-2">
            {perfil.progreso.logros.map((l) => (
              <View key={l} className="flex-row items-center gap-2">
                <Texto estilo="cuerpo">{l}</Texto>
              </View>
            ))}
          </Tarjeta>
        </View>
      ) : null}

      {/* Last, quiet, and never beside the friendly buttons. Reporting
          is not a thing to do by accident on a screen whose main
          action is «be friends». */}
      {alDenunciar ? (
        <Boton
          variante="plano"
          alTocar={() => alDenunciar({ id: perfil.id, alias: perfil.alias })}
        >
          Denunciar o bloquear
        </Boton>
      ) : null}
    </>
  );
}

/**
 * The one button under the name, chosen by the relationship.
 *
 * The server sends `relacion` precisely so this decision is made
 * once, in one place, from one field. Working it out on the phone
 * would mean loading a friend list and a request list first — and a
 * screen that guesses offers «Enviar solicitud» to somebody who is
 * already a friend.
 */
function AccionPrincipal({
  perfil,
  alPedirAmistad,
  pidiendoAmistad,
  alRetar,
}: {
  perfil: PerfilPublico;
  alPedirAmistad?: (id: string) => void;
  pidiendoAmistad: boolean;
  alRetar?: (id: string) => void;
}) {
  if (perfil.relacion === 'amigos') {
    if (!alRetar) return null;
    return (
      <Boton ancho={false} alTocar={() => alRetar(perfil.id)}>
        Retar a un duelo
      </Boton>
    );
  }

  if (perfil.relacion === 'solicitud-enviada') {
    /* Not a button. There is nothing to press — the request is with
       the other person — and a disabled button that says «Pendiente»
       still invites a tap and then ignores it. */
    return <Texto estilo="apoyo">Ya le enviaste una solicitud</Texto>;
  }

  if (perfil.relacion === 'solicitud-recibida') {
    /* Answered on the friends screen, where accepting and rejecting
       sit side by side. Offering only «Aceptar» here would be a
       one-sided choice on the screen where someone is deciding. */
    return <Texto estilo="apoyo">Te envió una solicitud</Texto>;
  }

  if (!alPedirAmistad) return null;

  return (
    <Boton
      ancho={false}
      cargando={pidiendoAmistad}
      deshabilitado={pidiendoAmistad}
      alTocar={() => alPedirAmistad(perfil.id)}
    >
      Enviar solicitud
    </Boton>
  );
}
