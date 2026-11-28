import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * No photographs on a minor's profile.
 *
 * Diego asked for real photo upload and chose it when offered. This
 * is the reasoning that replaced it, written down so the decision is
 * revisited deliberately rather than by somebody adding an image
 * picker because it seemed like the obvious next step.
 *
 * A photograph of a 16-year-old, visible to a stranger who found them
 * by alias search, needs four things the drawn figures do not: a
 * place to store it, cropping, EXIF stripping so the file does not
 * publish the GPS coordinates of where they live, and a human reading
 * every upload before it goes live. The last one is not a feature —
 * it is a standing obligation, and the one that cannot be shipped and
 * forgotten.
 *
 * 24 figures and 8 colours is 192 avatars, every one of them already
 * inside the app. Nothing uploads, nothing stores, nothing needs
 * review, and the learner still gets «this profile is mine».
 *
 * If this test is ever deleted, the moderation obligation comes with
 * the feature that replaces it.
 */

const RAIZ = join(__dirname, '..', '..');

function archivos(dir: string, acc: string[] = []): string[] {
  for (const entrada of readdirSync(dir)) {
    if (entrada === 'node_modules') continue;
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) archivos(ruta, acc);
    else if (/\.tsx?$/.test(entrada) && !/\.test\.tsx?$/.test(entrada)) acc.push(ruta);
  }
  return acc;
}

describe('el avatar no es una foto', () => {
  it('nada abre la cámara ni la galería', () => {
    const malos: string[] = [];
    for (const archivo of archivos(RAIZ)) {
      const fuente = readFileSync(archivo, 'utf8');
      for (const senal of [
        'expo-image-picker',
        'launchImageLibraryAsync',
        'launchCameraAsync',
        'expo-camera',
        'react-native-image-crop-picker',
      ]) {
        if (fuente.includes(senal)) malos.push(`${archivo.replace(RAIZ, '')}: ${senal}`);
      }
    }

    expect(
      malos,
      'una foto de un menor visible por desconocidos necesita moderación previa, no solo un selector',
    ).toEqual([]);
  });

  it('el avatar no se sube a ninguna parte', () => {
    const malos: string[] = [];
    for (const archivo of archivos(RAIZ)) {
      const fuente = readFileSync(archivo, 'utf8');
      /* A multipart upload or a FormData body on any avatar route. */
      if (/avatar/i.test(fuente) && /FormData|multipart/i.test(fuente)) {
        malos.push(archivo.replace(RAIZ, ''));
      }
    }
    expect(malos).toEqual([]);
  });

  it('el avatar guardado es un slug, nunca una URL', () => {
    const esquemas = readFileSync(
      join(RAIZ, 'features', 'duelos', 'api', 'esquemas.ts'),
      'utf8',
    );

    const bloque = esquemas.slice(
      esquemas.indexOf('export const camposDeAvatar'),
      esquemas.indexOf('export const perfilDeDuelos'),
    );

    expect(bloque, 'camposDeAvatar ya no está donde esta guarda lo busca').toContain('avatar');
    expect(
      /url|uri|http/i.test(bloque),
      'el avatar pasó a ser una URL: eso es una imagen alojada, con todo lo que eso trae',
    ).toBe(false);
  });

  it('el selector no promete una foto', () => {
    const pantalla = readFileSync(join(RAIZ, 'app', 'avatar.tsx'), 'utf8');
    const sinComentarios = pantalla
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '');

    for (const palabra of ['foto', 'Foto', 'cámara', 'Cámara', 'galería', 'Galería']) {
      expect(
        sinComentarios.includes(palabra),
        `la pantalla dice «${palabra}»: ofrece algo que no hace`,
      ).toBe(false);
    }
  });
});
