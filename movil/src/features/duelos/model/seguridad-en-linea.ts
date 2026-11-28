/**
 * The reminder a minor reads before writing something strangers see.
 *
 * Required, not advisory. Google Play's Families policy: «Any app that
 * includes children in their target audience and has social features,
 * must provide an in-app reminder to be safe online and to be aware of
 * the real world risk of online interaction before allowing child
 * users to exchange freeform media or information.»
 *
 * Three words in that sentence decide the design:
 *
 * - **«freeform»** — this is what makes it apply here. An alias picked
 *   from a list and a score are not freeform; `descripcion` is 120
 *   characters of anything, and that is where a phone number, an
 *   Instagram handle or a school name goes.
 * - **«before»** — so it renders above the field, not in a help
 *   screen and not after saving.
 * - **«real world risk»** — the policy asks for the consequence, not
 *   a generic «be careful». «Alguien que no conoces» is that
 *   consequence stated plainly.
 *
 * Pure, so the wording is testable without a renderer. The wording is
 * the compliance surface: a screen that renders beautifully and says
 * «sé amable» satisfies nothing.
 *
 * Not a dialog. A modal here would be the fourth thing between a
 * learner and a text box they have already decided to fill, and
 * Google asks for a reminder, not for consent — consent is what the
 * guardian authorisation in `tutorAutorizoEn` already covers. A
 * permanent note above the field is also strictly better than a
 * one-time modal: it is there on the twentieth edit, when the first
 * modal is long forgotten.
 */

export interface RecordatorioDeSeguridad {
  readonly titulo: string;
  /** The risk, named. One sentence, because two get skipped. */
  readonly riesgo: string;
  /** What not to write. Concrete, not a principle. */
  readonly nunca: readonly string[];
  /** Where to go when something goes wrong. */
  readonly salida: string;
}

/**
 * Shown above any field whose text other learners can read.
 *
 * Written for a 16-year-old: «no compartas información personal» is
 * policy language that a teenager reads as noise. A list of the four
 * things they might actually type is what changes behaviour.
 */
export const SEGURIDAD_AL_ESCRIBIR: RecordatorioDeSeguridad = {
  titulo: 'Esto lo puede leer alguien que no conoces',
  riesgo:
    'Cualquier estudiante que busque tu nombre en la app ve esta línea. No sabes quién está del otro lado ni si es quien dice ser.',
  nunca: [
    'Tu teléfono, tu correo o tus redes.',
    'El nombre de tu colegio o tu barrio.',
    'Tu dirección ni a qué horas estás solo.',
    'Fotos tuyas ni de tu familia.',
  ],
  /* Names the two things that exist and work: blocking and
     reporting. A reminder that warns without offering a way out
     leaves a learner alone with the problem it just described. */
  salida:
    'Si alguien te incomoda, bloquéalo y denúncialo. Lo revisa una persona, y no se le avisa que fuiste tú.',
};

/**
 * Whether a field's text is read by people the learner has not chosen.
 *
 * A predicate rather than a constant, so adding a field that strangers
 * can read is a decision somebody makes here, next to the policy
 * reason, instead of a reminder somebody forgets to render.
 */
export const CAMPOS_QUE_LEEN_EXTRANOS: readonly string[] = ['alias', 'descripcion'];

export function necesitaRecordatorio(campo: string): boolean {
  return CAMPOS_QUE_LEEN_EXTRANOS.includes(campo);
}
