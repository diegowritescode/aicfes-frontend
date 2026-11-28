import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CAMPOS_QUE_LEEN_EXTRANOS,
  SEGURIDAD_AL_ESCRIBIR,
  necesitaRecordatorio,
} from './seguridad-en-linea';

/**
 * The online-safety reminder, and that it reaches the screen.
 *
 * Play's Families policy, verbatim: «Any app that includes children
 * in their target audience and has social features, must provide an
 * in-app reminder to be safe online and to be aware of the real world
 * risk of online interaction before allowing child users to exchange
 * freeform media or information.»
 *
 * The wording IS the requirement. A card that renders perfectly and
 * says «sé amable» satisfies none of it, so the assertions here are
 * about content, not markup.
 *
 * Worth recording why this exists at all: the screen already had a
 * card saying «no escribas tu nombre completo, tu teléfono, tu
 * dirección ni tu colegio», in exactly the right place. The instinct
 * was right and it was NOT missing. What it lacked was the half of
 * the policy sentence about real-world risk, and any way out once
 * something has already gone wrong.
 */

describe('el recordatorio de seguridad', () => {
  it('nombra el riesgo del mundo real, no solo una regla', () => {
    /* «be aware of the real world risk of online interaction». A list
       of prohibitions is a rule; «no sabes quién está del otro lado»
       is the risk. The policy asks for the second. */
    const riesgo = SEGURIDAD_AL_ESCRIBIR.riesgo.toLowerCase();

    expect(
      /no sabes quién|alguien que no conoces|quien dice ser/.test(riesgo),
      'el recordatorio dejó de nombrar el riesgo: que no se sabe quién está del otro lado',
    ).toBe(true);
  });

  it('dice que lo lee un desconocido, no «los demás»', () => {
    /* «Así te ven los demás» is the preview's caption and it is fine
       there. Here it would be the wrong word: «los demás» sounds like
       classmates, and the risk is the person who is not one. */
    expect(SEGURIDAD_AL_ESCRIBIR.titulo.toLowerCase()).toContain('no conoces');
  });

  it('enumera cosas concretas y no un principio', () => {
    /* «No compartas información personal» is policy language a
       teenager reads as noise. Four things they might actually type
       is what changes behaviour. */
    expect(SEGURIDAD_AL_ESCRIBIR.nunca.length).toBeGreaterThanOrEqual(3);

    const todo = SEGURIDAD_AL_ESCRIBIR.nunca.join(' ').toLowerCase();
    for (const concreto of ['teléfono', 'colegio', 'dirección']) {
      expect(todo, `el recordatorio ya no menciona ${concreto}`).toContain(concreto);
    }

    expect(
      /información personal|datos personales/.test(todo),
      'volvió el lenguaje de política en vez de ejemplos concretos',
    ).toBe(false);
  });

  it('ofrece una salida y no solo una advertencia', () => {
    /* A reminder that describes a danger and offers nothing leaves a
       minor alone with it. Both mechanisms named here exist: the
       block list and the report queue a human reviews. */
    /* Accent-folded before matching. «denúncialo» is the natural
       imperative and the one a learner reads; a guard that demanded
       «denuncia» unaccented would push the copy towards whatever the
       test happens to spell, which is backwards. */
    const salida = SEGURIDAD_AL_ESCRIBIR.salida
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');

    expect(salida).toContain('bloqu');
    expect(salida).toContain('denunc');
  });

  it('no promete anonimato que el sistema no garantice', () => {
    /* `salida` says the reported person is not told who reported
       them. That has to stay true of the report pipeline: the
       moderation email deliberately omits the reporter's identity and
       their free text. If that ever changes, this sentence becomes a
       lie told to a minor — which is worse than not having said it. */
    expect(SEGURIDAD_AL_ESCRIBIR.salida).toContain('no se le avisa que fuiste tú');
  });

  it('cubre los dos campos que leen extraños', () => {
    expect(CAMPOS_QUE_LEEN_EXTRANOS).toContain('alias');
    expect(CAMPOS_QUE_LEEN_EXTRANOS).toContain('descripcion');
    expect(necesitaRecordatorio('descripcion')).toBe(true);
    /* An email is read by nobody else, so it needs no reminder — and
       more to the point it must never reach a screen a stranger sees. */
    expect(necesitaRecordatorio('email')).toBe(false);
  });
});

describe('el recordatorio llega a la pantalla', () => {
  const pantalla = readFileSync(
    join(__dirname, '..', '..', '..', 'app', 'perfil-publico.tsx'),
    'utf8',
  );

  it('se renderiza en el perfil público', () => {
    /* The policy says «before allowing child users to exchange
       freeform information», so a component that exists but is not
       mounted satisfies nothing. This is the whole reason to assert
       on the screen's source and not only on the text module. */
    expect(
      pantalla.includes('<RecordatorioDeSeguridad />'),
      'el recordatorio ya no se renderiza en /perfil-publico: la pantalla donde se escribe el texto libre',
    ).toBe(true);
  });

  it('va antes de los campos, no después', () => {
    /* «before allowing» is positional. Rendered under the save
       button it would be read after the text was written, which is
       the one ordering the policy rules out. */
    const recordatorio = pantalla.indexOf('<RecordatorioDeSeguridad />');
    const primerCampo = pantalla.indexOf('<TextInput');

    expect(recordatorio).toBeGreaterThan(-1);
    expect(primerCampo).toBeGreaterThan(-1);
    expect(
      recordatorio < primerCampo,
      'el recordatorio quedó debajo del primer campo: la política pide que se lea antes de escribir',
    ).toBe(true);
  });
});
