import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * The layering, enforced rather than documented.
 *
 * A rule in a README is a rule until the first deadline. These checks
 * fail the build instead, which is the only version that survives.
 *
 * Writing this found six real violations: the time trial had reached
 * into the exam feature for schemas, rules and components that were
 * never the exam's to own. They moved to shared/pregunta, where the
 * sitting, training and the time trial can all use them.
 */

const RAIZ = path.resolve(new URL('../..', import.meta.url).pathname);

/**
 * Composition, not coupling: training opens the tutoring panel, which
 * is the feature doing its job. Listed here so it is a decision
 * someone made rather than a rule that quietly rotted.
 */
const EXCEPCIONES = new Set(['examen -> tutoria']);

function archivos(dir: string): string[] {
  const salida: string[] = [];
  for (const entrada of readdirSync(dir)) {
    const completo = path.join(dir, entrada);
    if (statSync(completo).isDirectory()) salida.push(...archivos(completo));
    else if (/\.tsx?$/.test(entrada)) salida.push(completo);
  }
  return salida;
}

function importaciones(archivo: string): string[] {
  const texto = readFileSync(archivo, 'utf-8');
  return [...texto.matchAll(/from '(@\/[^']+)'/g)].map((m) => m[1]!);
}

describe('las capas', () => {
  it('una feature no importa de otra feature', () => {
    const malas: string[] = [];
    for (const archivo of archivos(path.join(RAIZ, 'features'))) {
      const propia = path.relative(path.join(RAIZ, 'features'), archivo).split(path.sep)[0]!;
      for (const imp of importaciones(archivo)) {
        const otra = imp.match(/^@\/features\/([^/]+)\//)?.[1];
        if (otra && otra !== propia && !EXCEPCIONES.has(`${propia} -> ${otra}`)) {
          malas.push(`${propia} -> ${otra} (${path.basename(archivo)})`);
        }
      }
    }
    expect(malas).toEqual([]);
  });

  it('core no sabe nada de features ni de shared', () => {
    // core is the floor. If it reaches upward there is no floor.
    const malas: string[] = [];
    for (const archivo of archivos(path.join(RAIZ, 'core'))) {
      for (const imp of importaciones(archivo)) {
        if (imp.startsWith('@/features/') || imp.startsWith('@/shared/')) {
          malas.push(`${path.basename(archivo)} -> ${imp}`);
        }
      }
    }
    expect(malas).toEqual([]);
  });

  it('shared no importa de features', () => {
    const malas: string[] = [];
    for (const archivo of archivos(path.join(RAIZ, 'shared'))) {
      for (const imp of importaciones(archivo)) {
        if (imp.startsWith('@/features/')) malas.push(`${path.basename(archivo)} -> ${imp}`);
      }
    }
    expect(malas).toEqual([]);
  });
});
