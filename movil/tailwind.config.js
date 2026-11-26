/**
 * Tailwind reads the same tokens the components do.
 *
 * The values live in `src/shared/ui/tokens.ts`; this file only
 * reshapes them into Tailwind's format. Copying them by hand is how
 * a palette ends up half-changed, so `tokens.test.ts` fails the build
 * if the two ever disagree.
 *
 * Names are roles, not hues: `acento` can stop being purple without
 * touching a single class string.
 */
const { color, espacio, radio, control } = require('./src/shared/ui/tokens.ts');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        fondo: color.fondo,
        capa: color.capa,
        'capa-alta': color.capaAlta,
        linea: color.linea,
        'borde-control': color.bordeControl,
        texto: color.texto,
        'texto-apagado': color.textoApagado,
        acento: color.acento,
        'sobre-acento': color.sobreAcento,
        'acento-texto': color.acentoTexto,
        'acento-suave': color.acentoSuave,
        ganado: color.ganado,
        'sobre-ganado': color.sobreGanado,
        'ganado-suave': color.ganadoSuave,
        fallo: color.fallo,
        'fallo-suave': color.falloSuave,
        alerta: color.alerta,
        'alerta-suave': color.alertaSuave,
        foco: color.foco,
      },
      spacing: Object.fromEntries(Object.entries(espacio).map(([k, v]) => [k, `${v}px`])),
      borderRadius: Object.fromEntries(Object.entries(radio).map(([k, v]) => [k, `${v}px`])),
      minHeight: {
        toque: `${control.minimo}px`,
        boton: `${control.boton}px`,
        opcion: `${control.opcion}px`,
      },
      maxWidth: { contenido: `${control.anchoMaximo}px` },
      /* The exact names expo-font registers, not the family name:
         React Native resolves a font by its registered key, and
         'Nunito' alone matches nothing. */
      fontFamily: {
        marca: ['Nunito_800ExtraBold'],
        'marca-bold': ['Nunito_700Bold'],
        texto: ['Inter_400Regular'],
      },
    },
  },
  plugins: [],
};
