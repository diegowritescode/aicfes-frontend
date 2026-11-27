import { describe, expect, it } from 'vitest';
import { TEXTOS_DEL_ESCUDO } from './escudo';
import { color } from '@/shared/ui/tokens';

/**
 * The shield has to look like the rest of the app.
 *
 * It is drawn by Android, not by React, so no stylesheet reaches it:
 * the only way it carries the product's colours is by being handed
 * them in this config. Left unconfigured it paints itself in the
 * platform palette, and it shipped that way — a Material blue pill
 * on white, the one screen that looked like a different app. The
 * user found it: «esta horrible, rompe todo el diseño».
 *
 * Nothing caught it, because every existing check tests what the
 * shield *does* — which button opens what — and none tested how it
 * looks. These do, and they are worth more than they appear: the
 * native side reads this object key by key out of JSON, so a
 * renamed or misspelled key is silently ignored and the shield goes
 * back to blue with no error anywhere.
 */
describe('el escudo lleva los colores del producto', () => {
  it('cada color sale de un token, no de un valor suelto', () => {
    expect(TEXTOS_DEL_ESCUDO.backgroundColor).toBe(color.fondo);
    expect(TEXTOS_DEL_ESCUDO.title.color).toBe(color.texto);
    expect(TEXTOS_DEL_ESCUDO.subtitle.color).toBe(color.textoApagado);
    expect(TEXTOS_DEL_ESCUDO.primaryButton.backgroundColor).toBe(color.acento);
    expect(TEXTOS_DEL_ESCUDO.secondaryButton.color).toBe(color.acentoTexto);
  });

  it('ningún texto se queda sin su etiqueta', () => {
    /* The native side reads a nested `{ text, color }` and returns
       null when `text` is missing — colouring a button without
       naming it would wipe its label and leave an unnamed pill. */
    expect(TEXTOS_DEL_ESCUDO.title.text).toBeTruthy();
    expect(TEXTOS_DEL_ESCUDO.subtitle.text).toBeTruthy();
    expect(TEXTOS_DEL_ESCUDO.primaryButton.text).toBeTruthy();
    expect(TEXTOS_DEL_ESCUDO.secondaryButton.text).toBeTruthy();
  });

  it('el texto sobre el botón principal se lee', () => {
    /* White on `acento` measures 5,18:1. Asserted rather than
       trusted: `acento` is a token and a change to it would take
       this button's legibility with it, on the one screen the
       learner meets at their least patient moment. */
    expect(contraste(TEXTOS_DEL_ESCUDO.primaryButton.color, color.acento))
      .toBeGreaterThanOrEqual(4.5);
  });

  it('los textos sobre el fondo se leen', () => {
    const fondo = TEXTOS_DEL_ESCUDO.backgroundColor;
    expect(contraste(TEXTOS_DEL_ESCUDO.title.color, fondo)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(TEXTOS_DEL_ESCUDO.subtitle.color, fondo)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(TEXTOS_DEL_ESCUDO.secondaryButton.color, fondo)).toBeGreaterThanOrEqual(4.5);
  });
});

/** WCAG relative luminance, so the ratios above are measured and not guessed. */
function luminancia(hex: string): number {
  const n = hex.replace('#', '');
  const canales = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  const [r, g, b] = canales.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  ) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
