import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { nativo } from '../api/nativo';
import { vieneDelEscudo, type InteraccionDelEscudo } from '../model/llegadaDelEscudo';

/**
 * Whether the shield's button is what opened the app.
 *
 * The shield opens AICFES and says nothing about why, so the learner
 * landed on Inicio: block worked, shield appeared, "Resolverlas"
 * opened the app, and then nothing. This reads the interaction the
 * native side recorded and answers the one question the router needs.
 *
 * Checked on launch **and** whenever the app returns to the
 * foreground: Android usually resumes the existing process rather
 * than starting a new one, so a mount-only check would work the first
 * time and never again.
 */
export function useLlegadaDelEscudo(): boolean {
  const [llego, setLlego] = useState(false);
  /* Draining removes the interactions, so a second read finds
     nothing. This keeps the answer across the re-render that the
     navigation itself causes. */
  const yaRespondido = useRef(false);

  useEffect(() => {
    let vivo = true;

    const revisar = async () => {
      const r = await nativo.pulsacionesDelEscudo();
      if (!vivo || !r.ok) return;

      const pulsaciones = (r.valor ?? []) as InteraccionDelEscudo[];
      if (vieneDelEscudo(pulsaciones)) {
        yaRespondido.current = true;
        setLlego(true);
      }
    };

    void revisar();

    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active' && !yaRespondido.current) void revisar();
    });

    return () => {
      vivo = false;
      suscripcion.remove();
    };
  }, []);

  return llego;
}
