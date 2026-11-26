import { Text, View } from 'react-native';

/**
 * Someone else, in two letters.
 *
 * A squared-off rounded tile rather than a circle: the whole design
 * is built on 12–20px radii, and a circle beside those reads as
 * borrowed from somewhere else.
 *
 * No photographs. These are minors, the accounts are made with a
 * school email, and a duel does not need a face to work. Initials
 * also never fail to load, which matters on the connections this app
 * actually runs on.
 */

/** Two letters at most: more does not fit and does not help. */
function iniciales(nombre: string): string {
  const partes = nombre
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0]!.slice(0, 2).toUpperCase();
  return (partes[0]![0]! + partes[partes.length - 1]![0]!).toUpperCase();
}

export function Avatar({
  nombre,
  tamano = 'normal',
}: {
  nombre: string;
  /** `chico` is for the opponent's name inside a running duel. */
  tamano?: 'normal' | 'chico';
}) {
  const chico = tamano === 'chico';

  return (
    <View
      /* Decorative: the name it stands for is always written beside
         it, so a screen reader announcing «SR» twice is noise. */
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={`items-center justify-center bg-acento-suave ${
        chico ? 'h-[30px] w-[30px] rounded-[10px]' : 'h-10 w-10 rounded-chico'
      }`}
    >
      <Text
        style={{ fontFamily: 'Nunito_800ExtraBold' }}
        className={`text-acento-texto ${chico ? 'text-[12px]' : 'text-[15px]'}`}
      >
        {iniciales(nombre)}
      </Text>
    </View>
  );
}
