import { describe, expect, it } from 'vitest';
import { debePersistir, edadMaximaDe, estaVencido } from './persistencia';

/**
 * What gets written to the device.
 *
 * Two kinds of mistake live here and both are quiet. Persisting too
 * little leaves the app blank on a bus, which is what it does today.
 * Persisting the wrong thing writes a token to plain JSON, or lets a
 * learner resume a sitting whose clock ran out.
 */

describe('lo que vale guardar', () => {
  it.each(['panel', 'logros', 'error-del-dia', 'lote-offline'])(
    '%s se guarda',
    (clave) => {
      expect(debePersistir([clave])).toBe(true);
    },
  );

  it('una consulta nueva no se guarda por accidente', () => {
    /* The list is explicit so that adding a query is not the same as
       deciding it belongs on disk. */
    expect(debePersistir(['algo-que-no-existe-todavia'])).toBe(false);
  });

  it('la clave con parámetros sigue decidiéndose por su raíz', () => {
    expect(debePersistir(['panel', 'u1'])).toBe(true);
    expect(debePersistir(['lote-offline', 'MAT', 10])).toBe(true);
  });
});

describe('lo que NO puede tocar el disco', () => {
  it('la sesión jamás', () => {
    /* It holds a token. expo-secure-store is encrypted by the OS; the
       react-query cache is plain JSON that anything with filesystem
       access on a rooted device can read. */
    expect(debePersistir(['sesion'])).toBe(false);
  });

  it('un simulacro en curso jamás', () => {
    // Its clock is the server's. A persisted copy lets a learner
    // resume a sitting whose time ran out.
    expect(debePersistir(['simulacro'])).toBe(false);
    expect(debePersistir(['simulacro', 'abc123'])).toBe(false);
  });

  it('una conversación con el tutor jamás', () => {
    expect(debePersistir(['tutoria', 'item-1'])).toBe(false);
  });

  it('una clave que no es texto no se guarda', () => {
    // A malformed key must not fall through to a default that writes.
    for (const mala of [[], [undefined], [null], [42], [{}]]) {
      expect(debePersistir(mala as readonly unknown[])).toBe(false);
    }
  });
});

describe('cuándo lo guardado deja de servir', () => {
  const AHORA = new Date('2026-11-22T12:00:00.000Z').getTime();
  const DIA = 24 * 60 * 60 * 1000;

  it('el panel aguanta una semana', () => {
    expect(estaVencido(['panel'], AHORA - 6 * DIA, AHORA)).toBe(false);
    expect(estaVencido(['panel'], AHORA - 8 * DIA, AHORA)).toBe(true);
  });

  it('la pregunta de hoy caduca en un día, porque el nombre lo promete', () => {
    /* "Tu pregunta de hoy" showing last Tuesday's question is a lie the
       learner spots immediately. */
    expect(estaVencido(['error-del-dia'], AHORA - 2 * 60 * 60 * 1000, AHORA)).toBe(false);
    expect(estaVencido(['error-del-dia'], AHORA - 2 * DIA, AHORA)).toBe(true);
  });

  it('las preguntas guardadas no se pasan', () => {
    // A pool downloaded a month ago is as good as one downloaded
    // today, and re-downloading it is what costs data.
    expect(estaVencido(['lote-offline'], AHORA - 30 * DIA, AHORA)).toBe(false);
    expect(edadMaximaDe(['lote-offline'])).toBeGreaterThan(edadMaximaDe(['panel']));
  });

  it('una clave sin política declarada caduca pronto, no tarde', () => {
    // Being wrong toward "too old" costs a refetch. The other
    // direction shows the learner something false.
    expect(edadMaximaDe(['lo-que-sea'])).toBe(DIA);
  });
});
