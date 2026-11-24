import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { nativo } from '../api/nativo';
import {
  aLegible,
  listoParaBloquear,
  siguientePendiente,
  type PasoLegible,
  type PasoNativo,
} from '../model/permisos';
import {
  ACCION_PRINCIPAL,
  ACCION_SECUNDARIA,
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

  const siguiente = siguientePendiente(pasos);
  const listo = listoParaBloquear(pasos);

  const pedirSiguiente = useCallback(async () => {
    if (!siguiente) return;
    setFallo(null);
    const r = await nativo.pedirPermiso(siguiente.id);
    if (!r.ok) setFallo(r.motivo);
    /* Not refreshed here: the system screen is now in front, and the
       status only settles once the learner comes back — which the
       AppState listener already handles. */
  }, [siguiente]);

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
      return;
    }
    setBloqueado(true);
  }, []);

  const quitarTodo = useCallback(async () => {
    const r = await nativo.desbloquearTodo();
    if (!r.ok) setFallo(r.motivo);
    setBloqueado(false);
  }, []);

  /** Lifts the shield for a number of minutes of *use*. */
  const conceder = useCallback(async (minutos: number) => {
    const r = await nativo.desbloqueoTemporal(segundosDeDesbloqueo(minutos));
    if (!r.ok) {
      setFallo(r.motivo);
      return false;
    }
    return true;
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
    aplicar,
    quitarTodo,
    conceder,
  };
}
