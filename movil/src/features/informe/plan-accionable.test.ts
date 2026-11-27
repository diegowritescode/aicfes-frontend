import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The plan has to be startable, not just readable.
 *
 * This is a file-reading test rather than a render, and deliberately
 * so: what broke here was never visible in a rendered card. The plan
 * carried the right topic, the button looked right, and the topic was
 * dropped on the way to the server — first because the link only sent
 * `area`, and underneath that because `ItemBankService.draw` filtered
 * on area and difficulty and answers before the generator. Both
 * layers typechecked. A learner tapping «practicar ángulos» got mixed
 * Matemáticas and nothing anywhere said so.
 *
 * So these assertions are about the shape of the request, which is
 * the thing that was wrong and the thing a typecheck cannot catch.
 */

const RAIZ = join(__dirname, '../..');

function leer(ruta: string): string {
  return readFileSync(join(RAIZ, ruta), 'utf8');
}

describe('el botón del plan lleva el tema, no solo el área', () => {
  const tarjeta = leer('features/informe/components/TarjetaInforme.tsx');

  it('manda el tema en la URL', () => {
    expect(tarjeta).toMatch(/tema=\$\{encodeURIComponent\(accion\.tema\)\}/);
  });

  it('también manda el área, porque el banco filtra por las dos', () => {
    /* Topic alone would match rows in another area with the same tag
       name, and the weakness was recorded against the pair. */
    expect(tarjeta).toMatch(/area=\$\{accion\.area\}/);
  });

  it('codifica el tema para la URL', () => {
    /* Topics contain spaces and accents («descomposición en factores»).
       Pasted raw into a query string they arrive truncated or broken,
       which looks like an empty bank rather than a bad link. */
    expect(tarjeta).toContain('encodeURIComponent(accion.tema)');
  });

  it('no apunta a entrenar, que no sabe de temas', () => {
    /* `entrenar` reads an `area` param and nothing else. Sending a
       topic there is a parameter the screen silently drops — the
       original bug with a new address. */
    expect(tarjeta).not.toMatch(/push\(`\/entrenar\?[^`]*tema/);
  });
});

describe('contrarreloj recibe el tema y arranca con él', () => {
  const pantalla = leer('app/contrarreloj.tsx');

  it('lee area y tema de la URL', () => {
    expect(pantalla).toContain('useLocalSearchParams');
    expect(pantalla).toMatch(/tema\??:\s*string/);
  });

  it('arranca una sola vez por llegada', () => {
    /* Each round is generated and paid for. A re-render during the
       request would fire a second one, and the ref is what prevents
       it — `isPending` is not enough, it is false on the first tick. */
    expect(pantalla).toContain('yaArranco');
  });

  it('no arranca sin tema', () => {
    /* Opening /contrarreloj normally must still show the ladder. */
    expect(pantalla).toMatch(/!areaPedida \|\| !temaPedido/);
  });
});

describe('la petición manda el tema al servidor', () => {
  const peticiones = leer('features/contrarreloj/api/peticiones.ts');

  it('envía el tema dentro de custom, como lo espera el esquema', () => {
    expect(peticiones).toMatch(/custom:\s*\{[^}]*tema:/s);
  });

  it('sigue aceptando un modeId suelto', () => {
    /* The ladder screen passes one and must not change. */
    expect(peticiones).toContain("'modeId' in pedido");
  });
});
