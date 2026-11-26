import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { nativo } from '../api/nativo';
import { vieneDelEscudo, type InteraccionDelEscudo } from '../model/llegadaDelEscudo';

/**
 * Whether the shield's button is what brought the app to the front.
 *
 * The shield opens AICFES and says nothing about why, so without this
 * the learner lands wherever they were — which is what shipped, and
 * the report was exact: with the app closed it worked, with the app
 * already open it did not.
 *
 * That difference is the whole shape of the problem. Android resumes
 * an existing process rather than starting a new one, so the effect
 * runs once in the app's lifetime and every later arrival comes
 * through `AppState` instead.
 */
export function useLlegadaDelEscudo(): { llego: boolean; atendido: () => void } {
  const [llego, setLlego] = useState(false);
  /* Guards the window between deciding to navigate and the navigation
     happening — draining is destructive, so a second read in that gap
     finds nothing and would cancel the trip.
     
     Cleared by `atendido()` once the route is reached. The first
     version never cleared it, so the second block of the session was
     ignored: a one-shot latch for something that happens every time
     a learner opens Instagram. */
  const navegando = useRef(false);

  const revisar = useCallback(async () => {
    if (navegando.current) return;

    const r = await nativo.pulsacionesDelEscudo();
    if (!r.ok) return;

    const pulsaciones = (r.valor ?? []) as InteraccionDelEscudo[];
    if (vieneDelEscudo(pulsaciones)) {
      navegando.current = true;
      setLlego(true);
    }
  }, []);

  useEffect(() => {
    void revisar();

    const suscripcion = AppState.addEventListener('change', (estado) => {
      /* Every return to the foreground, not just the first. This is
         the path that matters: once the app has been opened, every
         later block arrives here. */
      if (estado === 'active') void revisar();
    });

    return () => suscripcion.remove();
  }, [revisar]);

  /** Called once the toll is on screen, so the next block can route. */
  const atendido = useCallback(() => {
    navegando.current = false;
    setLlego(false);
  }, []);

  return { llego, atendido };
}
