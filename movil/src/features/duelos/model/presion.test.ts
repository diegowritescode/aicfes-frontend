import { describe, expect, it } from 'vitest';
import {
  estadoDelReloj,
  lineaDeMarca,
  loQueHaceFalta,
  reloj,
  vaGanando,
} from './presion';

const MARCA = { aciertos: 3, segundos: 95, deCuantas: 5 };

describe('la línea de la marca', () => {
  it('nombra al rival y lo que hizo', () => {
    expect(lineaDeMarca(MARCA, 'Camilo')).toBe('Camilo hizo 3 de 5 en 1:35.');
  });

  it('usa segundos sueltos cuando no llega al minuto', () => {
    expect(lineaDeMarca({ ...MARCA, segundos: 52 }, 'Camilo')).toBe(
      'Camilo hizo 3 de 5 en 52s.',
    );
  });

  it('sin marca no muestra un cero', () => {
    /* «Camilo: 0 de 5» would read as the rival having failed. */
    const linea = lineaDeMarca(null, 'Camilo');

    expect(linea).toContain('todavía no ha jugado');
    expect(linea).not.toContain('0 de 5');
  });

  it('nombra a la persona, no «tu rival»', () => {
    expect(lineaDeMarca(MARCA, 'Sofía')).toContain('Sofía');
  });
});

describe('lo que hace falta', () => {
  it('dice cuántos aciertos ganan', () => {
    expect(loQueHaceFalta(MARCA)).toContain('Con 4 aciertos le gana');
  });

  it('dice que empatar lo decide el tiempo', () => {
    expect(loQueHaceFalta(MARCA)).toContain('más rápido');
  });

  it('contra una ronda perfecta no pide una imposible', () => {
    const texto = loQueHaceFalta({ aciertos: 5, segundos: 40, deCuantas: 5 });

    expect(texto).toContain('las 5');
    expect(texto).toContain('menos de 40s');
    expect(texto).not.toContain('6');
  });

  it('sin marca no hay instrucción', () => {
    expect(loQueHaceFalta(null)).toBe(null);
  });
});

describe('el estado del reloj', () => {
  it('no juzga el ritmo antes de la primera respuesta', () => {
    /* Calling a round slow at second one teaches a learner to ignore
       the clock. */
    expect(estadoDelReloj({ segundos: 300, respondidas: 0, deCuantas: 5 })).toBe('comodo');
  });

  it('por debajo de tres cuartos del examen va cómodo', () => {
    expect(estadoDelReloj({ segundos: 90, respondidas: 2, deCuantas: 5 })).toBe('comodo');
  });

  it('cerca de los 64s del examen va justo', () => {
    expect(estadoDelReloj({ segundos: 120, respondidas: 2, deCuantas: 5 })).toBe('justo');
  });

  it('por encima de los 64s va lento', () => {
    expect(estadoDelReloj({ segundos: 200, respondidas: 2, deCuantas: 5 })).toBe('lento');
  });
});

describe('el reloj', () => {
  it('muestra mm:ss', () => {
    expect(reloj(0)).toBe('0:00');
    expect(reloj(9)).toBe('0:09');
    expect(reloj(95)).toBe('1:35');
    expect(reloj(600)).toBe('10:00');
  });

  it('un negativo no se muestra', () => {
    expect(reloj(-5)).toBe('0:00');
  });
});

describe('va ganando', () => {
  it('no se afirma antes de responder tantas como el rival', () => {
    /* «Va ganando» after one of five is a claim that will be
       withdrawn, and a round that changes its mind about who is
       winning is a round nobody believes. */
    expect(vaGanando({ aciertos: 1, respondidas: 1, marca: MARCA })).toBe(null);
    expect(vaGanando({ aciertos: 4, respondidas: 4, marca: MARCA })).toBe(null);
  });

  it('con la ronda entera respondida sí', () => {
    expect(vaGanando({ aciertos: 4, respondidas: 5, marca: MARCA })).toBe(true);
    expect(vaGanando({ aciertos: 3, respondidas: 5, marca: MARCA })).toBe(false);
  });

  it('sin marca no hay nada que afirmar', () => {
    expect(vaGanando({ aciertos: 5, respondidas: 5, marca: null })).toBe(null);
  });
});
