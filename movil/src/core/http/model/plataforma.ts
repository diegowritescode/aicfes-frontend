/**
 * Whether this build runs in a browser.
 *
 * It asks the environment instead of importing `Platform` from
 * react-native, and that is the whole point: a module that imports
 * react-native cannot be parsed by Node, so anything that imports it
 * loses its tests. The HTTP client has thirteen of them.
 *
 * `document` is the honest question here. React Native has no DOM, and
 * react-native-web runs in a real browser where `document` exists. No
 * bundler flag or build-time constant is needed, and it is correct in
 * Jest, in Vitest and on a device.
 */
export function esNavegador(): boolean {
  return typeof document !== 'undefined' && typeof document.createElement === 'function';
}

/**
 * The headers every request carries, beyond its own.
 *
 * A native client declares itself so the server returns the refresh
 * token in the body: there is no cookie jar it could keep a Set-Cookie
 * in. A browser says nothing, because its refresh token belongs in an
 * httpOnly cookie where JavaScript cannot read it.
 */
export function cabecerasDeCliente(): Record<string, string> {
  return esNavegador() ? {} : { 'X-Cliente': 'movil' };
}
