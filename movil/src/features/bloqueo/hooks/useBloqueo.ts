import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { objetivosParaDesbloquear, type AppConSaldo } from '../model/saldos';
import { nativo } from '../api/nativo';
import { almacenPeaje } from '@/core/almacenamiento/peaje';
import {
  aLegible,
  listoParaBloquear,
  sePuedeOmitir,
  siguientePendiente,
  type PasoLegible,
  type PasoNativo,
} from '../model/permisos';
import {
  ACCION_PRINCIPAL,
  ACCION_SECUNDARIA,
  SEGUNDOS_DE_RESPIRO,
  SELECCION,
  TEXTOS_DEL_ESCUDO,
  segundosDeDesbloqueo,
} from '../model/escudo';

/**
 * Blocking, from the app's side.
 *
 * Re-reads the permissions whenever the app comes back to the
 * foreground, because that is exactly when they change: the learner
 * was just in Settings granting one. Without it the screen keeps
 * showing a red chip for something already allowed, and the obvious
 * conclusion is that the app does not work.
 */
export function useBloqueo() {
  const [disponible, setDisponible] = useState<boolean | null>(null);
  const [pasos, setPasos] = useState<readonly PasoLegible[]>([]);
  const [bloqueado, setBloqueado] = useState(false);
  const [appsSeleccionadas, setAppsSeleccionadas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [sinPasos, setSinPasos] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  const refrescar = useCallback(async () => {
    const hay = await nativo.disponible();
    setDisponible(hay);
    if (!hay) {
      setCargando(false);
      return;
    }

    const [permisos, estado, meta] = await Promise.all([
      nativo.permisos(),
      nativo.estaBloqueado(),
      nativo.cuantasApps(SELECCION),
    ]);

    if (permisos.ok) {
      const crudos = (permisos.valor as { steps?: PasoNativo[] }).steps ?? [];
      setPasos(crudos.map(aLegible));
      /* An empty list from a call that worked is not a failure — it
         is a platform with no steps to grant. Said out loud anyway,
         because an empty section with a heading over it looks like a
         screen that failed to load. */
      setSinPasos(crudos.length === 0);
    } else {
      /* Swallowing this is what made a typo look like a missing
         feature: the section rendered its heading and nothing else,
         with no way to tell "no permissions needed" from "the call
         did not work". */
      setFallo(permisos.motivo);
      setPasos([]);
    }
    if (estado.ok) setBloqueado(estado.valor);
    if (meta.ok) setAppsSeleccionadas(meta.valor?.applicationCount ?? 0);

    setCargando(false);
  }, []);

  useEffect(() => {
    void refrescar();

    /* Settings is a different app, so coming back is the only signal
       that a permission may have changed. */
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void refrescar();
    });
    return () => suscripcion.remove();
  }, [refrescar]);

  /**
   * Steps the learner chose to pass over.
   *
   * Loaded once and kept on the device. A skip that is forgotten on
   * restart is not a skip: the step whose state this phone will not
   * report would wall the setup again on every launch, which is the
   * failure this exists to end.
   */
  const [omitidos, setOmitidos] = useState<readonly string[]>([]);

  useEffect(() => {
    let vivo = true;
    void almacenPeaje.leerPermisosOmitidos().then((guardados) => {
      if (vivo && guardados) setOmitidos(guardados);
    });
    return () => {
      vivo = false;
    };
  }, []);

  const siguiente = siguientePendiente(pasos, omitidos);
  const listo = listoParaBloquear(pasos);

  /**
   * Pass over the step in front, and remember it.
   *
   * Only ever a recommended one — `sePuedeOmitir` refuses a required
   * step, and `siguientePendiente` refuses to honour a skip of one,
   * because without those the toll blocks nothing and a setup that
   * calls itself done while the feature is dead is worse than a wall.
   *
   * The step keeps its row. Skipping is not dismissing: it can still
   * be granted later, and on the next launch the app re-reads it, so
   * a learner who does find the right switch sees it turn green
   * without having to undo anything.
   */
  const omitirSiguiente = useCallback(async () => {
    if (!siguiente || !sePuedeOmitir(siguiente)) return;
    const nuevos = [...omitidos, siguiente.id];
    setOmitidos(nuevos);
    await almacenPeaje.guardarPermisosOmitidos(nuevos);
  }, [siguiente, omitidos]);

  const pedirSiguiente = useCallback(async () => {
    if (!siguiente) return;
    setFallo(null);
    const r = await nativo.pedirPermiso(siguiente.id);
    if (!r.ok) setFallo(r.motivo);
    /* Not refreshed here: the system screen is now in front, and the
       status only settles once the learner comes back — which the
       AppState listener already handles. */
  }, [siguiente]);

  const leerSaldos = useCallback(async (): Promise<AppConSaldo[]> => {
    const guardados = await almacenPeaje.leerSaldos<
      Array<{ handle: string; segundos: number; desde: number }>
    >();
    if (!guardados) return [];

    const ahora = Date.now();
    /* Dropped at midnight, because that is when the module expires
       an unspent budget. Anything older than a day is stale by
       definition. */
    const deHoy = guardados.filter(
      (g) => new Date(g.desde).toDateString() === new Date(ahora).toDateString(),
    );

    return deHoy.map((g) => ({ handle: g.handle, segundos: g.segundos }));
  }, []);

  /**
   * Applies the block to whatever is selected.
   *
   * Called after every change in the picker, not from a button. "What
   * is selected is blocked" is a rule that explains itself; a
   * separate Block button leaves a state where something is picked
   * and nothing is blocked, and no label makes that clear.
   */
  const aplicar = useCallback(async () => {
    setFallo(null);

    const meta = await nativo.cuantasApps(SELECCION);
    const cuantas = meta.ok ? (meta.valor?.applicationCount ?? 0) : 0;
    setAppsSeleccionadas(cuantas);

    if (cuantas === 0) {
      /* Nothing selected means nothing blocked. Leaving an old block
         up after the learner cleared the list would be the app
         refusing to let go. */
      const r = await nativo.desbloquearTodo();
      if (!r.ok) setFallo(r.motivo);
      setBloqueado(false);
      return;
    }

    /* Checked before blocking, not assumed.
       `blockSelection` can return without error while the system
       refuses to act, because Android cannot shield anything without
       usage access. The screen then said "1 app bloqueada" over a
       block that was not happening — reported from a real phone, and
       the worst kind of failure this feature can have: it tells a
       learner they are protected when they are not. */
    if (!listoParaBloquear(pasos)) {
      setFallo(
        'Faltan permisos. Concédelos arriba y vuelve a escoger tus apps.',
      );
      setBloqueado(false);
      return;
    }

    /* The shield is configured before the block, so the first thing a
       learner sees is already the right screen. */
    await nativo.configurarEscudo(TEXTOS_DEL_ESCUDO);
    await nativo.accionesDelEscudo({
      primaryAction: ACCION_PRINCIPAL,
      secondaryAction: ACCION_SECUNDARIA,
    });

    const r = await nativo.bloquear(SELECCION);
    if (!r.ok) {
      setFallo(r.motivo);
      setBloqueado(false);
      return;
    }

    /* `blockSelection` cancels every active unlock — the module says
       so, and it means ticking one more app in the picker silently
       took away time already earned. The grants are reissued for
       what is still on the clock today.
       
       Not a loophole: the budget is what was granted, and reissuing
       it restores what the tick destroyed rather than adding to it.
       Whatever was already spent is lost, which is the honest cost
       of a platform that cannot report consumption. */
    const vivos = await leerSaldos();
    if (vivos.length > 0) {
      for (const saldo of vivos) {
        await nativo.desbloqueoTemporal(saldo.segundos, {
          handle: saldo.handle,
          type: 'application',
        });
      }
    }

    /* Asked, not assumed. A call that returned without error is not
       the same as a shield that is up, and this is the one place
       where believing the optimistic answer misleads a learner about
       whether their phone is actually guarded. */
    const confirmado = await nativo.estaBloqueado();
    if (confirmado.ok && !confirmado.valor) {
      setFallo(
        'El sistema no aplicó el bloqueo. Revisa los permisos de arriba.',
      );
      setBloqueado(false);
      return;
    }

    setBloqueado(true);
  }, [pasos, leerSaldos]);

  const quitarTodo = useCallback(async () => {
    const r = await nativo.desbloquearTodo();
    if (!r.ok) setFallo(r.motivo);
    setBloqueado(false);
  }, []);

  /**
   * Gives every blocked app its own budget of use.
   *
   * One grant per app rather than one for the block. A whole-block
   * grant is replaced by the next one, so answering five questions
   * for Facebook wiped the eight minutes left on Instagram —
   * reported from real use, and exactly what the module says
   * happens.
   *
   * One round of questions still unlocks everything. Each app just
   * keeps its own clock.
   */
  const conceder = useCallback(async (minutos: number) => {
    const segundos = segundosDeDesbloqueo(minutos);
    const tokens = await nativo.tokensDe(SELECCION);

    const objetivos = tokens.ok
      ? objetivosParaDesbloquear(tokens.valor ?? [])
      : [];

    if (objetivos.length === 0) {
      /* No handles to target — an older module, a selection made of
         categories, or a read that failed. The whole-block grant is
         the fallback: worse when several apps are blocked, and far
         better than granting nothing after five answered questions. */
      const r = await nativo.desbloqueoTemporal(segundos);
      if (!r.ok) setFallo(r.motivo);
      return r.ok;
    }

    let alguno = false;
    const concedidos: Array<{ handle: string; segundos: number; desde: number }> = [];

    for (const handle of objetivos) {
      const r = await nativo.desbloqueoTemporal(segundos, {
        handle,
        type: 'application',
      });
      if (r.ok) {
        alguno = true;
        concedidos.push({ handle, segundos, desde: Date.now() });
      }
    }

    /* Written down because the module cannot be asked later: a
       targeted grant is invisible to `getRemainingUnlockSeconds`. */
    if (concedidos.length > 0) await almacenPeaje.guardarSaldos(concedidos);

    if (!alguno) setFallo('No pudimos darte el tiempo. Intenta de nuevo.');
    return alguno;
  }, []);

  /**
   * How much earned time is left, as far as we can tell.
   *
   * The module cannot answer this for targeted grants:
   * `getRemainingUnlockSeconds` reports only the whole-block budget,
   * and says so. So this is what was granted, not what remains — it
   * cannot know how much of it was spent.
   *
   * Which is why the screen says "hasta 15 min" rather than counting
   * down. Showing a number that only goes down when the app is
   * reopened, while the learner watches reels, would be the same
   * kind of lie that started this.
   */

  /**
   * A few seconds so the shield does not interrupt the screen it
   * asked for.
   *
   * Reported from a real phone: tapping Resolverlas opened the
   * exercises and a second later the shield was back, unprompted.
   * The blocked app is still in the foreground while Android
   * switches, and the shield fires on it again.
   *
   * Not a reward — thirty seconds, revoked the moment the learner
   * leaves the toll.
   */
  const respiro = useCallback(async () => {
    await nativo.desbloqueoTemporal(SEGUNDOS_DE_RESPIRO);
  }, []);

  /** Ends the breathing room. The shield comes straight back. */
  const terminarRespiro = useCallback(async () => {
    await nativo.volverABloquear();
  }, []);

  /**
   * Brings the blocked app back to the front, where the platform
   * allows it.
   *
   * Reported from a real phone: the finish button said "Abrir la
   * app" and went to AICFES Inicio instead. After eight questions,
   * a label that lies is the last thing this screen should do.
   */
  const abrirApp = useCallback(async (handle: string) => {
    const r = await nativo.abrirApp(handle);
    return r.ok;
  }, []);

  return {
    disponible,
    cargando,
    pasos,
    /** The call worked and reported nothing to grant. */
    sinPasos,
    siguiente,
    listo,
    bloqueado,
    appsSeleccionadas,
    fallo,
    refrescar,
    pedirSiguiente,
    omitirSiguiente,
    /** True when this step can be passed over: recommended, not required. */
    sePuedeOmitirSiguiente: siguiente ? sePuedeOmitir(siguiente) : false,
    aplicar,
    quitarTodo,
    conceder,
    leerSaldos,
    respiro,
    terminarRespiro,
    abrirApp,
  };
}
