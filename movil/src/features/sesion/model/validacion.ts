/**
 * What a sign-up form accepts, checked before it costs a request.
 *
 * The messages are the point. "Invalid input" tells someone they are
 * wrong; "La contraseña necesita al menos 8 caracteres" tells them
 * what to do next, which is the only version worth showing.
 */

export interface ErroresRegistro {
  email?: string;
  password?: string;
}

export function validarRegistro(email: string, password: string): ErroresRegistro {
  const errores: ErroresRegistro = {};

  const limpio = email.trim();
  if (!limpio) errores.email = 'Escriba su correo.';
  /* Deliberately loose: the only authority on whether an address
     works is the server, and a stricter pattern rejects real
     addresses — which costs a signup to prevent a typo. */
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio)) {
    errores.email = 'Ese correo no se ve completo.';
  }

  if (!password) errores.password = 'Escriba una contraseña.';
  else if (password.length < 8) {
    errores.password = 'La contraseña necesita al menos 8 caracteres.';
  }

  return errores;
}

export function tieneErrores(errores: ErroresRegistro): boolean {
  return Object.keys(errores).length > 0;
}
