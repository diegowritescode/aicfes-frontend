import { View } from 'react-native';
import { Chip, Tarjeta, Texto } from '@/shared/ui';
import type { PasoLegible } from '../model/permisos';

/**
 * One permission, as a row.
 *
 * Replaces a log line that read `paso overlay: undetermined
 * (requerido)`. Granted, still needed, and a third state for the one
 * Android refuses outright — which looks identical to "not granted
 * yet" in the raw status and needs completely different instructions.
 *
 * The file is still named for the chip it used to be. Renaming it
 * would churn the imports for nothing; what it renders is a row.
 *
 * Three states, and none of them is carried by colour alone. This is
 * the screen where a learner finds out why blocking is not working,
 * so a learner who cannot tell the green from the amber still has to
 * be able to read it: the mark differs in shape (✓ ! ○), the chip
 * beside the name says the state in words, and only a pending step
 * carries a line of explanation underneath.
 */

/* `plana` for a granted step and `alzada` for one still pending.
   A raised card is something the learner acts on, and a permission
   already granted is not — it is context for the ones above it. The
   brightness difference does the sorting before any colour is read,
   which is rule two of the system doing the work here. */
export function ChipDePermiso({ paso }: { paso: PasoLegible }) {
  const marca = paso.concedido ? '✓' : paso.bloqueadoPorElSistema ? '!' : '○';

  const tono = paso.bloqueadoPorElSistema
    ? 'fallo'
    : paso.concedido
      ? 'ganado'
      : 'neutro';

  /* The state said in words, not only in a colour and a glyph. */
  const estado = paso.bloqueadoPorElSistema
    ? 'En ajustes'
    : paso.concedido
      ? 'Listo'
      : 'Falta';

  const colorDeLaMarca = paso.bloqueadoPorElSistema
    ? 'text-alerta'
    : paso.concedido
      ? 'text-ganado'
      : 'text-texto-apagado';

  return (
    <Tarjeta
      variante={paso.concedido ? 'plana' : 'alzada'}
      className="gap-2"
      /* One node for the screen reader instead of five, and it reads
         the state in words: a row that announces «✓» and leaves the
         rest to colour says nothing out loud. */
      accessibilityRole="summary"
      accessibilityLabel={[
        paso.nombre,
        estado,
        paso.requerido ? 'obligatorio' : 'opcional',
      ].join('. ')}
    >
      <View className="flex-row items-center gap-2.5">
        <Texto
          estilo="cuerpo"
          style={{ fontFamily: 'Inter_600SemiBold' }}
          className={colorDeLaMarca}
        >
          {marca}
        </Texto>
        <View className="flex-1 gap-0.5">
          <Texto estilo="opcion" style={{ fontFamily: 'Inter_600SemiBold' }}>
            {paso.nombre}
          </Texto>
          {/* Kept on screen, not only in the accessible name: a
              learner deciding which of six permissions to bother with
              needs to see which ones they can skip. */}
          {!paso.requerido ? <Texto estilo="rotulo">Opcional</Texto> : null}
        </View>
        <Chip tono={tono}>{estado}</Chip>
      </View>

      {/* The reason is only shown while it is still missing: once
          granted it is noise, and a wall of explanations is what made
          the bench unreadable. */}
      {!paso.concedido ? (
        <Texto estilo="apoyo">
          {paso.bloqueadoPorElSistema
            ? 'Android lo bloquea en apps instaladas por fuera de Play. Abre Ajustes → Aplicaciones → AICFES → ⋮ → «Permitir ajustes restringidos», y vuelve.'
            : paso.porQue}
        </Texto>
      ) : null}
    </Tarjeta>
  );
}
