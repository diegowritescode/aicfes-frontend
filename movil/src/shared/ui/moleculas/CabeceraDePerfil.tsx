import { View } from 'react-native';
import type { ReactNode } from 'react';
import { Avatar } from '../atomos/Avatar';
import { Texto } from '../atomos/Texto';
import { Tarjeta } from './Tarjeta';

/**
 * Who somebody is, at the top of their profile.
 *
 * One component for both profiles — your own and somebody else's —
 * because they answer the same question and should not drift into
 * two different-looking answers. What differs is the button
 * underneath, which the caller passes in: «Editar perfil» on yours,
 * «Enviar solicitud» on theirs.
 *
 * Taken from the validated design's profile card: a large avatar, the
 * name, a quiet line under it, and one action. The reference puts an
 * email on that quiet line. This does not — an email is the one field
 * that identifies a minor off-app, and it must never render on a
 * screen another learner can see. The description goes there instead,
 * which is what a learner actually wrote to be known by.
 */
export function CabeceraDePerfil({
  alias,
  descripcion,
  /** «Tú», «Amigos desde marzo» — one short line of status. */
  nota,
  accion,
}: {
  alias: string | null;
  descripcion?: string | null;
  nota?: string | null;
  accion?: ReactNode;
}) {
  const nombre = alias ?? '';

  return (
    <Tarjeta className="items-center gap-3 py-5">
      <Avatar nombre={nombre} tamano="grande" />

      <View className="items-center gap-1">
        <Texto estilo="titulo">{alias ?? 'Sin nombre todavía'}</Texto>
        {nota ? <Texto estilo="apoyo">{nota}</Texto> : null}
      </View>

      {descripcion ? (
        /* Centred and capped at two lines. The server caps the text
           at 120 characters, so this never truncates in practice —
           the clamp is here for the day that cap changes. */
        <Texto estilo="apoyo" numberOfLines={2} className="text-center">
          {descripcion}
        </Texto>
      ) : null}

      {accion ? <View className="mt-1 w-full items-center">{accion}</View> : null}
    </Tarjeta>
  );
}

/**
 * The row of figures under the profile header.
 *
 * The reference design's «Courses / Lessons / Words / Streak» strip.
 * Three or four at most: it works because each is one word and one
 * number, and a fifth turns it into a table.
 *
 * Hairlines between, not around. A bordered box here would compete
 * with the card above it.
 */
export function TiraDeCifras({
  cifras,
}: {
  cifras: ReadonlyArray<{ etiqueta: string; valor: string | number }>;
}) {
  if (cifras.length === 0) return null;

  return (
    <View className="flex-row items-stretch">
      {cifras.map((c, i) => (
        <View
          key={c.etiqueta}
          className={`flex-1 items-center gap-0.5 px-1 ${
            i > 0 ? 'border-l border-linea' : ''
          }`}
          /* Read as one phrase. Without this a screen reader says the
             number and the word as two unrelated items, and «7» on
             its own means nothing. */
          accessibilityRole="text"
          accessibilityLabel={`${c.valor} ${c.etiqueta}`}
        >
          <Texto estilo="titulo">{c.valor}</Texto>
          <Texto estilo="apoyo" className="text-center">
            {c.etiqueta}
          </Texto>
        </View>
      ))}
    </View>
  );
}
