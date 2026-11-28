import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DIVULGACION_USO_DE_APPS,
  PASOS_QUE_LEEN_DATOS,
  necesitaDivulgacion,
  yaConsintio,
} from './divulgacion';

/**
 * The disclosure Play requires before asking for app-usage access.
 *
 * Each case here is one sentence of the User Data policy. The
 * wording is the compliance surface: a screen that renders perfectly
 * and says the wrong thing fails review the same as no screen.
 */

describe('qué pasos necesitan divulgación', () => {
  it('usageAccess sí: lee qué app tienes abierta', () => {
    expect(necesitaDivulgacion('usageAccess')).toBe(true);
  });

  it('overlay no: dibujar encima no recoge nada', () => {
    /* «Cannot be included with other disclosures unrelated to
       personal and sensitive user data collection». A consent screen
       in front of a harmless permission also teaches the learner to
       tap past the one that matters. */
    expect(necesitaDivulgacion('overlay')).toBe(false);
  });

  it('notifications no: Android lo pide con su propio diálogo', () => {
    expect(necesitaDivulgacion('notifications')).toBe(false);
  });

  it('un paso desconocido no inventa una divulgación', () => {
    /* A new step from a module update must be added here
       deliberately. Defaulting to «needs disclosure» would show this
       text for something it does not describe, which is worse than
       not showing it. */
    expect(necesitaDivulgacion('algoNuevo')).toBe(false);
  });

  it('deviceAdmin no está en la lista: no se pide nunca', () => {
    expect(PASOS_QUE_LEEN_DATOS).not.toContain('deviceAdmin');
  });
});

describe('el consentimiento', () => {
  it('es por paso, no uno global', () => {
    expect(yaConsintio(['usageAccess'], 'usageAccess')).toBe(true);
    /* A future step that reads something else needs its own yes.
       One «ya dijo que sí» would silently cover it. */
    expect(yaConsintio(['usageAccess'], 'otroQueLee')).toBe(false);
  });

  it('sin nada guardado, nadie ha consentido', () => {
    expect(yaConsintio([], 'usageAccess')).toBe(false);
  });
});

describe('el texto cumple lo que Play pide', () => {
  const d = DIVULGACION_USO_DE_APPS;

  it('describe qué dato se lee', () => {
    /* «Must describe the data being accessed or collected» */
    expect(d.queRecogemos).toMatch(/qué app/i);
  });

  it('explica para qué se usa', () => {
    /* «Must explain how the data will be used and/or shared» */
    expect(d.queRecogemos).toMatch(/preguntas|bloquear/i);
  });

  it('dice que no sale del teléfono', () => {
    /* The load-bearing claim, and the one that keeps this out of the
       Data safety form. `el-uso-no-viaja.test.ts` keeps it true. */
    expect(d.aDondeVa).toMatch(/no.*(envi|sal)/i);
    expect(d.aDondeVa).toMatch(/teléfono|aparato|dispositivo/i);
  });

  it('el botón de aceptar dice qué va a pasar', () => {
    /* «Require affirmative user action». A bare «Aceptar» is consent
       to something the learner cannot picture. */
    expect(d.aceptar).toMatch(/ajustes/i);
  });

  it('hay una salida que no es aceptar', () => {
    expect(d.rechazar.length).toBeGreaterThan(0);
    expect(d.rechazar.toLowerCase()).not.toMatch(/acept|permit|continuar/);
  });

  it('no mete nada que no sea sobre este permiso', () => {
    /* «Cannot be included with other disclosures unrelated to
       personal and sensitive user data collection» — no terms, no
       privacy policy as a substitute, no sign-up. */
    const todo = [d.titulo, d.queRecogemos, d.aDondeVa, ...d.puntos].join(' ').toLowerCase();
    for (const ajeno of ['términos', 'condiciones', 'suscri', 'pago', 'cuenta', 'correo']) {
      expect(todo.includes(ajeno), `habla de «${ajeno}», que no es este permiso`).toBe(false);
    }
  });

  it('habla de tú, como el resto de la app', () => {
    const todo = [d.queRecogemos, d.aDondeVa, ...d.puntos].join(' ');
    expect(/\busted\b/i.test(todo), 'la app habla de tú').toBe(false);
  });
});

describe('el modal no acepta por descuido', () => {
  const FUENTE = readFileSync(
    join(__dirname, '..', 'components', 'ModalDivulgacion.tsx'),
    'utf8',
  );

  it('el botón atrás rechaza, no acepta', () => {
    /* «Must not interpret navigation away from the disclosure
       (including tapping away or pressing the back or home button)»
       as consent. */
    expect(/onRequestClose=\{onRechazar\}/.test(FUENTE)).toBe(true);
  });

  it('no hay temporizador que lo cierre solo', () => {
    /* «Must not use auto-dismissing or expiring messages as a means
       of obtaining user consent» */
    expect(/setTimeout|setInterval/.test(FUENTE)).toBe(false);
  });

  it('es pantalla completa, no una hoja con fondo tocable', () => {
    expect(/presentationStyle="fullScreen"/.test(FUENTE)).toBe(true);
  });
});

describe('el permiso no se pide sin consentir', () => {
  const HOOK = readFileSync(join(__dirname, '..', 'hooks', 'useBloqueo.ts'), 'utf8');

  it('pedirSiguiente consulta la divulgación antes de abrir Ajustes', () => {
    const desde = HOOK.indexOf('const pedirSiguiente');
    expect(desde).toBeGreaterThan(-1);
    const cuerpo = HOOK.slice(desde, HOOK.indexOf('const aceptarDivulgacion'));

    expect(/necesitaDivulgacion\(/.test(cuerpo)).toBe(true);
    expect(/yaConsintio\(/.test(cuerpo)).toBe(true);
  });

  it('rechazar no guarda consentimiento', () => {
    const desde = HOOK.indexOf('const rechazarDivulgacion');
    expect(desde).toBeGreaterThan(-1);
    const cuerpo = HOOK.slice(desde, desde + 300);

    expect(
      /guardarPermisosConsentidos|setConsentidos/.test(cuerpo),
      'rechazar registró algo: la próxima vez no vería la divulgación',
    ).toBe(false);
  });
});
