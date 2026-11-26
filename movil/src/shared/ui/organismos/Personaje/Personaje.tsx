import { useEffect } from 'react';
import { View, Pressable, useWindowDimensions } from 'react-native';
import Svg, { Path, Ellipse, Circle, G, Rect, Defs, ClipPath } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withSequence,
  Easing,
  useReducedMotion,
  type SharedValue,
} from 'react-native-reanimated';
import { color, duracion } from '../../tokens';
import {
  POSES,
  RUTA_CUERPO,
  RUTA_BASE,
  OJOS,
  OJO,
  RECORRIDO_PARPADO,
  puntoDeEscritura,
  type Pose,
} from './poses';

/**
 * The one who writes things down.
 *
 * A recorder, not a tutor: it does not teach, does not encourage, and
 * never celebrates — with exactly one exception, finishing a full
 * simulacro. See `docs/PERSONAJE.md` for where it appears and why it
 * stays silent in the toll.
 *
 * Vector rather than frames. A blink is one number changing instead
 * of four images, the whole thing is some 8KB instead of ~2MB, and it
 * follows the accent colour without regenerating anything.
 *
 * It is decorative: hidden from screen readers unless it is tappable.
 * Nothing it communicates exists only in the character — if an answer
 * was wrong, the text says so and the pose is reinforcement.
 */

const GAnimado = Animated.createAnimatedComponent(G);

export function Personaje({
  pose = 'espera',
  tamano = 64,
  alTocar,
  etiqueta,
}: {
  pose?: Pose;
  tamano?: number;
  /** Makes it a button — the hint. Without this it is decoration. */
  alTocar?: () => void;
  etiqueta?: string;
}) {
  const figura = POSES[pose];
  const sinMovimiento = useReducedMotion();
  const { fontScale } = useWindowDimensions();

  /* 0 = clear of the eye, 1 = covering it. Shared by the pose and by
     the blink, so a blink that lands mid-transition returns to
     whatever the pose asked for rather than snapping open. */
  const parpado = useSharedValue(figura.parpado);
  const miradaX = useSharedValue(figura.mirada[0]);
  const miradaY = useSharedValue(figura.mirada[1]);
  const inclina = useSharedValue(figura.inclina);

  const suave = { duration: duracion.pose, easing: Easing.out(Easing.back(1.2)) };
  const ir = (v: number) => (sinMovimiento ? v : withTiming(v, suave));

  useEffect(() => {
    parpado.value = ir(figura.parpado);
    miradaX.value = ir(figura.mirada[0]);
    miradaY.value = ir(figura.mirada[1]);
    inclina.value = ir(figura.inclina);
  }, [pose]);

  /* Blinking, at an irregular interval. On a fixed rhythm it reads as
     a machine; the randomness is what makes it feel alive. */
  useEffect(() => {
    if (sinMovimiento) return;
    let vivo = true;
    let temporizador: ReturnType<typeof setTimeout>;

    const ciclo = () => {
      temporizador = setTimeout(() => {
        if (!vivo) return;
        parpado.value = withSequence(
          withTiming(1, { duration: duracion.parpadeoBaja, easing: Easing.in(Easing.ease) }),
          withTiming(POSES[pose].parpado, {
            duration: duracion.parpadeoSube,
            easing: Easing.out(Easing.ease),
          }),
        );
        ciclo();
      }, 2800 + Math.random() * 4200);
    };
    ciclo();
    return () => {
      vivo = false;
      clearTimeout(temporizador);
    };
  }, [pose, sinMovimiento]);

  const cuerpoAnimado = useAnimatedProps(() => ({
    transform: [{ translateX: 160 }, { translateY: 250 }, { rotate: `${inclina.value}deg` }, { translateX: -160 }, { translateY: -250 }],
  }));

  const lapiz = puntoDeEscritura(figura.libreta);
  const marcas = figura.hoja === 'limpia' ? 0 : 3;

  const contenido = (
    <Svg width={tamano} height={tamano * (300 / 320)} viewBox="0 0 320 300">
      <Defs>
        <ClipPath id="cuerpo">
          <Path d={RUTA_CUERPO} />
        </ClipPath>
        {OJOS.map((o, i) => (
          <ClipPath id={`ojo${i}`} key={i}>
            <Ellipse cx={o.cx} cy={o.cy} rx={OJO.rx} ry={OJO.ry} />
          </ClipPath>
        ))}
      </Defs>

      <GAnimado animatedProps={cuerpoAnimado}>
        <Path d={RUTA_CUERPO} fill={color.capaAlta} />
        <G clipPath="url(#cuerpo)">
          <Path d={RUTA_BASE} fill={color.linea} />
        </G>

        {OJOS.map((o, i) => (
          <OjoAnimado key={i} cx={o.cx} cy={o.cy} indice={i} parpado={parpado} mx={miradaX} my={miradaY} />
        ))}

        {/* The notepad always rotated and always breaking the body
            outline. Square to the viewer and centred, it reads as a
            mouth with teeth — that cost three rounds of drawing. */}
        <G transform={`translate(${figura.libreta.x} ${figura.libreta.y}) rotate(${figura.libreta.rot})`}>
          <Rect x={0} y={0} width={92} height={112} rx={9} fill={color.acento} />
          <Rect x={6} y={13} width={80} height={93} rx={5} fill={color.capa} />
          {[0, 1, 2, 3, 4].map((i) => (
            <Rect key={i} x={14 + i * 16} y={-5} width={5} height={20} rx={2.5} fill={color.acento} />
          ))}
          {Array.from({ length: marcas }, (_, i) => (
            <Path
              key={i}
              d={`M18 ${40 + i * 18} L${i === 1 ? 54 : i === 2 ? 66 : 62} ${40 + i * 18}`}
              stroke={color.texto}
              strokeWidth={4.5}
              strokeLinecap="round"
            />
          ))}
          {figura.hoja === 'tachada' ? (
            <Path d="M14 62 L62 50" stroke={color.texto} strokeWidth={4.5} strokeLinecap="round" />
          ) : null}
        </G>

        {figura.lapiz ? (
          <G transform={`translate(${lapiz.x} ${lapiz.y}) rotate(${lapiz.rot})`}>
            <Path d="M0 0 L13 0 L13 74 L6.5 88 L0 74 Z" fill={color.bordeControl} />
            <Path d="M0 0 L13 0 L13 15 L0 15 Z" fill={color.texto} />
            <Path d="M0 74 L6.5 88 L13 74 Z" fill={color.texto} />
          </G>
        ) : null}
      </GAnimado>
    </Svg>
  );

  if (!alTocar) {
    return (
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {contenido}
      </View>
    );
  }

  /* Tappable means it is the hint, and a hint is a button. The hit
     area grows with the font scale so it stays reachable. */
  return (
    <Pressable
      onPress={alTocar}
      accessibilityRole="button"
      accessibilityLabel={etiqueta ?? 'Pedir una pista'}
      hitSlop={Math.max(8, 12 * fontScale)}
    >
      {contenido}
    </Pressable>
  );
}

/* Created once at module scope. Calling createAnimatedComponent on
   every render makes a new component type each time, which remounts
   the eye and kills the animation mid-blink. */
const PupilaAnimada = Animated.createAnimatedComponent(Circle);
const ParpadoAnimado = Animated.createAnimatedComponent(Path);

function OjoAnimado({
  cx,
  cy,
  indice,
  parpado,
  mx,
  my,
}: {
  cx: number;
  cy: number;
  indice: number;
  parpado: SharedValue<number>;
  mx: SharedValue<number>;
  my: SharedValue<number>;
}) {
  const pupila = useAnimatedProps(() => ({
    cx: cx + mx.value * 9,
    cy: cy + 4 + my.value * 11,
  }));

  /* A blind, not an oval. An oval taller than the eye shows its
     BOTTOM edge first as it comes down, which reads as a lower lid
     rising — the opposite of a blink. This is a tall rectangle with a
     curved base, resting well above the eye. */
  const alto = OJO.ry * 3;
  const reposo = cy - OJO.ry - 9;
  const forma = `M${cx - OJO.rx - 3} ${cy - OJO.ry - alto} L${cx + OJO.rx + 3} ${
    cy - OJO.ry - alto
  } L${cx + OJO.rx + 3} ${reposo} Q${cx} ${reposo + 15} ${cx - OJO.rx - 3} ${reposo} Z`;

  const tapa = useAnimatedProps(() => ({
    transform: [{ translateY: parpado.value * RECORRIDO_PARPADO }],
  }));

  return (
    <G>
      <Ellipse cx={cx} cy={cy} rx={OJO.rx} ry={OJO.ry} fill={color.capa} />
      <PupilaAnimada animatedProps={pupila} cx={cx} cy={cy + 4} r={OJO.pupila} fill={color.texto} />
      <G clipPath={`url(#ojo${indice})`}>
        <ParpadoAnimado animatedProps={tapa} d={forma} fill={color.bordeControl} />
      </G>
    </G>
  );
}
