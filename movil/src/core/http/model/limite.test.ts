import { describe, expect, it } from 'vitest';
import { limiteDe } from './limite';

/**
 * The deadline is a contract with the server, not a round number.
 *
 * The server gives a model up to 180s (OPENAI_TIMEOUT_MS). A client
 * deadline below that guarantees the phone abandons work the server is
 * still doing — and still paying for. These tests pin the relationship,
 * because the two numbers live in different repositories and nothing
 * else connects them.
 */

/** What the backend allows the model, from openai.service.ts. */
const LIMITE_DEL_SERVIDOR = 180_000;

describe('las rutas que esperan un modelo', () => {
  it.each([
    '/api/items/generate',
    '/api/items/generate-mixed',
    '/api/feedback/generate',
    /* Tutoring calls a model as well. Omitting it was a real defect in
       the first version of this list: the tutor aborted at 30s. */
    '/api/tutoria/abc123/defensa',
    '/api/tutoria/abc123/mensaje',
  ])('%s espera más que el servidor', (ruta) => {
    expect(limiteDe(ruta)).toBeGreaterThan(LIMITE_DEL_SERVIDOR);
  });

  it('cubre toda la tutoría por prefijo, con itemId variable', () => {
    /* The route carries an id, so an exact-match list could never
       cover it. This is why `limiteDe` compares prefixes. */
    for (const id of ['abc', '00000000-0000-0000-0000-000000000000', '1']) {
      expect(limiteDe(`/api/tutoria/${id}/defensa`)).toBeGreaterThan(LIMITE_DEL_SERVIDOR);
    }
  });

  it('un límite por debajo del servidor sería el defecto que esto arregla', () => {
    /* With the old single 30s deadline, generating five questions
       aborted every time: the server had barely started. The failure
       then read "sin conexión", which sent the learner to check a
       connection that was fine. */
    const limiteViejo = 30_000;
    expect(limiteViejo).toBeLessThan(LIMITE_DEL_SERVIDOR);
    expect(limiteDe('/api/items/generate')).not.toBe(limiteViejo);
  });
});

describe('las rutas normales siguen siendo cortas', () => {
  it.each(['/api/dashboard', '/api/auth/login', '/api/error-del-dia', '/api/answers'])(
    '%s no hereda el límite largo',
    (ruta) => {
      expect(limiteDe(ruta)).toBe(30_000);
    },
  );

  it('una ruta nueva es rápida por omisión', () => {
    // Declaring itself slow has to be deliberate: a new endpoint that
    // hangs should fail fast and be noticed, not wait three minutes.
    expect(limiteDe('/api/algo-que-no-existe-todavia')).toBe(30_000);
  });
});

describe('el prefijo, no la igualdad', () => {
  it('una ruta con parámetros sigue siendo lenta', () => {
    // `/api/items/generate?debug=1` is the same work as the bare path.
    expect(limiteDe('/api/items/generate?n=5')).toBeGreaterThan(LIMITE_DEL_SERVIDOR);
  });

  it('una ruta que apenas se parece no cuela', () => {
    expect(limiteDe('/api/items/bank/stats')).toBe(30_000);
  });
});
