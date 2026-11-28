import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The description is visible to anyone who finds the learner, and the
 * field has to say so.
 *
 * It began as something only friends could read, and the field said
 * exactly that. Then search results started carrying it, so somebody
 * about to send a friend request could tell whether this was the
 * person they meant. That is a reasonable thing for a product to do
 * and the wording became a lie on the same day — a minor who wrote
 * something for their friends would have it served to any account
 * that can type the first two letters of their alias.
 *
 * Nothing in a type system ties a label to what an endpoint serves.
 * This is the tie.
 */

const RAIZ = join(__dirname, '..', '..');

describe('la descripción se declara pública', () => {
  /* The field moved. It used to live in the duel settings, behind
     the Jugar tab, which is why Diego could not find his own profile
     — so the alias and the description became their own screen. The
     warning had to travel with the field, and this test is what
     makes sure it did instead of being left behind in a file nobody
     opens any more.

     The signpost that replaced the old screen is checked too: it is
     the last thing a learner reads before opening the form, so it
     carries the same promise. */
  /* The screen plus the reminder it renders, concatenated.

     The warning used to be written inline on this screen. It moved
     into `seguridad-en-linea.ts` when Play's Families policy turned
     it into a compliance surface — it needs the real-world risk named
     and a way out, which is more text than belongs in a JSX literal,
     and wording under test has to be reachable without a renderer.

     So the promise is still made to the learner on this screen; it is
     just assembled from two files now. Reading only one of them would
     have this guard pass while the field said nothing, or — what
     actually happened — fail while the screen was more compliant than
     before. Both files, one string. */
  const CAMPO = [
    join(RAIZ, 'app', 'perfil-publico.tsx'),
    /* The wording. */
    join(RAIZ, 'features', 'duelos', 'model', 'seguridad-en-linea.ts'),
    /* The headings around it — «Nunca escribas aquí» is written here
       rather than in the model, because it labels the list instead of
       being part of it. Three files, and leaving any one out makes
       this guard answer a question nobody asked. */
    join(RAIZ, 'features', 'duelos', 'components', 'RecordatorioDeSeguridad.tsx'),
  ]
    .map((ruta) => readFileSync(ruta, 'utf8'))
    .join('\n');
  const SEÑAL = readFileSync(
    join(RAIZ, 'features', 'duelos', 'components', 'PantallaAjustesDeDuelos.tsx'),
    'utf8',
  );

  it('el campo no promete que solo la vean los amigos', () => {
    for (const [nombre, fuente] of [['el formulario', CAMPO], ['la entrada', SEÑAL]] as const) {
      expect(
        /La ven sus amigos|solo (la ven|lo ven) (sus|tus) amigos/.test(fuente),
        `${nombre} volvió a prometer que solo la ven los amigos, y la búsqueda la sirve a cualquiera`,
      ).toBe(false);
    }
  });

  it('el campo dice que la ve quien lo busque', () => {
    /* Two accepted spellings of one promise. The original was
       «cualquiera que te encuentre»; the reminder now says «cualquier
       estudiante que busque tu nombre en la app ve esta línea», which
       is the same statement made concrete. What is pinned is that the
       learner is told a stranger reads it — not which words do it. */
    expect(
      /cualquiera que te encuentre|[Cc]ualquier estudiante que busque/.test(CAMPO),
      'sin esa frase, el estudiante escribe para sus amigos y lo lee cualquiera',
    ).toBe(true);
    expect(
      /cualquiera que lo encuentre al buscarlo/.test(SEÑAL),
      'la entrada a «mi nombre y mi descripción» ya no advierte que es pública',
    ).toBe(true);
  });

  it('sigue advirtiendo qué no escribir', () => {
    /* The length cap is one defence; telling them is the other.

       Matched against the text with its line breaks collapsed. JSX
       wraps prose at the print margin, so a sentence that fits on
       one line today is two lines after the next edit — and a guard
       that fires on rewrapping is a guard somebody deletes. */
    const texto = CAMPO.replace(/\s+/g, ' ');

    /* The old copy was one sentence: «No escribas tu nombre
       completo, tu teléfono, tu dirección ni tu colegio». It is now a
       list of four items under «Nunca escribas aquí», so the match is
       on the things themselves rather than on the sentence that used
       to hold them. `seguridad-en-linea.test.ts` pins the list. */
    expect(/teléfono/.test(texto)).toBe(true);
    expect(/colegio/.test(texto)).toBe(true);
    expect(/direcci/.test(texto)).toBe(true);
    expect(
      /Nunca escribas|No escribas/.test(texto),
      'desapareció la advertencia de qué no escribir',
    ).toBe(true);
  });
});

describe('la búsqueda sirve la descripción y nada más', () => {
  const ESQUEMAS = readFileSync(
    join(RAIZ, 'features', 'duelos', 'api', 'esquemas.ts'),
    'utf8',
  );

  function bloque(nombre: string): string {
    const desde = ESQUEMAS.indexOf(`export const ${nombre} = z.object({`);
    expect(desde, `${nombre} ya no existe`).toBeGreaterThan(-1);
    const resto = ESQUEMAS.slice(desde);
    return resto.slice(0, resto.indexOf('});'));
  }

  it('un resultado de búsqueda trae alias y descripción', () => {
    const encontrado = bloque('jugadorEncontrado');
    expect(/alias/.test(encontrado)).toBe(true);
    expect(/descripcion/.test(encontrado)).toBe(true);
  });

  it('un resultado de búsqueda no trae racha ni marcador', () => {
    const encontrado = bloque('jugadorEncontrado');

    /* These are a record of how somebody plays, not something they
       wrote to be found by. They stay behind an accepted friendship,
       or the search becomes a directory of minors' results. */
    for (const campo of ['racha', 'ganados', 'perdidos']) {
      expect(
        new RegExp(campo).test(encontrado),
        `${campo} viaja en un resultado de búsqueda: eso es para amigos aceptados`,
      ).toBe(false);
    }
  });

  it('jugador no se ensanchó: también es rival y amigo', () => {
    const j = bloque('jugador');

    expect(
      /descripcion/.test(j),
      'descripcion entró en `jugador`, que también es el rival de un duelo y la otra mitad de una amistad',
    ).toBe(false);
  });
});
