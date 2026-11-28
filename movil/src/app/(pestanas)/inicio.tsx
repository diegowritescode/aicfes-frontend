import { useEffect } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Atajo, Avatar, Boton, Personaje, Tarjeta, Texto } from '@/shared/ui';
import { Aviso } from '@/shared/ui/Aviso';
import { AvisoConexion } from '@/shared/conexion/AvisoConexion';
import { EsqueletoPanel } from '@/shared/ui/Esqueleto';
import { useConexion } from '@/shared/conexion/useConexion';
import { AvisoDeDenuncias } from '@/features/moderacion/components/AvisoDeDenuncias';
import { AvisoDeDuelos } from '@/features/duelos/components/AvisoDeDuelos';
import { AvisoDeTiempo } from '@/features/bloqueo/components/AvisoDeTiempo';
import { useMisDuelos } from '@/features/duelos/hooks/useDuelos';
import { useLote } from '@/features/offline/hooks/useLote';
import { useCola } from '@/features/offline/hooks/useCola';
import { NOMBRE_AREA } from '@/shared/model/icfes';
import { useSesion } from '@/features/sesion/hooks/useSesion';
import { useErrorDelDia, usePanel } from '@/features/panel/hooks/usePanel';
import { ResumenErrorDelDia } from '@/features/panel/components/ResumenErrorDelDia';
import { esRespondible } from '@/features/panel/model/errorDelDia';
import { areaMasFloja, misionesPendientes, muestraRacha } from '@/features/panel/model/reglas';

/**
 * The dashboard: what to do right now.
 *
 * This had swung too far. Stripping the self-measurement out was
 * right — the level, the XP breakdown, the achievements and the five
 * subject rows all belong on «Yo» — but what was left was a greeting,
 * one line of text and a button, and Diego's word for it was
 * «vacía». A screen that is only correct is not finished.
 *
 * What fills it now is not the measurement coming back. It is the
 * three things the validated design puts on a home screen, in its
 * order:
 *
 *   1. **Continue.** The big card with the character. One subject,
 *      named, and the button that opens it. This is the screen's
 *      reason to exist and it is above everything else.
 *   2. **Today's goal.** The day's challenges as a single progress
 *      line, not three cards. The detail is a tap away in «Retos»;
 *      what belongs here is whether there is anything left to do.
 *   3. **Quick practice.** Four tiles for the four ways to study.
 *      Before this, three of the four were reachable only through
 *      another tab, and «Simulacro» had no entry point at all on the
 *      screen people open first.
 *
 * The streak is back in the corner, as a chip and nothing more. It
 * was moved to «Yo» for a good reason — a dashboard that scores you
 * is not a dashboard — and the reference design puts it here for an
 * equally good one: it is the one number that changes by opening the
 * app today, so seeing it is the reward for having opened it. It is
 * one glyph and one digit, it is not a section, and the full streak
 * with the longest run still lives on «Yo».
 */
export default function RutaInicio() {
  const router = useRouter();
  const { sesion, cargando: cargandoSesion, autenticado } = useSesion();
  const { panel, cargando, fallo, recargar } = usePanel();
  const { pregunta } = useErrorDelDia();
  const conexion = useConexion();
  /* The same query `AvisoDeDuelos` reads, so naming the one duel
     that is waiting costs no extra request. */
  const duelos = useMisDuelos();
  const lote = useLote();
  const cola = useCola();

  /* Top the offline pool up here, on the screen the learner opens
     most, and only with a connection. The toll runs when there is no
     network, so the questions have to arrive before then. */
  useEffect(() => {
    if (conexion !== 'con-red') return;
    if (!lote.necesitaRelleno) return;
    void lote.rellenar();
  }, [conexion, lote.necesitaRelleno, lote.rellenar]);

  /* And send whatever was answered offline. Same trigger, other
     direction: a toll block cleared without data has to reach the
     server, or the learner's streak disagrees with what they did. */
  useEffect(() => {
    if (conexion !== 'con-red') return;
    if (cola.pendientes === 0) return;
    void cola.sincronizar();
  }, [conexion, cola.pendientes, cola.sincronizar]);

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  const floja = panel ? areaMasFloja(panel) : null;
  const misiones = panel ? misionesPendientes(panel) : [];
  const retoPrincipal = misiones[0] ?? null;

  /* The server knows an email and no name. The part before the `@`
     is the closest thing to one the app has, and «Hola, diego» reads
     as a database row where «Hola, Diego» reads as a greeting. */
  const nombre = (() => {
    const local = sesion?.email?.split('@')[0] ?? '';
    if (!local) return null;
    return local.charAt(0).toUpperCase() + local.slice(1);
  })();

  /* One duel, named, and only when somebody is actually waiting on
     this learner: a challenge to accept, or a round they have not
     played. `AvisoDeDuelos` keeps the rest. The two never render
     together. */
  const esperando = [
    ...duelos.porAceptar,
    ...duelos.enCurso.filter((d) => !d.miMarcador),
  ];
  const dueloUnico = esperando.length === 1 ? esperando[0]! : null;

  return (
    <SafeAreaView className="flex-1 bg-fondo">
      <ScrollView
        contentContainerClassName="gap-5 px-5 py-6"
        refreshControl={
          <RefreshControl refreshing={cargando} onRefresh={() => void recargar()} />
        }
      >
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-0.5">
            <Texto estilo="titulo-grande">{nombre ? `Hola, ${nombre}` : 'Hola'}</Texto>
            <Texto estilo="apoyo">¿Qué quieres practicar hoy?</Texto>
          </View>

          {/* The streak chip. One glyph, one number, no card.
              The validated design puts «38 días para el examen» up
              here instead. Nothing in the API carries an exam date,
              and a countdown to a date we picked is the one number a
              learner can check against reality and catch us
              inventing. It stays out until the backend sends one. */}
          {panel && muestraRacha(panel) ? (
            <View
              className="flex-row items-center gap-1.5 rounded-pildora bg-fallo-suave px-3 py-1.5"
              accessibilityRole="text"
              accessibilityLabel={`Racha de ${panel.streak.currentDays} días`}
            >
              <Texto estilo="cuerpo">🔥</Texto>
              <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
                {panel.streak.currentDays}
              </Texto>
            </View>
          ) : null}
        </View>

        {/* Above everything, and only on a phone holding a moderation
            token. Reports are the one thing here with somebody else
            waiting on the other end. */}
        <AvisoDeDenuncias />

        {/* Before the error, because with no network the network is
            the explanation — and a message about the server is
            misleading when the phone never reached it. */}
        <AvisoConexion
          conexion={conexion}
          hayDatos={panel !== null}
          esDeCache={!!panel && !!fallo}
        />

        {fallo && conexion !== 'sin-red' ? (
          <Aviso mensaje={fallo.mensaje} detalle={fallo.detalle} />
        ) : null}

        {/* Only while there is earned time left. The budget is
            usage-based, so nobody can work it out from the clock. */}
        <AvisoDeTiempo alGanarMas={() => router.push('/peaje')} />

        {cargando && !panel ? <EsqueletoPanel /> : null}

        {/* 1. Continue. The design's hero card, with the character
            where the illustration sits. Accent-tinted and the only
            one on the screen: it is what the dashboard is for. */}
        <Tarjeta variante="acento" className="gap-3">
          <View className="flex-row items-center gap-3">
            <View className="flex-1 gap-1">
              <Texto estilo="apoyo">
                {floja ? 'Sigue por donde vas flojo' : 'Sigue donde quedaste'}
              </Texto>
              <Texto estilo="titulo">
                {floja ? NOMBRE_AREA[floja.area] : 'Practicar'}
              </Texto>
              {floja && floja.medida ? (
                <Texto estilo="apoyo">{floja.porcentaje}% de acierto</Texto>
              ) : null}
            </View>
            {/* Decoration, so it does not take a tap of its own:
                the button below is the target and a second one
                inside the card would split the gesture. */}
            <Personaje pose="espera" tamano={72} />
          </View>

          <Boton
            alTocar={() =>
              router.push(floja ? `/entrenar?area=${floja.area}` : '/entrenar')
            }
          >
            {floja ? `Practicar ${NOMBRE_AREA[floja.area]}` : 'Practicar'}
          </Boton>
        </Tarjeta>

        {/* Answerable only when the server sent the options and the
            right answer: an older backend sends neither, and an
            invitation to a question that cannot be answered is worse
            than no invitation. */}
        {pregunta && !pregunta.resueltoHoy && esRespondible(pregunta) ? (
          <ResumenErrorDelDia
            pregunta={pregunta}
            onAbrir={() => router.push('/pregunta-del-dia')}
          />
        ) : null}

        {/* Somebody sent a challenge at noon and it was invisible
            until the learner happened to open the duels screen —
            which, for somebody who did not know a duel existed, is
            never. There is nowhere else this can reach them:
            reminders here are local notifications, so nothing can be
            pushed while the app is closed. */}
        {dueloUnico ? (
          /* `plana` rather than raised: somebody else's move on you
             is context for the day, not the day's work. */
          <Tarjeta variante="plana" className="flex-row items-center gap-3">
            {dueloUnico.contra?.alias ? (
              <Avatar
                nombre={dueloUnico.contra.alias}
                tamano="chico"
                figura={dueloUnico.contra.avatar}
                color={dueloUnico.contra.avatarColor}
              />
            ) : null}
            <View className="flex-1 gap-0.5">
              {/* Named rather than counted. «Camilo» is a person; «1
                  duelo pendiente» is a chore. */}
              <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
                {dueloUnico.contra?.alias ?? 'Te retaron'}
              </Texto>
              {/* Five questions is the server's round size. The
                  subject is deliberately absent: a duel carries no
                  area in its payload, and naming one here would be a
                  guess the learner catches when the round opens. */}
              <Texto estilo="apoyo">5 preguntas</Texto>
            </View>
            <Boton
              variante="contorno"
              ancho={false}
              /* Straight to the duels list, not to Jugar: this card
                 already names the rival and the round. */
              alTocar={() => router.push('/duelos')}
              etiqueta={
                dueloUnico.contra?.alias
                  ? `Jugar tu duelo contra ${dueloUnico.contra.alias}`
                  : 'Jugar tu duelo'
              }
            >
              Jugar
            </Boton>
          </Tarjeta>
        ) : (
          <AvisoDeDuelos />
        )}

        {/* 2. Today's goal. One mission, one bar, and a link to the
            rest — not the three stacked cards that «Yo» used to
            carry. What belongs on a dashboard is whether anything is
            left, not the full list. */}
        {retoPrincipal ? (
          <View className="gap-3">
            <View className="flex-row items-baseline justify-between gap-3">
              <Texto estilo="rotulo">Reto de hoy</Texto>
              <Boton variante="plano" ancho={false} alTocar={() => router.push('/retos')}>
                {misiones.length > 1 ? `Ver los ${misiones.length}` : 'Ver todos'}
              </Boton>
            </View>
            <Tarjeta className="gap-2">
              <View className="flex-row items-baseline justify-between gap-3">
                <Texto
                  estilo="cuerpo"
                  style={{ fontFamily: 'Inter_600SemiBold' }}
                  className="flex-1"
                >
                  {retoPrincipal.title}
                </Texto>
                <Texto estilo="apoyo">{retoPrincipal.xpReward} XP</Texto>
              </View>
              <View
                className="h-1.5 overflow-hidden rounded-pildora bg-capa-alta"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <View
                  className="h-full rounded-pildora bg-acento"
                  style={{
                    width: `${Math.min(100, (retoPrincipal.progress / retoPrincipal.target) * 100)}%`,
                  }}
                />
              </View>
              <Texto estilo="apoyo">
                {retoPrincipal.progress} de {retoPrincipal.target}
              </Texto>
            </Tarjeta>
          </View>
        ) : null}

        {/* 3. Quick practice. The four ways to study, where a thumb
            reaches them. Three of these were behind another tab and
            «Simulacro» had no entry point at all on the screen people
            open first. */}
        <View className="gap-3">
          <Texto estilo="rotulo">Práctica rápida</Texto>
          <View className="flex-row flex-wrap gap-3">
            <Atajo
              icono="pesa"
              tono="acento"
              nombre="Entrenar"
              alTocar={() => router.push('/entrenar')}
            />
            <Atajo
              icono="espadas"
              tono="fallo"
              nombre="Duelo"
              etiqueta="Retar a alguien a un duelo"
              alTocar={() => router.push('/jugar')}
            />
            <Atajo
              icono="reloj"
              tono="ganado"
              nombre="Contrarreloj"
              alTocar={() => router.push('/contrarreloj')}
            />
            <Atajo
              icono="examen"
              tono="neutro"
              nombre="Simulacro"
              alTocar={() => router.push('/simulacro')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
