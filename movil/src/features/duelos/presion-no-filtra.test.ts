import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The duel round can show pressure without showing answers.
 *
 * The obvious version of this feature is a ding for every correct
 * answer while the round is being played. It cannot be built: the
 * correct answer does not travel to the phone, and sending it would
 * make a duel winnable by anyone who reads the HTTP response. No
 * amount of game feel is worth that.
 *
 * So the sound during a round confirms the tap, and right against
 * wrong is heard at the end, once the server has said which was
 * which. These tests pin that, because the next person to work on
 * «make the duel feel better» will reach for the answers first.
 */

const RAIZ = join(__dirname, '..', '..');

describe('la ronda no recibe las respuestas', () => {
  const ESQUEMAS = readFileSync(
    join(RAIZ, 'features', 'duelos', 'api', 'esquemas.ts'),
    'utf8',
  );

  function bloque(nombre: string): string {
    const desde = ESQUEMAS.indexOf(`export const ${nombre} = z.object({`);
    expect(desde, `${nombre} ya no existe`).toBeGreaterThan(-1);
    const resto = ESQUEMAS.slice(desde);
    return resto.slice(0, resto.indexOf('});'));
  }

  it('una pregunta de duelo no trae la respuesta correcta', () => {
    const p = bloque('preguntaDeDuelo');

    for (const campo of ['respuesta_correcta', 'correcta', 'explicaciones']) {
      expect(
        new RegExp(campo).test(p),
        `${campo} en una pregunta de duelo: el duelo lo gana quien lea la respuesta HTTP`,
      ).toBe(false);
    }
  });

  it('la marca del rival es un número, no sus elecciones', () => {
    const m = bloque('marcaDelRival');

    expect(/aciertos/.test(m)).toBe(true);
    expect(/segundos/.test(m)).toBe(true);
    /* Which questions the rival got right would be a cheat sheet:
       both players answer the same five. */
    for (const campo of ['respuestas', 'eleccion', 'itemId']) {
      expect(
        new RegExp(campo).test(m),
        `${campo} viaja con la marca: eso dice qué contestar`,
      ).toBe(false);
    }
  });
});

describe('el sonido de la ronda', () => {
  const HOOK = readFileSync(
    join(RAIZ, 'features', 'duelos', 'hooks', 'useRondaDeDuelo.ts'),
    'utf8',
  );

  it('suena al elegir, sin saber si acertó', () => {
    const desde = HOOK.indexOf('const elegir = useCallback(');
    expect(desde).toBeGreaterThan(-1);
    const cuerpo = HOOK.slice(desde, HOOK.indexOf('const siguiente', desde));

    expect(/sonar\(/.test(cuerpo)).toBe(true);
    /* If this ever branched on correctness, the answers would have to
       be on the device. */
    expect(
      /correcta|acerto|esCorrecta/.test(cuerpo.replace(/sonar\('acierto'\)/g, '')),
      'el sonido se bifurca según el acierto: eso exige la respuesta en el teléfono',
    ).toBe(false);
  });

  it('victoria y derrota suenan distinto, y esperar no suena', () => {
    const desde = HOOK.indexOf('const entregar = useCallback(');
    const cuerpo = HOOK.slice(desde, HOOK.indexOf('const actual =', desde));

    expect(/victoria/.test(cuerpo)).toBe(true);
    expect(/derrota/.test(cuerpo)).toBe(true);
    /* Finishing first has won nothing yet; a victory tone there is a
       promise the duel might break. */
    expect(
      /estado === 'terminado'/.test(cuerpo),
      'suena sin comprobar que el duelo terminó',
    ).toBe(true);
  });

  it('el sonido se puede apagar, y la preferencia se guarda', () => {
    expect(/alternarSonido/.test(HOOK)).toBe(true);

    const almacen = readFileSync(
      join(RAIZ, 'core', 'almacenamiento', 'sonido.ts'),
      'utf8',
    );
    expect(/guardarSonido/.test(almacen)).toBe(true);
    /* A sound that cannot be silenced in a classroom is a reason to
       close the app. */
    expect(/AsyncStorage/.test(almacen)).toBe(true);
  });
});

describe('el reloj de la ronda', () => {
  const HOOK = readFileSync(
    join(RAIZ, 'features', 'duelos', 'hooks', 'useRondaDeDuelo.ts'),
    'utf8',
  );

  it('no es una cuenta atrás', () => {
    /* A learner cut off mid-question would lose to a clock instead of
       a rival, and the asynchronous duel exists so an interruption
       costs nothing. */
    expect(
      /clearTimeout|cuentaAtras|tiempoRestante|seAcaboElTiempo/.test(HOOK),
      'apareció una cuenta atrás: un duelo no tiene límite de tiempo',
    ).toBe(false);
  });

  it('el tiempo sale del reloj de pared, no de un contador', () => {
    /* Counting up once a second drifts and under-reports a round that
       was backgrounded — and the server is told this same number. */
    expect(/Date\.now\(\) - inicio\.current/.test(HOOK)).toBe(true);
  });

  it('el intervalo se limpia', () => {
    expect(
      /clearInterval/.test(HOOK),
      'un intervalo sin limpiar sigue corriendo tras salir de la ronda',
    ).toBe(true);
  });
});
