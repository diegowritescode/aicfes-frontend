import { afterEach, describe, expect, it, vi } from 'vitest';
import { cabecerasDeCliente, esNavegador } from './plataforma';

/**
 * Which client the server thinks it is talking to.
 *
 * The consequence of getting this wrong is quiet in both directions:
 * a browser that claims to be native receives a refresh token in a
 * place JavaScript can read, and a phone that claims to be a browser
 * receives none at all and silently stops renewing its session.
 */

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('detectar el navegador', () => {
  /* The suite runs in plain Node, with no DOM — which is the same
     shape a phone has. Both environments are stubbed explicitly
     rather than inferred from wherever the tests happen to run. */

  it('con un DOM de verdad, es navegador', () => {
    vi.stubGlobal('document', { createElement: () => ({}) });
    expect(esNavegador()).toBe(true);
    expect(cabecerasDeCliente()).toEqual({});
  });

  it('sin DOM, es cliente nativo', () => {
    /* React Native has no document. This is the case on a real phone,
       and it is the one that decides whether the session can renew. */
    vi.stubGlobal('document', undefined);
    expect(esNavegador()).toBe(false);
    expect(cabecerasDeCliente()).toEqual({ 'X-Cliente': 'movil' });
  });

  it('el entorno de pruebas es nativo, como un teléfono', () => {
    // No stub: this is Node, which has no DOM, same as the device.
    expect(esNavegador()).toBe(false);
  });

  it('un `document` a medias no cuenta como navegador', () => {
    // Some environments define a stub object with no DOM methods.
    // Treating that as a browser would cost the phone its refresh token.
    vi.stubGlobal('document', {});
    expect(esNavegador()).toBe(false);
  });
});
