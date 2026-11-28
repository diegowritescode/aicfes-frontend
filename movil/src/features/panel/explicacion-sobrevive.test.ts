import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Answering must not take the explanation away.
 *
 * Reported from a phone: tapping an option on the question of the day
 * replaced the card with «ya la respondiste» before the learner could
 * read why they were wrong. The question of the day is drawn from
 * what they already got wrong, so the explanation is the entire
 * point; without it the screen is a scoreboard.
 *
 * The cause was not in the card. `TarjetaErrorDelDia` already freezes
 * its own copy on mount, with a comment saying exactly why. The
 * screen around it re-read `esRespondible(pregunta)` on every render,
 * and answering invalidates `error-del-dia` — so the server answered
 * null and the parent unmounted the card, defence and all.
 *
 * A component cannot protect itself from a parent that removes it.
 * That is the rule worth keeping, and it is what this file checks.
 *
 * Limit, stated plainly: this reads the source rather than rendering,
 * because the project has no render environment. It pins the shape of
 * the fix, not the pixels. Whether the explanation is legible is a
 * question for the device.
 */

const RAIZ = join(__dirname, '../..');

function leer(ruta: string): string {
  return readFileSync(join(RAIZ, ruta), 'utf8');
}

describe('la pantalla no desmonta la tarjeta al responder', () => {
  const pantalla = leer('app/pregunta-del-dia.tsx');

  it('congela la pregunta en vez de releerla en cada render', () => {
    expect(pantalla).toMatch(/const \[congelada, setCongelada\] = useState/);
  });

  it('la tarjeta recibe la congelada, no la viva', () => {
    /* Passing the live `pregunta` would hand the card a null the
       moment the query invalidates, which is the same bug one layer
       down. */
    expect(pantalla).toMatch(/pregunta=\{mostrada\}/);
    expect(pantalla).not.toMatch(/<TarjetaErrorDelDia\s+pregunta=\{pregunta\}/);
  });

  it('solo congela una pregunta respondible', () => {
    /* Freezing a null or a malformed question would show the card
       with nothing in it, which is worse than the message. */
    expect(pantalla).toMatch(/if \(!congelada && esRespondible\(pregunta\)\)/);
  });

  it('lo que se registra es la pregunta que vio el estudiante', () => {
    /* The mutation has to report the question actually answered. With
       the live value it could post about a different one, or null. */
    expect(pantalla).toMatch(/pregunta: mostrada/);
  });
});

describe('la tarjeta mantiene su propia defensa', () => {
  const tarjeta = leer('features/panel/components/TarjetaErrorDelDia.tsx');

  it('sigue congelando su copia al montarse', () => {
    /* Belt and braces, and the inner one was already right. Removing
       it because the parent now behaves would leave the card unsafe
       for the next screen that mounts it. */
    expect(tarjeta).toMatch(/const \[fija\] = useState\(\(\) => pregunta\)/);
  });

  it('una sola oportunidad de responder', () => {
    /* Letting them retry until the border turns green teaches the
       border, not the question. */
    expect(tarjeta).toMatch(/if \(respondida\) return/);
  });
});
