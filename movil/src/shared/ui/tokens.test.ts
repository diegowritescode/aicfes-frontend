import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { color, control } from './tokens';

/* Every screen and component, not just `shared/ui`: the files that
   shipped these bugs were features'. Shared by the checks below. */
const RAIZ_SRC = path.resolve(new URL('../..', import.meta.url).pathname);

function archivosDeInterfaz(): string[] {
  const salida: string[] = [];
  const recorrer = (dir: string) => {
    for (const e of readdirSync(dir)) {
      if (e === 'node_modules') continue;
      const completo = path.join(dir, e);
      if (statSync(completo).isDirectory()) recorrer(completo);
      else if (/\.tsx$/.test(e) && !/\.test\./.test(e)) salida.push(completo);
    }
  };
  recorrer(RAIZ_SRC);
  return salida;
}

/**
 * The tokens, checked rather than trusted.
 *
 * Every value in `tokens.ts` was measured before it landed, and two
 * of them changed because they failed: the accent could not carry
 * white text at 3,94:1, and the reference design's prettier control
 * border measured 1,46:1. Without these tests the next person to
 * "just darken the purple a bit" has no way to know what they broke.
 */

function luminancia(hex: string): number {
  const n = hex.replace('#', '');
  const canal = (i: number) => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(0) + 0.7152 * canal(2) + 0.0722 * canal(4);
}

function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

describe('el contraste de los tokens', () => {
  /* 4,5:1 is the AA floor for body text. */
  it.each([
    ['texto sobre fondo', color.texto, color.fondo],
    ['texto sobre capa', color.texto, color.capa],
    ['texto apagado sobre fondo', color.textoApagado, color.fondo],
    ['texto de acento sobre capa', color.acentoTexto, color.capa],
    ['blanco sobre acento', color.sobreAcento, color.acento],
    ['blanco sobre ganado', color.sobreGanado, color.ganado],
    /* The alert sits on its own tinted surface in three places — an
       unreviewed report, a system-refused permission. It measures
       4,55:1, with nothing to spare, so this is the pair that breaks
       first if either value is nudged. */
    ['alerta sobre alerta suave', color.alerta, color.alertaSuave],
  ])('%s pasa AA para texto', (_, frente, fondo) => {
    expect(contraste(frente, fondo)).toBeGreaterThanOrEqual(4.5);
  });

  /* 3:1 is the floor for a component's own edges and fills. */
  it.each([
    ['el acento como relleno', color.acento, color.fondo],
    ['ganado como relleno', color.ganado, color.capa],
    ['fallo como relleno', color.fallo, color.capa],
    ['el borde de un control', color.bordeControl, color.capa],
  ])('%s pasa AA para componentes', (_, frente, fondo) => {
    expect(contraste(frente, fondo)).toBeGreaterThanOrEqual(3);
  });

  /* Failing must never outweigh getting it right. The saturated amber
     we started with was louder than the green beside it, which tells
     the learner the wrong thing about which answer matters. */
  it('fallo no pesa más que ganado', () => {
    expect(contraste(color.fallo, color.capa)).toBeLessThanOrEqual(
      contraste(color.ganado, color.capa) + 1.2,
    );
  });
});

describe('los tamaños de control', () => {
  it('nada que se toque baja de 44', () => {
    expect(control.minimo).toBeGreaterThanOrEqual(44);
    expect(control.boton).toBeGreaterThanOrEqual(control.minimo);
    expect(control.opcion).toBeGreaterThanOrEqual(control.minimo);
  });
});

describe('tailwind y los tokens', () => {
  it('exponen los mismos colores', () => {
    const cfg = require('../../../tailwind.config.js');
    const tw = cfg.theme.extend.colors;
    expect(tw.acento).toBe(color.acento);
    expect(tw.fondo).toBe(color.fondo);
    expect(tw.fallo).toBe(color.fallo);
    expect(tw['borde-control']).toBe(color.bordeControl);
  });
});

/**
 * No loose hex in the UI layer.
 *
 * One stray `#1d4ed8` is how a design system quietly stops being the
 * source of truth. If a colour is missing, the fix is a new token,
 * not a literal.
 */
/**
 * No layout in a `style` object where a class would do.
 *
 * NativeWind compiles classes into styles, and a `style` prop passed
 * alongside can win — the compiled background is then dropped. That
 * shipped: a button with the right touch area and no fill at all,
 * which a real phone found before any test did. Shadows are the
 * exception, because Android's `elevation` has no class.
 */
describe('estilos en línea', () => {
  const RAIZ_UI = path.resolve(new URL('.', import.meta.url).pathname);

  function archivosUi(dir: string): string[] {
    const salida: string[] = [];
    for (const e of readdirSync(dir)) {
      const completo = path.join(dir, e);
      if (statSync(completo).isDirectory()) salida.push(...archivosUi(completo));
      else if (/\.tsx$/.test(e) && !/\.test\./.test(e)) salida.push(completo);
    }
    return salida;
  }

  it('ningún componente pone minHeight ni colores en style', () => {
    const malos: string[] = [];
    for (const carpeta of ['atomos', 'moleculas']) {
      let dir: string;
      try {
        dir = path.join(RAIZ_UI, carpeta);
        statSync(dir);
      } catch {
        continue;
      }
      for (const archivo of archivosUi(dir)) {
        const texto = readFileSync(archivo, 'utf-8');
        for (const prop of ['minHeight', 'backgroundColor', 'borderRadius']) {
          if (texto.includes(`${prop}:`)) {
            malos.push(`${path.basename(archivo)}: ${prop}`);
          }
        }
      }
    }
    expect(malos).toEqual([]);
  });
});

describe('la disciplina de los tokens', () => {
  const RAIZ = path.resolve(new URL('..', import.meta.url).pathname);

  function archivos(dir: string): string[] {
    const salida: string[] = [];
    for (const e of readdirSync(dir)) {
      const completo = path.join(dir, e);
      if (statSync(completo).isDirectory()) salida.push(...archivos(completo));
      else if (/\.tsx?$/.test(e) && !/\.test\.tsx?$/.test(e)) salida.push(completo);
    }
    return salida;
  }

  const MIGRADOS = ['atomos', 'moleculas', 'organismos'];

  it('ningún componente nuevo de ui escribe un hex', () => {
    const malos: string[] = [];
    const dirs = MIGRADOS.map((d) => path.join(RAIZ, 'ui', d)).filter((d) => {
      try { return statSync(d).isDirectory(); } catch { return false; }
    });
    for (const archivo of dirs.flatMap(archivos)) {
      if (archivo.endsWith('tokens.ts')) continue;
      const texto = readFileSync(archivo, 'utf-8');
      for (const m of texto.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
        malos.push(`${path.relative(RAIZ, archivo)}: ${m[0]}`);
      }
    }
    expect(malos).toEqual([]);
  });
});

/**
 * No opacity suffix on a token colour.
 *
 * `bg-acento/60`, `border-acento-suave/30`: Tailwind writes those by
 * resolving the colour and applying an alpha, which works for its own
 * palette and not for ours — these come from a JavaScript object, and
 * what NativeWind compiles from them is not reliable on a device.
 *
 * It is not theoretical. The tutor panel opened on a real phone
 * showing nothing but its Cerrar button, every row below the header
 * missing, and the three suffixes left in the app were all in that
 * file — one of them on the tabs, which is exactly where the render
 * stopped. `AvisoDeDuelos` had already dropped its own for a
 * different reason: «a fifth colour nobody chose».
 *
 * The tinted surfaces are tokens of their own — `acento-suave`,
 * `ganado-suave`, `fallo-suave`, `alerta-suave` — so there is a named
 * colour for every case this would have been used for.
 *
 * Tailwind's own palette is left alone: `bg-black/40` behind a dialog
 * resolves fine, because black is Tailwind's.
 */
describe('ningún color del sistema lleva opacidad', () => {
  const TOKENS = [
    'fondo', 'capa', 'capa-alta', 'linea', 'borde-control',
    'texto', 'texto-apagado', 'acento', 'acento-texto', 'acento-suave',
    'sobre-acento', 'ganado', 'ganado-suave', 'sobre-ganado',
    'fallo', 'fallo-suave', 'alerta', 'alerta-suave',
  ];

  it('ni en bg-, text-, border- de ninguna pantalla', () => {
    const culpables: string[] = [];
    /* Longest first: `acento-suave` must match before `acento`, or
       `bg-acento-suave/30` is read as `acento` plus leftovers. */
    const ordenados = [...TOKENS].sort((a, b) => b.length - a.length);
    const patron = new RegExp(
      `\\b(?:bg|text|border)-(?:${ordenados.join('|')})\\/\\d`,
      'g',
    );

    for (const archivo of archivosDeInterfaz()) {
      const fuente = readFileSync(archivo, 'utf8');
      /* Comments stripped first: three of these files explain the
         rule by quoting the thing it forbids, and a test that reads
         its own documentation as a violation is a test nobody can
         keep green. */
      const sinComentarios = fuente
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');

      for (const linea of sinComentarios.split('\n')) {
        const golpes = linea.match(patron);
        if (golpes) culpables.push(`${path.relative(RAIZ_SRC, archivo)}: ${golpes.join(', ')}`);
      }
    }

    expect(
      culpables,
      `estos ponen opacidad sobre un color del sistema: ${culpables.join(' · ')}. ` +
        `Los tokens vienen de un objeto JS y la opacidad sobre ellos no es ` +
        `fiable en el dispositivo: el panel del tutor dejó de renderizar por ` +
        `esto. Usa el token tintado (acento-suave, ganado-suave, fallo-suave).`,
    ).toEqual([]);
  });
});

/**
 * A button sharing a row says so.
 *
 * `Boton` defaults to `w-full`, which is right for one that owns its
 * line and wrong for one in a row: it claims the whole width and
 * flattens whatever sits beside it.
 *
 * It emptied the tutor panel on a real phone. The header is a
 * `flex-row` holding a title and a Cerrar button; the button took
 * every pixel, the title collapsed to zero width, and everything
 * below was pushed off. A dump of the screen had ten nodes and one
 * piece of text. No exception was thrown and no test failed, which
 * is why it survived two wrong fixes before the device was read.
 *
 * Matched on the source text: a `flex-row` container whose children
 * include a `<Boton` with no `ancho`. It is narrow by design — it
 * reads one level of nesting, not every layout — and it catches the
 * shape that shipped.
 */
describe('un botón que comparte fila no reclama todo el ancho', () => {
  it('cada Boton dentro de un flex-row lleva ancho={false}', () => {
    const culpables: string[] = [];

    for (const archivo of archivosDeInterfaz()) {
      const fuente = readFileSync(archivo, 'utf8');
      const sinComentarios = fuente
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');

      /* The `<View>` that actually encloses each `<Boton`, found by
         walking the opening and closing tags and keeping a stack —
         not by taking the last `<View` before it, which is usually a
         sibling that already closed. That shortcut was the first
         version of this check, and it missed the very header that
         shipped the bug.

         Deliberately shallow all the same: it reads `<View>` nesting
         and nothing else. A full JSX parse would catch more and would
         be a parser living in a test file. */
      const pila: Array<{ fila: boolean; hijos: number }> = [];

      for (const t of sinComentarios.matchAll(/<View\b([^>]*)>|<\/View>|<Boton\b([^>]*)>/g)) {
        const texto = t[0];

        if (texto === '</View>') {
          pila.pop();
          continue;
        }

        if (texto.startsWith('<Boton')) {
          const props = t[2] ?? '';
          const dentro = pila[pila.length - 1];
          if (dentro) {
            if (dentro.fila && dentro.hijos > 0 && !/\bancho=/.test(props)) {
              culpables.push(path.relative(RAIZ_SRC, archivo));
            }
            dentro.hijos += 1;
          }
          continue;
        }

        /* A `<View … />` closes itself: it is a sibling, never a
           parent. */
        const props = t[1] ?? '';
        const padre = pila[pila.length - 1];
        if (padre) padre.hijos += 1;
        if (props.trimEnd().endsWith('/')) continue;
        pila.push({ fila: /\bflex-row\b/.test(props), hijos: 0 });
      }
    }

    expect(
      [...new Set(culpables)],
      `estos ponen un Boton en una fila sin ancho={false}: ${[...new Set(culpables)].join(', ')}. ` +
        `El botón reclama w-full y aplasta a lo que tiene al lado: así se vació ` +
        `el panel del tutor, que abrió mostrando solo su botón de cerrar.`,
    ).toEqual([]);
  });
});

describe('el teclado no se maneja con el KeyboardAvoidingView de React Native', () => {
  it('ningún archivo lo importa desde react-native', () => {
    const culpables: string[] = [];

    for (const archivo of archivosDeInterfaz()) {
      const fuente = readFileSync(archivo, 'utf8');
      const sinComentarios = fuente
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');

      /* Only an import whose source is `react-native` itself. The one
         from `react-native-keyboard-controller` carries the same name
         and is the replacement, so matching the name alone would flag
         the fix. */
      for (const imp of sinComentarios.matchAll(
        /import\s*\{([^}]*)\}\s*from\s*'react-native'/g,
      )) {
        if (/\bKeyboardAvoidingView\b/.test(imp[1] ?? '')) {
          culpables.push(path.relative(RAIZ_SRC, archivo));
        }
      }
    }

    expect(
      [...new Set(culpables)],
      `estos importan KeyboardAvoidingView de react-native: ${[...new Set(culpables)].join(', ')}. ` +
        `Desde Expo 58 la app es edge-to-edge: Android ya no redimensiona la ventana para el ` +
        `teclado, solo reporta un inset, y esa vista no lo lee — en Android ni siquiera acepta ` +
        `un behavior. Dentro de un Modal es peor, porque un modal es otra ventana. El teclado ` +
        `tapaba el campo en el tutor, en entrar y en registro. Usa ` +
        `react-native-keyboard-controller.`,
    ).toEqual([]);
  });
});
