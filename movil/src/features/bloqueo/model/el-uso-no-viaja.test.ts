import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Nothing about which apps a learner blocks leaves the phone.
 *
 * This is a compliance property, not a preference. Google's Data
 * safety form defines collection in one line: «'Collect' means
 * transmitting data from your app off a user's device.» While the
 * blocking data stays local, there is nothing to declare under
 * «Installed apps» or «App interactions», and the prominent-
 * disclosure surface shrinks to the permission request itself.
 *
 * One `fetch` added later — a «sync your blocked apps across
 * devices», an analytics event counting shield hits — silently makes
 * the published Data safety form false. Google: «Your Data safety
 * form responses must remain accurate and complete at all times»,
 * and a mismatch is an enforcement action.
 *
 * There is a second reason it cannot travel even if someone wanted
 * it to: Android never hands JavaScript the package names. The
 * module returns an opaque `selectionId` for a choice the learner
 * made in a system picker, and its own docs say never to parse or
 * construct one. So «which apps» is not ours to leak — but «how many
 * times they hit the shield» is, and that is what this guards.
 */

const BLOQUEO = join(__dirname, '..');

function archivos(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const ruta = join(dir, e);
    if (statSync(ruta).isDirectory()) archivos(ruta, acc);
    else if (/\.tsx?$/.test(e) && !/\.test\.tsx?$/.test(e)) acc.push(ruta);
  }
  return acc;
}

describe('el bloqueo no manda nada al servidor', () => {
  it('ningún archivo de la feature hace una petición', () => {
    const culpables: string[] = [];

    for (const archivo of archivos(BLOQUEO)) {
      const fuente = readFileSync(archivo, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '');

      for (const senal of ['fetch(', 'pedir(', 'axios', 'XMLHttpRequest']) {
        if (fuente.includes(senal)) {
          culpables.push(`${archivo.replace(BLOQUEO, '')}: ${senal}`);
        }
      }
    }

    expect(
      culpables,
      'el uso de apps saldría del teléfono: hay que declararlo en Data safety',
    ).toEqual([]);
  });

  it('el selectionId no se manda a ninguna parte', () => {
    const culpables: string[] = [];

    for (const archivo of archivos(BLOQUEO)) {
      const fuente = readFileSync(archivo, 'utf8');
      /* The opaque id of the learner's app choice. Storing it on the
         phone is right; putting it in a request body is not. */
      if (/selectionId/.test(fuente) && /cuerpo:|body:|JSON\.stringify\(/.test(fuente)) {
        culpables.push(archivo.replace(BLOQUEO, ''));
      }
    }

    expect(culpables).toEqual([]);
  });

  it('la cola del peaje guarda respuestas, no apps', () => {
    const peaje = readFileSync(
      join(BLOQUEO, '..', 'offline', 'model', 'peaje.ts'),
      'utf8',
    );

    const bloque = peaje.slice(
      peaje.indexOf('export interface IntentoDelPeaje'),
      peaje.indexOf('export interface EstadoDelPeaje'),
    );

    expect(bloque, 'IntentoDelPeaje ya no está donde esta guarda lo busca').toContain('itemId');

    /* What syncs is the answer to a question — the same shape the
       app already sends for any practice run. Not which app was
       opened, not when, not how often. */
    for (const prohibido of ['app', 'paquete', 'package', 'selection', 'bloqueada']) {
      expect(
        bloque.toLowerCase().includes(prohibido),
        `la cola empezó a llevar «${prohibido}»: eso sí viaja al servidor`,
      ).toBe(false);
    }
  });
});
