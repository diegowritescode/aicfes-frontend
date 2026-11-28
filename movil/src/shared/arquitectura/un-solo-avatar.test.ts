import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * One Avatar, and a row that opens what its avatar stands for.
 *
 * Two failures on the same screen produced these, and both were mine.
 *
 * The first: I wrote a second `Avatar` in `features/perfil` without
 * looking for the one that already existed in `shared/ui/atomos`. Four
 * screens already used that one. Mine was a circle where the original
 * was a rounded square on purpose — the design is built on 12–20px
 * radii — and it announced itself to a screen reader beside a name it
 * already read aloud.
 *
 * The second: Diego tapped Sofía's initials on the friends list and
 * nothing happened. The press was on the button below, and the tile
 * with somebody's initials in it was a plain `View`. A circle with a
 * person's letters in it reads as the thing you tap to see that
 * person.
 */

const RAIZ = join(__dirname, '..', '..');

function archivos(dir: string, acc: string[] = []): string[] {
  for (const entrada of readdirSync(dir)) {
    if (entrada === 'node_modules') continue;
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) archivos(ruta, acc);
    else if (/\.tsx$/.test(entrada)) acc.push(ruta);
  }
  return acc;
}

describe('un solo Avatar', () => {
  it('no hay un segundo componente Avatar fuera de shared/ui', () => {
    const duplicados = archivos(RAIZ)
      .filter((f) => /Avatar\.tsx$/.test(f))
      .filter((f) => !f.includes(join('shared', 'ui', 'atomos')));

    expect(
      duplicados,
      'un segundo Avatar: cuatro pantallas ya usan el de shared/ui/atomos',
    ).toEqual([]);
  });

  it('nadie importa un Avatar que no sea el de shared/ui', () => {
    const malos = archivos(RAIZ).filter((f) => {
      const fuente = readFileSync(f, 'utf8');
      /* An import of something named Avatar from anywhere that is
         not the shared barrel or the atom itself.

         `../atomos/Avatar` is allowed too: a molecule inside
         `shared/ui` cannot import from the barrel it is part of —
         that is a cycle — so it reaches the atom by relative path.
         `CabeceraDePerfil` is the first molecule to need the avatar,
         and the first version of this test failed it for doing the
         only correct thing available. */
      return /import\s+\{[^}]*\bAvatar\b[^}]*\}\s+from\s+'(?!@\/shared\/ui'|\.\/Avatar'|\.\.\/atomos\/Avatar')/.test(
        fuente,
      );
    });

    expect(malos.map((f) => f.replace(RAIZ, ''))).toEqual([]);
  });
});

describe('la fila de un amigo se abre al tocarla', () => {
  const FUENTE = readFileSync(join(RAIZ, 'app', 'amigos.tsx'), 'utf8');

  /** `FilaDeAmigo` only, so the rest of the screen cannot answer for it. */
  function fila(): string {
    const desde = FUENTE.indexOf('function FilaDeAmigo(');
    expect(desde, 'FilaDeAmigo ya no se llama así').toBeGreaterThan(-1);
    const resto = FUENTE.slice(desde);
    const hasta = resto.indexOf('\nfunction ');
    const cuerpo = hasta === -1 ? resto : resto.slice(0, hasta);
    /* Comments go: the one explaining this bug names the bug. */
    return cuerpo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  }

  it('toda la fila es tocable, no solo un botón dentro', () => {
    const cuerpo = fila();

    expect(
      /Pressable/.test(cuerpo),
      'la fila volvió a no ser tocable: tocar el avatar no hace nada y nada avisa',
    ).toBe(true);
    expect(/onPress=\{alAbrir\}/.test(cuerpo)).toBe(true);
  });

  it('el Pressable se anuncia como control y dice de quién', () => {
    const cuerpo = fila();

    expect(/accessibilityRole="button"/.test(cuerpo)).toBe(true);
    expect(
      /accessibilityLabel=/.test(cuerpo),
      'sin etiqueta, un lector de pantalla anuncia «botón» y nada más',
    ).toBe(true);
  });

  it('no hay un Boton dentro del Pressable', () => {
    const cuerpo = fila();

    expect(
      /<Boton/.test(cuerpo),
      'un control dentro de un control: dos objetivos de toque sobre la misma área',
    ).toBe(false);
  });
});

describe('una solicitud enviada dice por qué no se abre', () => {
  const FUENTE = readFileSync(join(RAIZ, 'app', 'amigos.tsx'), 'utf8');

  function cuerpo(nombre: string): string {
    const desde = FUENTE.indexOf(`function ${nombre}(`);
    expect(desde, `${nombre} ya no se llama así`).toBeGreaterThan(-1);
    const resto = FUENTE.slice(desde);
    const hasta = resto.indexOf('\nfunction ');
    const trozo = hasta === -1 ? resto : resto.slice(0, hasta);
    return trozo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  }

  /* Diego tapped a pending request expecting a profile. It looked
     like the rows above it, which open. The server refuses a profile
     without an accepted friendship — correctly, since one readable
     before the other person agrees turns a request into a way to
     look at their account — so the row has to say so itself. */
  it('la pantalla dice cuándo se podrá ver el perfil', () => {
    expect(
      /Podrás ver su perfil cuando acepten/.test(FUENTE),
      'sin esa frase, una solicitud pendiente parece una fila que se abre y no hace nada',
    ).toBe(true);
  });

  it('la fila enviada no es tocable: no hay perfil que abrir', () => {
    expect(
      /Pressable/.test(cuerpo('FilaEnviada')),
      'tocable sin destino: el servidor rechaza el perfil sin amistad aceptada',
    ).toBe(false);
  });

  it('se puede cancelar una solicitud enviada', () => {
    expect(
      /alCancelar/.test(cuerpo('FilaEnviada')),
      'una solicitud sin salida es una fila muerta que el estudiante carga para siempre',
    ).toBe(true);
  });
});

describe('el color del avatar llega a existir', () => {
  /* Three files have to agree: the palette in `tokens.ts`, the
     classes Tailwind generates from it, and the class names written
     out in `Avatar.tsx`. NativeWind compiles what it can see, so a
     name that exists in only two of the three paints nothing — and an
     unpainted tile looks like a style choice, not a bug. */
  it('hay una clase escrita por cada color de la paleta', () => {
    const tokens = readFileSync(join(RAIZ, 'shared', 'ui', 'tokens.ts'), 'utf8');
    const paleta = tokens.slice(tokens.indexOf('export const colorAvatar'));
    const cuantos = (paleta.slice(0, paleta.indexOf('] as const')).match(/#[0-9A-Fa-f]{6}/g) ?? [])
      .length;

    expect(cuantos, 'la paleta de avatares quedó vacía').toBeGreaterThan(0);

    const componente = readFileSync(
      join(RAIZ, 'shared', 'ui', 'atomos', 'Avatar.tsx'),
      'utf8',
    );
    for (let i = 0; i < cuantos; i += 1) {
      expect(
        componente.includes(`'bg-avatar-${i}'`),
        `falta la clase bg-avatar-${i}: ese avatar sale sin pintar`,
      ).toBe(true);
    }
  });

  it('tailwind genera las clases que el componente nombra', () => {
    const config = readFileSync(join(RAIZ, '..', 'tailwind.config.js'), 'utf8');

    expect(
      /avatar-\$\{i\}/.test(config),
      'tailwind ya no genera las clases avatar-N y ninguna existe',
    ).toBe(true);
    expect(config.includes("'avatar-sin-nombre'")).toBe(true);
  });

  it('el componente no pasa el color por style', () => {
    const componente = readFileSync(
      join(RAIZ, 'shared', 'ui', 'atomos', 'Avatar.tsx'),
      'utf8',
    );

    /* An inline `style` colour can beat a compiled class, which once
       shipped a button with no fill at all. `tokens.test.ts` guards
       the whole folder; this says it out loud where it was tried. */
    expect(
      /backgroundColor/.test(componente),
      'el color volvió a ir por style: puede pisar la clase compilada',
    ).toBe(false);
  });
});
