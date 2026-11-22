import { Text, TextInput, View } from 'react-native';

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
      <Text className="text-[13.5px] font-semibold text-slate-700">{etiqueta}</Text>
      <TextInput
        value={valor}
        onChangeText={onCambiar}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
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
        className={`min-h-[48px] rounded-2xl border px-4 text-[15px] text-slate-900 ${
          error ? 'border-error' : 'border-slate-200'
        }`}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" className="text-[12.5px] text-error">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
