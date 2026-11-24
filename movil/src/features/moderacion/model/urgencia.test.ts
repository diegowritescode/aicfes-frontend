import { describe, expect, it } from 'vitest';
import {
  DIAS_PARA_ATRASADA,
  DIAS_PARA_MUY_ATRASADA,
  mensajeDe,
  mereceAviso,
  urgenciaDe,
} from './urgencia';

/**
 * When the moderation queue needs attention.
 *
 * The queue became readable before anything said when to read it. A
 * learner who reported harassment was told a person would look at it,
 * so these thresholds are about keeping that promise.
 */

describe('urgencia', () => {
  it('una cola vacía no es urgente', () => {
    expect(urgenciaDe({ abiertas: 0, diasDeLaMasAntigua: null })).toBe('nada');
  });

  it('una denuncia de hoy está por revisar, no atrasada', () => {
    expect(urgenciaDe({ abiertas: 1, diasDeLaMasAntigua: 0 })).toBe('por_revisar');
  });

  it('un día esperando ya es atrasada', () => {
    /* One day, not three: being told a person would look and seeing
       nothing happen for a day is already long. */
    expect(urgenciaDe({ abiertas: 1, diasDeLaMasAntigua: DIAS_PARA_ATRASADA })).toBe('atrasada');
  });

  it('tres días significa que nadie la está atendiendo', () => {
    expect(urgenciaDe({ abiertas: 1, diasDeLaMasAntigua: DIAS_PARA_MUY_ATRASADA })).toBe(
      'muy_atrasada',
    );
  });

  it('con denuncias abiertas y sin fecha, no las ignora', () => {
    /* `diasDeLaMasAntigua` null with `abiertas > 0` should not read as
       "nothing to do": the count is the authority. */
    expect(urgenciaDe({ abiertas: 2, diasDeLaMasAntigua: null })).toBe('por_revisar');
  });
});

describe('el mensaje', () => {
  it('no dice nada cuando no hay nada', () => {
    expect(mensajeDe({ abiertas: 0, diasDeLaMasAntigua: null })).toBeNull();
  });

  it('da números, no adjetivos', () => {
    /* "3 denuncias, la más vieja de hace 2 días" tells the moderator
       what to do. "Atención requerida" does not. */
    expect(mensajeDe({ abiertas: 3, diasDeLaMasAntigua: 2 })).toBe(
      '3 denuncias sin revisar, la más vieja de hace 2 días',
    );
  });

  it('habla en singular cuando es una', () => {
    expect(mensajeDe({ abiertas: 1, diasDeLaMasAntigua: 0 })).toBe('1 denuncia sin revisar, de hoy');
  });

  it('dice ayer en vez de hace 1 días', () => {
    expect(mensajeDe({ abiertas: 1, diasDeLaMasAntigua: 1 })).toBe(
      '1 denuncia sin revisar, la más vieja de ayer',
    );
  });
});

describe('cuándo interrumpir', () => {
  it('solo cuando hay algo', () => {
    expect(mereceAviso('nada')).toBe(false);
    expect(mereceAviso('por_revisar')).toBe(true);
    expect(mereceAviso('muy_atrasada')).toBe(true);
  });
});
