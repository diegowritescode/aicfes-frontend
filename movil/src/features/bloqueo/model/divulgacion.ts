/**
 * What the learner is told before the app asks to read app usage.
 *
 * Google Play's User Data policy requires an in-app disclosure
 * «immediately preceded by» the permission request — not on launch,
 * not in the listing, not in the privacy policy. Its words, which
 * this screen has to satisfy one by one:
 *
 * - «Must be within the app itself, not only in the app description
 *   or on a website»
 * - «Must be displayed in the normal usage of the app and not require
 *   the user to navigate into a menu or settings»
 * - «Must describe the data being accessed or collected»
 * - «Must explain how the data will be used and/or shared»
 * - «Cannot only be placed in a privacy policy or terms of service»
 * - «Cannot be included with other disclosures unrelated to personal
 *   and sensitive user data collection»
 *
 * And the consent: affirmative action, no auto-dismiss, and
 * navigating away (back, home, tapping outside) is NOT consent.
 *
 * Google even gives the sentence shape: «[This app] collects/
 * transmits/syncs/stores [type of data] to enable ['feature'], [in
 * what scenario].» The copy below is that shape in Spanish, for a
 * 16-year-old.
 *
 * Pure, so the wording is testable without a renderer. The wording
 * IS the compliance surface: a screen that renders correctly and
 * says the wrong thing fails review just the same.
 */

/**
 * The steps that read data about the learner, and therefore need the
 * disclosure before they are requested.
 *
 * `overlay` is not here: drawing on top of another app collects
 * nothing. `notifications` is not here either — Android asks for it
 * with its own system dialog and it reads nothing.
 *
 * `usageAccess` is the whole list today. It is the one that lets the
 * app see which app is in the foreground, which is personal data
 * about what the learner does on their phone.
 */
export const PASOS_QUE_LEEN_DATOS: readonly string[] = ['usageAccess'];

export function necesitaDivulgacion(pasoId: string): boolean {
  return PASOS_QUE_LEEN_DATOS.includes(pasoId);
}

export interface Divulgacion {
  readonly titulo: string;
  /** The sentence Google's template asks for: what, for what, when. */
  readonly queRecogemos: string;
  /** Where it goes. The honest answer here is «nowhere». */
  readonly aDondeVa: string;
  readonly puntos: readonly string[];
  readonly aceptar: string;
  readonly rechazar: string;
}

/**
 * The disclosure for app usage.
 *
 * «No sale de tu teléfono» is the load-bearing line and it is true:
 * nothing in `features/bloqueo` makes a request, which
 * `el-uso-no-viaja.test.ts` enforces. If that ever stops being true
 * this text becomes a lie to a minor and a false Data safety form,
 * in that order of importance.
 */
export const DIVULGACION_USO_DE_APPS: Divulgacion = {
  titulo: 'Antes de darnos este permiso',
  queRecogemos:
    'AICFES necesita ver qué app tienes abierta, para poner las preguntas encima cuando abras una de las que escogiste bloquear.',
  aDondeVa:
    'Eso se queda en tu teléfono. No lo enviamos a ningún servidor, no lo guardamos fuera del aparato y nadie más lo ve.',
  puntos: [
    'Solo miramos cuál app está adelante, no lo que haces dentro.',
    'Tú escoges qué apps se bloquean, en una pantalla de Android.',
    'Puedes quitar el permiso cuando quieras desde Ajustes.',
  ],
  /* A verb that says what happens next. «Aceptar» alone would be
     consent to something the learner cannot picture. */
  aceptar: 'Entiendo, ir a Ajustes',
  rechazar: 'Ahora no',
};

/**
 * Whether this learner has already agreed, for this permission.
 *
 * Kept per step rather than as one flag: a future step that reads
 * something else needs its own consent, and one «ya dijo que sí»
 * would silently cover it.
 *
 * Consent is not permanent state we can assume. It is re-asked
 * whenever the permission is not granted, because a learner who
 * revoked it in Settings has withdrawn exactly what they agreed to.
 */
export function yaConsintio(
  consentidos: readonly string[],
  pasoId: string,
): boolean {
  return consentidos.includes(pasoId);
}
