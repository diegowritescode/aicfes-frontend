import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PASOS_PROHIBIDOS, aLegible, permitidos, type PasoNativo } from './permisos';

/**
 * The one thing that gets an app removed from Google Play.
 *
 * Blocking ACCESS to an app is allowed. Preventing UNINSTALL is not,
 * except when "authorized by a parent or guardian through a parental
 * control app or by authorized administrators through enterprise
 * management software". AICFES is a learner restricting themselves —
 * no exception covers it.
 *
 * `expo-screen-time` declares a device-admin receiver whose own
 * manifest comment says an active admin "must be deactivated before
 * the app can be uninstalled". It ships enabled by default: the
 * plugin turns on every Android feature when `features` is absent,
 * and `appRemovalProtection` is one of them. It WAS in the v19 APK.
 *
 * Two layers guard it and this file tests both.
 */

describe('el paso de device admin no existe para esta app', () => {
  it('está en la lista de prohibidos', () => {
    expect(PASOS_PROHIBIDOS).toContain('deviceAdmin');
  });

  it('`permitidos` lo saca aunque el módulo lo reporte', () => {
    const crudos: PasoNativo[] = [
      { id: 'overlay', status: 'granted', required: true },
      { id: 'deviceAdmin', status: 'undetermined', required: false },
      { id: 'usageAccess', status: 'undetermined', required: true },
    ];

    const ids = permitidos(crudos).map((p) => p.id);
    expect(ids).toEqual(['overlay', 'usageAccess']);
  });

  it('lo saca incluso si el módulo lo marcara como requerido', () => {
    /* A module update could flip `required`. The filter must not care
       — a required step the app refuses to ask for is a bug to find
       at build time, not a permission to request from a minor. */
    const crudos: PasoNativo[] = [
      { id: 'deviceAdmin', status: 'undetermined', required: true },
    ];
    expect(permitidos(crudos)).toEqual([]);
  });

  it('no queda texto que se lo ofrezca al estudiante', () => {
    const fuente = readFileSync(join(__dirname, 'permisos.ts'), 'utf8');
    const sinComentarios = fuente
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '');

    /* The old label was «Evitar que la cierren a la fuerza /
       Opcional. Hace más difícil saltarse el bloqueo». Friendly, and
       an invitation to do the one forbidden thing. */
    expect(
      /Evitar que la cierren/.test(sinComentarios),
      'volvió el texto que ofrece device admin',
    ).toBe(false);
  });

  it('un paso desconocido sí pasa: la lista es una negación, no un permiso', () => {
    /* The filter must not become an allow-list. A new recommended
       step from a module update should reach the learner; only the
       named one is refused. */
    const nuevo: PasoNativo[] = [{ id: 'algoNuevo', status: 'undetermined', required: false }];
    expect(permitidos(nuevo)).toHaveLength(1);
    expect(aLegible(nuevo[0]!).nombre).toBe('algoNuevo');
  });
});

describe('el manifest no trae el receptor', () => {
  it('app.json declara las features y deja fuera appRemovalProtection', () => {
    const app = JSON.parse(
      readFileSync(join(__dirname, '..', '..', '..', '..', 'app.json'), 'utf8'),
    );

    const android = app?.expo?.extra?.expoScreenTime?.android;
    expect(android, 'sin esta clave el plugin activa TODAS las features').toBeTruthy();

    expect(Array.isArray(android.features)).toBe(true);
    expect(
      android.features,
      'appRemovalProtection mete el receptor de device admin en el manifest',
    ).not.toContain('appRemovalProtection');

    /* Blocking is the product. Without it the plugin strips the
       shield and the overlay permission, and the toll blocks nothing. */
    expect(android.features).toContain('blocking');
  });

  it('el plugin de remoción corre DESPUÉS del de expo-screen-time', () => {
    const app = JSON.parse(
      readFileSync(join(__dirname, '..', '..', '..', '..', 'app.json'), 'utf8'),
    );
    const nombres: string[] = app.expo.plugins.map((x: unknown) =>
      typeof x === 'string' ? x : (x as string[])[0],
    );

    const mio = nombres.indexOf('./plugins/sin-lo-que-no-usamos');
    const libreria = nombres.indexOf('expo-screen-time');

    expect(mio, 'falta ./plugins/sin-lo-que-no-usamos en app.json').toBeGreaterThan(-1);
    expect(libreria).toBeGreaterThan(-1);

    /* Expo applies mods in REVERSE registration order, so running
       last means being registered first. This is not a style choice:
       registered after `expo-screen-time`, the library's mod runs
       last and deletes our removal node, because its gate for the
       receiver is satisfied by `blocking` and it treats the element
       as needed. The prebuilt manifest then looks untouched and
       nothing reports a problem. */
    expect(
      mio,
      'registrado después de expo-screen-time: su mod borrará el nodo de remoción',
    ).toBeLessThan(libreria);
  });

  it('el motor de accesibilidad sigue apagado', () => {
    const app = JSON.parse(
      readFileSync(join(__dirname, '..', '..', '..', '..', 'app.json'), 'utf8'),
    );

    /* Turning it on changes the Play review: a permissions form, a
       demo video with seven required points, a prominent-disclosure
       screen, and "up to several weeks". Google also asks for "more
       narrowly scoped APIs in lieu of the Accessibility API when
       possible" — UsageStats + overlay IS that alternative. */
    expect(app.expo.extra.expoScreenTime.android.accessibilityEngine).toBe(false);
  });
});
