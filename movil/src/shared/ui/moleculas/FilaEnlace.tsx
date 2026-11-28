import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { ReactNode } from 'react';
import { Texto } from '../atomos/Texto';
import { color } from '../tokens';

/**
 * A row that opens somewhere else.
 *
 * The pattern the whole «Yo» screen is rebuilt on. Before this, that
 * screen rendered every section's contents inline — the streak, the
 * level, the XP breakdown, the missions, the achievements, two
 * settings cards and a sign-out — and the result was a wall nobody
 * could find anything in.
 *
 * A row says what is behind it and how much of it there is. It does
 * not show the thing. That is the difference between a screen you
 * scan in two seconds and one you give up on.
 *
 * The chevron is drawn, not a character: `›` renders at a different
 * weight in every font and sits off the optical centre.
 */

/** 24px glyphs at stroke 1.9, matching `BarraPestanas`. */
const ICONOS = {
  rayo: 'M13 3 4 14h7l-1 7 9-11h-7l1-7Z',
  medalla: 'M12 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10M8.5 12.5 7 21l5-2.5L17 21l-1.5-8.5',
  grafico: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  gente: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M2 20a7 7 0 0 1 14 0M17 20a5 5 0 0 0-3-4.6M16 4.3a3.5 3.5 0 0 1 0 6.4',
  engranaje:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z',
  reloj: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l3 2',
  libro: 'M4 4h7a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H4ZM20 4h-5a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H20Z',
  escudo: 'M12 3l8 3v6c0 4.5-3.2 7.9-8 9-4.8-1.1-8-4.5-8-9V6Z',
  campana: 'M18 10a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6M10.5 20a2 2 0 0 0 3 0',
  candado: 'M6 10V8a6 6 0 1 1 12 0v2M5 10h14v10H5Z',
  bandera: 'M5 21V4h13l-2.5 4L18 12H5',
  salir: 'M15 17v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v2M19 12H9M16 9l3 3-3 3',
} as const;

export type IconoDeFila = keyof typeof ICONOS;

/* The tint behind each icon. Written out rather than built from a
   variable, because NativeWind compiles the classes it can see and
   `bg-${algo}` reaches the stylesheet as nothing at all. */
const TINTE: Record<string, string> = {
  acento: 'bg-acento-suave',
  ganado: 'bg-ganado-suave',
  fallo: 'bg-fallo-suave',
  alerta: 'bg-alerta-suave',
  neutro: 'bg-capa-alta',
};

const TRAZO: Record<string, string> = {
  acento: color.acentoTexto,
  ganado: color.ganado,
  fallo: color.fallo,
  alerta: color.alerta,
  neutro: color.textoApagado,
};

export type TonoDeFila = keyof typeof TINTE;

export function FilaEnlace({
  icono,
  tono = 'acento',
  titulo,
  detalle,
  valor,
  alTocar,
  etiqueta,
  primera = false,
  ultima = false,
}: {
  icono: IconoDeFila;
  tono?: TonoDeFila;
  titulo: string;
  /** A line under the title. Left out when the title says enough. */
  detalle?: string;
  /**
   * The count or state on the right, before the chevron: «3 de 5»,
   * «activo», «7 días». This is what keeps a row from being a blind
   * door — the learner knows whether it is worth opening.
   */
  valor?: string;
  alTocar: () => void;
  /** Only when the title alone would not say where this goes. */
  etiqueta?: string;
  /** Corners, so a group of rows reads as one card. */
  primera?: boolean;
  ultima?: boolean;
}) {
  return (
    <Pressable
      onPress={alTocar}
      accessibilityRole="button"
      accessibilityLabel={etiqueta ?? titulo}
      accessibilityHint={detalle}
    >
      {({ pressed }) => (
        <View
          /* Only the opacity is inline. A background colour here
             would beat the compiled class and the row would lose its
             fill — the failure `tokens.test.ts` exists to catch. */
          style={{ opacity: pressed ? 0.6 : 1 }}
          className={`min-h-control flex-row items-center gap-3 bg-capa px-4 py-3 ${
            primera ? 'rounded-t-tarjeta' : ''
          } ${ultima ? 'rounded-b-tarjeta' : 'border-b border-linea'}`}
        >
          <View className={`h-9 w-9 items-center justify-center rounded-chico ${TINTE[tono]}`}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d={ICONOS[icono]}
                stroke={TRAZO[tono]}
                strokeWidth={1.9}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>

          <View className="flex-1 gap-0.5">
            <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
              {titulo}
            </Texto>
            {detalle ? <Texto estilo="apoyo">{detalle}</Texto> : null}
          </View>

          {valor ? <Texto estilo="apoyo">{valor}</Texto> : null}

          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 5l7 7-7 7"
              stroke={color.textoApagado}
              strokeWidth={1.9}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      )}
    </Pressable>
  );
}

/**
 * A group of rows as one card.
 *
 * Takes the shadow and the clipping so the children do not each need
 * their own. `overflow-hidden` is what makes the first and last rows'
 * rounded corners actually cut the fill.
 */
export function GrupoDeFilas({ children }: { children: ReactNode }) {
  return (
    <View className="overflow-hidden rounded-tarjeta bg-capa">{children}</View>
  );
}
