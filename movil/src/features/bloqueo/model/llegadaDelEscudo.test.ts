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

  it('"Ver opciones" también abre la app', () => {
    /* Both buttons open AICFES now, to different screens. The
       secondary used to be `close`, and from the shield there
       appeared to be no way out but the exercises — when the counted
       emergency was one tap inside the toll. A way out nobody can
       find is a way out that does not exist. */
    expect(vieneDelEscudo([pulsacion('secondary', 1)], AHORA)).toBe(true);
  });

  it('dice cuál botón fue, para no mandarlos a la pantalla equivocada', () => {
    /* Sending someone who asked for the choices into the exercises
       is the opposite of what they tapped. */
    expect(pulsacionQueAbrio([pulsacion('secondary', 1)], AHORA)?.button).toBe(
      'secondary',
    );
    expect(pulsacionQueAbrio([pulsacion('primary', 1)], AHORA)?.button).toBe('primary');
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

  it('la última gana, sea cual sea el botón', () => {
    /* Tapping Resolverlas and then Ver opciones means they changed
       their mind, and the second tap is the one to honour. */
    const elegida = pulsacionQueAbrio(
      [pulsacion('primary', 10), pulsacion('secondary', 1)],
      AHORA,
    );
    expect(elegida?.button).toBe('secondary');
  });
});
