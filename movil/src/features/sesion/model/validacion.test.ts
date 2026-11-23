import { describe, expect, it } from 'vitest';
import { tieneErrores, validarRegistro } from './validacion';

describe('validar el registro', () => {
  it('pide lo que falta, no dice "inválido"', () => {
    // A message that names the fix is the only kind worth showing.
    expect(validarRegistro('', '').email).toBe('Escribe tu correo.');
    expect(validarRegistro('a@b.co', '').password).toBe('Escribe una contraseña.');
  });

  it('rechaza una contraseña corta diciendo cuánto falta', () => {
    expect(validarRegistro('a@b.co', 'corta').password).toMatch(/8 caracteres/);
  });

  it('acepta un correo normal', () => {
    expect(tieneErrores(validarRegistro('diego@ejemplo.com', 'unaClaveLarga'))).toBe(false);
  });

  it('no rechaza correos reales por ser estricto de más', () => {
    /* A stricter pattern costs signups to prevent typos. Addresses
       with plus-tags and subdomains are ordinary and must pass. */
    expect(tieneErrores(validarRegistro('nombre+icfes@mail.ejemplo.co', 'unaClaveLarga'))).toBe(
      false,
    );
  });

  it('ignora espacios alrededor del correo', () => {
    // Phone keyboards add a trailing space after autocomplete.
    expect(tieneErrores(validarRegistro('  diego@ejemplo.com  ', 'unaClaveLarga'))).toBe(false);
  });
});
