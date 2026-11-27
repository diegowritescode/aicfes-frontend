import { useEffect } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Avatar, Boton, Tarjeta, Texto } from '@/shared/ui';
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
import { areaMasFloja } from '@/features/panel/model/reglas';

/**
 * The dashboard.
 *
 * Short on purpose. It had grown the level, the streak card, the XP
 * breakdown, the day's missions, the achievements and a reminder
 * setting — eight sections of self-measurement before the learner
 * reached anything to do. None of it was deleted: it moved to «Yo»,
 * the tab for looking at yourself. What stays here is what is true
 * today and what to do about it — time earned, the day's question, a
 * duel someone is waiting on, how the subjects stand, and one button
 * into practice.
 *
 * Pull to refresh, because a phone is the one place people expect it
 * and because finishing a session elsewhere should be visible here
 * without closing the app.
 */
export default function RutaInicio() {
  const router = useRouter();
  const { sesion, cargando: cargandoSesion, autenticado } = useSesion();
  const { panel, cargando, fallo, recargar } = usePanel();
  const { pregunta } = useErrorDelDia();
  const conexion = useConexion();
  /* The same query `AvisoDeDuelos` reads, so naming the one duel that
     is waiting costs no extra request. */
  const duelos = useMisDuelos();
  const lote = useLote();
  const cola = useCola();

  /* Top the offline pool up here, on the screen the learner opens
     most, and only with a connection. The toll runs when there is no
     network, so the questions have to arrive before then — and this is
     the moment we know we can fetch them. */
  useEffect(() => {
    if (conexion !== 'con-red') return;
    if (!lote.necesitaRelleno) return;
    void lote.rellenar();
  }, [conexion, lote.necesitaRelleno, lote.rellenar]);

  /* And send whatever was answered offline. Same trigger, different
     direction: a toll block cleared without data has to reach the
     server, or the learner's streak disagrees with what they did. */
  useEffect(() => {
    if (conexion !== 'con-red') return;
    if (cola.pendientes === 0) return;
    void cola.sincronizar();
  }, [conexion, cola.pendientes, cola.sincronizar]);

  if (cargandoSesion) return null;
  if (!autenticado) return <Redirect href="/entrar" />;

  /* The one subject this screen names, or null. */
  const floja = panel ? areaMasFloja(panel) : null;

  /* The server knows an email and no name. The part before the `@` is
     the closest thing to one the app has, and «Hola, diego» reads as a
     database row where «Hola, Diego» reads as a greeting — hence the
     capital. Asking for a real name is the proper fix and it costs a
     new field on an account made by a minor; this is the honest
     stopgap until that exists. */
  const nombre = (() => {
    const local = sesion?.email?.split('@')[0] ?? '';
    if (!local) return null;
    return local.charAt(0).toUpperCase() + local.slice(1);
  })();

  /* One duel, named, and only when someone is actually waiting on
     this learner: a challenge to accept, or a round they have not
     played. `AvisoDeDuelos` keeps the rest — it is the only thing
     that can say «3 duelos te esperan» without stacking three cards
     on a dashboard this just stopped being. The two never render
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
        {/* The greeting, and nothing measured beside it.
            The streak chip used to sit here. It is not a number this
            screen needs: a dashboard whose job is getting somebody
            into practice does not also have to tell them how they are
            doing, and «Yo» is the tab for that. The streak, the
            forgiven day and the longest run all live there now,
            together instead of split across two screens.

            The validated design puts «38 días para el examen» here.
            Nothing in the API carries an exam date, and a countdown to
            a date we picked is the one number a learner can check
            against reality and catch us inventing. It stays out until
            the backend sends one. */}
        <Texto estilo="titulo-grande">{nombre ? `Hola, ${nombre}` : 'Hola'}</Texto>

        {/* Above the learner's own numbers, and only on a phone that
            holds a moderation token. Reports are the one thing here
            with someone else waiting on the other end. */}
        <AvisoDeDenuncias />

        {/* Before the error, because with no network the network is the
            explanation — and a failure message about the server is
            misleading when the phone never reached it. */}
        <AvisoConexion conexion={conexion} hayDatos={panel !== null} esDeCache={!!panel && !!fallo} />

        {fallo && conexion !== 'sin-red' ? (
          <Aviso mensaje={fallo.mensaje} detalle={fallo.detalle} />
        ) : null}

        {/* Only while there is earned time left. The budget is
            usage-based, so nobody can work it out from the clock.
            This is also the design's «Tienes tiempo» panel: the two
            were the same card, so there is one of them. */}
        <AvisoDeTiempo alGanarMas={() => router.push('/peaje')} />

        {cargando && !panel ? <EsqueletoPanel /> : null}

        {/* Nothing to say is said by saying nothing: an empty card
            takes the same room as a useful one.

            Answerable only when the server sent the options and the
            right answer: an older backend sends neither, and an
            invitation to a question that cannot be answered is worse
            than no invitation. */}
        {pregunta && !pregunta.resueltoHoy && esRespondible(pregunta) ? (
          <ResumenErrorDelDia
            pregunta={pregunta}
            onAbrir={() => router.push('/pregunta-del-dia')}
          />
        ) : null}

        {/* Someone sent a challenge at noon and it was invisible until
            the learner happened to open the duels screen — which, for
            someone who did not know a duel existed, is never. There is
            nowhere else this can reach them: reminders here are local
            notifications scheduled on the device, so nothing can be
            pushed while the app is closed. */}
        {dueloUnico ? (
          /* `plana` rather than raised: someone else's move on you is
             context for the day, not the day's work. */
          <Tarjeta variante="plana" className="flex-row items-center gap-3">
            {dueloUnico.contra?.alias ? (
              <Avatar nombre={dueloUnico.contra.alias} tamano="chico" />
            ) : null}
            <View className="flex-1 gap-0.5">
              {/* Named rather than counted. «Camilo» is a person; «1
                  duelo pendiente» is a chore. */}
              <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
                {dueloUnico.contra?.alias ?? 'Te retaron'}
              </Texto>
              {/* Five questions is the server's round size, said in
                  the same words the duels screen uses. The subject is
                  deliberately absent: a duel carries no area in its
                  payload, and naming one here would be a guess the
                  learner catches the moment the round opens. */}
              <Texto estilo="apoyo">5 preguntas</Texto>
            </View>
            <Boton
              variante="contorno"
              ancho={false}
              /* Straight to the duels list, not to Jugar: this card
                 already names the rival and the round, so stopping at
                 the hub first would be a step that asks the learner
                 to choose what they just chose. */
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

        {/* One line where five rows with percentages used to be.
            Those moved to «Yo» intact — nothing was deleted — and what
            is left is the only thing this screen has to decide: which
            subject. A learner reading five percentages to work that
            out was doing the screen's job for it.

            Null when nothing is measured yet, and null when the
            weakest subject is above 85%: naming one anyway would make
            the dashboard something that always has a complaint. */}
        {floja ? (
          <Texto estilo="apoyo">
            Lo más flojo: {NOMBRE_AREA[floja.area]}
          </Texto>
        ) : null}

        {/* The screen's one reason to exist. Inside the scroll rather
            than pinned above the tab bar: the dashboard is read top to
            bottom and this is its conclusion, not a toolbar.

            Carries the weak area, so the button does what the line
            above it just said. A dashboard that names a subject and
            then opens a generic picker has named it for nothing. */}
        <Boton
          alTocar={() =>
            router.push(floja ? `/entrenar?area=${floja.area}` : '/entrenar')
          }
        >
          {floja ? `Practicar ${NOMBRE_AREA[floja.area]}` : 'Practicar'}
        </Boton>
      </ScrollView>

    </SafeAreaView>
  );
}
