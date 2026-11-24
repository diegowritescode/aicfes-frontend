import { describe, expect, it } from 'vitest';
import {
  EMERGENCIAS_POR_DIA,
  diaLocal,
  puedeUsarEmergencia,
  quedanHoy,
  textoDelBoton,
  usarEmergencia,
} from './emergencia';

/**
 * The counted way out.
 *
 * No exit at all makes the app the thing between a learner and a
 * message that might matter, and the way out of that is uninstalling.
 * An unlimited one is the button a procrastinator presses every time.
 * The count is what makes it a decision rather than a reflex.
 */

const HOY = new Date('2026-11-24T14:00:00');

describe('cuántas quedan', () => {
  it('sin historial, quedan todas', () => {
    expect(quedanHoy(null, HOY)).toBe(EMERGENCIAS_POR_DIA);
  });

  it('se gastan', () => {
    const uno = usarEmergencia(null, HOY);
    expect(quedanHoy(uno, HOY)).toBe(1);
    expect(quedanHoy(usarEmergencia(uno, HOY), HOY)).toBe(0);
  });

  it('al agotarse, no hay más hoy', () => {
    let uso = usarEmergencia(null, HOY);
    uso = usarEmergencia(uso, HOY);
    expect(puedeUsarEmergencia(uso, HOY)).toBe(false);
  });

  it('mañana vuelven', () => {
    let uso = usarEmergencia(null, HOY);
    uso = usarEmergencia(uso, HOY);
    const mañana = new Date('2026-11-25T08:00:00');
    expect(quedanHoy(uso, mañana)).toBe(EMERGENCIAS_POR_DIA);
  });

  it('las que no usó no se acumulan', () => {
    /* Otherwise a learner who studies all week collects ten for
       Saturday, and the limit stops limiting anything. */
    const viejo = { dia: '2026-11-18', usadas: 0 };
    expect(quedanHoy(viejo, HOY)).toBe(EMERGENCIAS_POR_DIA);
  });

  it('un contador corrupto no da emergencias de más', () => {
    expect(quedanHoy({ dia: diaLocal(HOY), usadas: 99 }, HOY)).toBe(0);
  });
});

describe('el día es el del estudiante', () => {
  it('usa la hora local, no UTC', () => {
    /* At 8pm in Colombia (UTC-5) it is already tomorrow in UTC. Using
       UTC would reset the count mid-evening and hand out four. */
    const nocheEnColombia = new Date(2026, 10, 24, 20, 0, 0);
    expect(diaLocal(nocheEnColombia)).toBe('2026-11-24');
  });

  it('una emergencia de la noche cuenta para hoy', () => {
    const tarde = new Date(2026, 10, 24, 15, 0, 0);
    const noche = new Date(2026, 10, 24, 22, 0, 0);
    const uso = usarEmergencia(null, tarde);
    expect(quedanHoy(uso, noche)).toBe(1);
  });
});

describe('lo que dice el botón', () => {
  it('nombra el costo antes del toque', () => {
    // "Hoy no puedo" on its own reads as free.
    expect(textoDelBoton(2)).toContain('quedan 2');
    expect(textoDelBoton(1)).toContain('queda 1');
  });

  it('cuando no quedan, lo dice en vez de ofrecer', () => {
    expect(textoDelBoton(0)).toBe('Ya usó sus dos salidas de hoy');
  });
});
