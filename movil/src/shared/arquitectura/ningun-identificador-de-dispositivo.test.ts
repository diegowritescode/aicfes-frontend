import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * No persistent device identifier ever leaves this phone.
 *
 * Google Play's Families policy, verbatim: apps that target both
 * children and older audiences «must not transmit AAID, SIM Serial,
 * Build Serial, BSSID, MAC, SSID, IMEI, and/or IMSI from children or
 * users of unknown age».
 *
 * Two details make this sharper than it looks:
 *
 * 1. **«Users of unknown age» is everyone**, until something
 *    establishes otherwise. The app has no age field, so the strictest
 *    reading applies to every single user, always. There is no
 *    scenario where sending one of these is allowed.
 * 2. It is a transmission ban, not a collection ban. Reading an
 *    identifier locally is permitted; putting it in a request is not.
 *
 * Today the app satisfies it by never touching one. `src` contains no
 * `expo-device`, no `expo-application`, no `getAndroidId`. The only
 * header added to every request is `X-Cliente: movil`.
 *
 * That is a property worth pinning rather than re-auditing, because
 * the ways it breaks are all ordinary-looking: a crash reporter added
 * for good reasons, a `deviceId` field in an analytics event, a
 * «which device is this?» header for debugging a sync bug. Each one
 * is a sensible engineering decision and a policy violation.
 *
 * It greps rather than importing: the failure is a line of code
 * existing anywhere in `src`, which no runtime assertion can see.
 */

const SRC = join(__dirname, '..', '..');

/** Every `.ts`/`.tsx` under `src`, excluding tests — including this one. */
function fuentes(dir: string): string[] {
  const salida: string[] = [];
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) {
      salida.push(...fuentes(ruta));
      continue;
    }
    if (!/\.tsx?$/.test(entrada)) continue;
    if (/\.test\.tsx?$/.test(entrada)) continue;
    salida.push(ruta);
  }
  return salida;
}

/* Comments discuss these names — this file's own docblock names all
   nine — and a guard that trips on its own documentation teaches
   people to delete the documentation. */
function sinComentarios(codigo: string): string {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

const archivos = fuentes(SRC).map((ruta) => ({
  ruta: ruta.slice(SRC.length + 1),
  codigo: sinComentarios(readFileSync(ruta, 'utf8')),
}));

describe('ningún identificador de dispositivo', () => {
  it('no se importa una librería que los lea', () => {
    /* `expo-device` and `expo-application` are the two that hand over
       a persistent identifier in this stack. Neither is a dependency
       today; this fails the moment one is imported, which is before
       anybody has written the line that transmits it. */
    const PROHIBIDAS = ['expo-device', 'expo-application', 'react-native-device-info'];

    for (const { ruta, codigo } of archivos) {
      for (const libreria of PROHIBIDAS) {
        expect(
          codigo.includes(`'${libreria}'`) || codigo.includes(`"${libreria}"`),
          `${ruta} importa ${libreria}: Play prohíbe transmitir identificadores de un menor o de edad desconocida`,
        ).toBe(false);
      }
    }
  });

  it('no se nombra ninguno de los nueve identificadores que Play prohíbe', () => {
    /* The policy's own list. Spelled as identifier-ish patterns so a
       field name catches as well as an API call: `deviceId` in a
       request body is the realistic failure, not a call to
       `getImei()`. */
    const PATRONES: ReadonlyArray<readonly [string, RegExp]> = [
      ['AAID / advertising id', /advertisingId|getAdvertisingId|AdvertisingId|AD_ID/],
      ['android id', /getAndroidId|androidId|ANDROID_ID/],
      ['IMEI / IMSI', /\bimei\b|\bimsi\b/i],
      ['MAC / BSSID / SSID', /\bbssid\b|\bssid\b|macAddress|getMacAddress/i],
      ['SIM / build serial', /simSerial|getSerial\b|buildSerial/i],
      ['identificador de dispositivo', /deviceId|device_id|installationId|idForVendor/],
    ];

    for (const { ruta, codigo } of archivos) {
      for (const [nombre, patron] of PATRONES) {
        expect(
          patron.test(codigo),
          `${ruta} nombra ${nombre}, que Play prohíbe transmitir`,
        ).toBe(false);
      }
    }
  });

  it('netinfo se usa sin leer la red a la que está conectado', () => {
    /* `netinfo` brings `ACCESS_WIFI_STATE`, and its `details` object
       carries `ssid` and `bssid` on Android — two of the nine. The
       hook reads `isConnected` and `isInternetReachable` and nothing
       else, which is why the permission is harmless here. */
    const hook = sinComentarios(
      readFileSync(join(SRC, 'shared', 'conexion', 'useConexion.ts'), 'utf8'),
    );

    expect(hook).toContain('isInternetReachable');
    expect(
      /\.details|ssid|bssid/i.test(hook),
      'useConexion empezó a leer los detalles de la red: ahí viven SSID y BSSID',
    ).toBe(false);
  });

  it('la única cabecera que se añade a toda petición es X-Cliente', () => {
    /* The place a device identifier would most naturally be added —
       one line, every request, invisible at the call sites. */
    const plataforma = sinComentarios(
      readFileSync(join(SRC, 'core', 'http', 'model', 'plataforma.ts'), 'utf8'),
    );

    const cabeceras = plataforma.match(/'X-[^']+'/g) ?? [];
    expect(
      cabeceras,
      'apareció otra cabecera global: revisar que no identifique el aparato',
    ).toEqual(["'X-Cliente'"]);
  });

  it('no hay SDK de analítica ni de reporte de fallos', () => {
    /* The realistic path to a violation. A crash reporter sends a
       device identifier by default, and the Data safety form would
       become false the day one is installed without being declared.
       Reads package.json so adding the dependency fails, not the
       first line that uses it. */
    const paquete = JSON.parse(
      readFileSync(join(SRC, '..', 'package.json'), 'utf8'),
    ) as { dependencies?: Record<string, string> };

    const sospechosos = Object.keys(paquete.dependencies ?? {}).filter((nombre) =>
      /sentry|bugsnag|firebase\/analytics|amplitude|mixpanel|posthog|segment|appsflyer|adjust/i.test(
        nombre,
      ),
    );

    expect(
      sospechosos,
      'se instaló un SDK que transmite identificadores: hay que declararlo en Data safety y revisar la regla de menores',
    ).toEqual([]);
  });
});
