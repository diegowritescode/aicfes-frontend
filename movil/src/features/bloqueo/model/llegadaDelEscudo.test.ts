import { describe, expect, it } from 'vitest';
import {
  SEGUNDOS_DE_GRACIA,
  pulsacionQueAbrio,
  vieneDelEscudo,
  type InteraccionDelEscudo,
} from './llegadaDelEscudo';

/**
 * Did the shield open this launch?
 *
 * Reported from a real phone: the block worked, the shield appeared,
 * "Resolverlas" opened AICFES — and landed on Inicio. The shield's
 * button opens the app and says nothing about why, so something has
 * to read the interaction and route.
 */

const AHORA = 1_800_000_000_000;

function pulsacion(
  button: 'primary' | 'secondary',
  hace: number,
): InteraccionDelEscudo {
  return { button, timestamp: AHORA - hace * 1000 };
}

describe('qué cuenta como venir del escudo', () => {
  it('una pulsación de hace un segundo, sí', () => {
    expect(vieneDelEscudo([pulsacion('primary', 1)], AHORA)).toBe(true);
  });

  it('sin pulsaciones, no', () => {
    expect(vieneDelEscudo([], AHORA)).toBe(false);
  });

  it('"Ahora no" no abre el peaje', () => {
    /* The secondary button declines. A learner who said no and then
       found the exercises anyway would have been ignored. */
    expect(vieneDelEscudo([pulsacion('secondary', 1)], AHORA)).toBe(false);
  });

  it('una pulsación de ayer no cuenta', () => {
    /* Interactions queue until something drains them, so last night's
       tap is still in the list on the first read. Acting on it would
       be the app inventing a block. */
    expect(vieneDelEscudo([pulsacion('primary', 86_400)], AHORA)).toBe(false);
  });

  it('el límite es la ventana de gracia', () => {
    expect(vieneDelEscudo([pulsacion('primary', SEGUNDOS_DE_GRACIA - 1)], AHORA)).toBe(true);
    expect(vieneDelEscudo([pulsacion('primary', SEGUNDOS_DE_GRACIA + 1)], AHORA)).toBe(false);
  });
});

describe('cuál pulsación', () => {
  it('la más reciente, si tocó dos veces', () => {
    const elegida = pulsacionQueAbrio(
      [pulsacion('primary', 90), pulsacion('primary', 2)],
      AHORA,
    );
    expect(elegida?.timestamp).toBe(AHORA - 2000);
  });

  it('ignora las de "Ahora no" aunque sean más recientes', () => {
    const elegida = pulsacionQueAbrio(
      [pulsacion('primary', 10), pulsacion('secondary', 1)],
      AHORA,
    );
    expect(elegida?.button).toBe('primary');
    expect(elegida?.timestamp).toBe(AHORA - 10_000);
  });
});
