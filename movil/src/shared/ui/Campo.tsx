import { TextInput, View } from 'react-native';
import { Texto } from './atomos/Texto';
import { color } from './tokens';

/**
 * A labelled text field.
 *
 * The label is a real label, tied to the input by accessibilityLabel:
 * a placeholder is not a label, because it disappears exactly when
 * someone needs it — while they are typing.
 *
 * Errors are announced rather than only coloured, and the message sits
 * under the field it belongs to instead of in a summary somewhere else
 * on the screen.
 */
export function Campo({
  etiqueta,
  valor,
  onCambiar,
  error,
  tipo = 'texto',
  placeholder,
  alEnviar,
}: {
  etiqueta: string;
  valor: string;
  onCambiar: (v: string) => void;
  error?: string;
  tipo?: 'texto' | 'email' | 'clave';
  placeholder?: string;
  /** Lets the keyboard's return key submit the form. */
  alEnviar?: () => void;
}) {
  return (
    <View className="gap-1.5">
      <Texto estilo="cuerpo" style={{ fontFamily: 'Inter_600SemiBold' }}>
        {etiqueta}
      </Texto>
      <TextInput
        value={valor}
        onChangeText={onCambiar}
        placeholder={placeholder}
        /* The muted-text token rather than a grey of its own. The
           slate it used to be belonged to the palette this design
           system replaced, and a placeholder lighter than the label
           above it reads as a field that is switched off. */
        placeholderTextColor={color.textoApagado}
        secureTextEntry={tipo === 'clave'}
        autoCapitalize={tipo === 'texto' ? 'sentences' : 'none'}
        autoCorrect={tipo === 'texto'}
        keyboardType={tipo === 'email' ? 'email-address' : 'default'}
        autoComplete={
          tipo === 'email' ? 'email' : tipo === 'clave' ? 'current-password' : 'off'
        }
        returnKeyType={alEnviar ? 'go' : 'next'}
        onSubmitEditing={alEnviar}
        accessibilityLabel={etiqueta}
        accessibilityHint={error}
        /* `borde-control`, not `linea`. The validated design drew
           fields with a #d6d4e6 hairline that measures 1,46:1 against
           white: a field nobody can see is a field nobody fills, and
           these are the two fields standing in front of the app.
           `linea` stays for dividers, where being nearly invisible is
           the whole job. */
        className={`min-h-[48px] rounded-medio border px-4 text-[15px] text-texto ${
          error ? 'border-alerta' : 'border-borde-control'
        }`}
      />
      {error ? (
        /* `alerta` belongs here and nowhere near a wrong answer: an
           unfilled field is work about to be lost, which is the one
           thing this colour is reserved for. */
        <Texto estilo="apoyo" accessibilityLiveRegion="polite" className="text-alerta">
          {error}
        </Texto>
      ) : null}
    </View>
  );
}
