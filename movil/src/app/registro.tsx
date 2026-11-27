import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Boton, Texto } from '@/shared/ui';
import { Campo } from '@/shared/ui/Campo';
import { Aviso } from '@/shared/ui/Aviso';
import { useAccionesSesion } from '@/features/sesion/hooks/useSesion';
import {
  tieneErrores,
  validarRegistro,
  type ErroresRegistro,
} from '@/features/sesion/model/validacion';

/**
 * Creating an account.
 *
 * Validation runs before the request, so a short password costs a
 * message rather than a round trip on mobile data. Errors appear under
 * the field they belong to, and only after an attempt — flagging a
 * half-typed address as wrong is a scold, not help.
 */
export default function RutaRegistro() {
  const router = useRouter();
  const { registrar } = useAccionesSesion();

  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [errores, setErrores] = useState<ErroresRegistro>({});

  const enviar = () => {
    const encontrados = validarRegistro(email, clave);
    setErrores(encontrados);
    if (tieneErrores(encontrados)) return;
    registrar.mutate(
      { email: email.trim(), password: clave },
      { onSuccess: () => router.replace('/inicio') },
    );
  };

  return (
    /* `fondo`, the same surface as the sign-in form and every other
       screen. On white a disabled button's `capa-alta` fill measures
       1,04:1 against the page and disappears. */
    <SafeAreaView className="flex-1 bg-fondo">
      {/* Scrolls the focused field into view, which is the part a
          plain `KeyboardAvoidingView` never did. Under Expo 58's
          edge-to-edge the window no longer resizes for the keyboard,
          so the field a learner was typing into sat behind it and
          they had to dismiss the keyboard to read their own words.
          `bottomOffset` keeps a line of breathing room above the
          keyboard instead of pinning the field to its very edge. */}
      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerClassName="flex-grow justify-center gap-6 px-5 py-10"
        keyboardShouldPersistTaps="handled"
      >
          <View className="gap-2">
            <Texto estilo="titulo-grande">Crear cuenta</Texto>
            <Texto estilo="apoyo">
              Guardamos tu progreso para que no empieces de cero cada vez.
            </Texto>
          </View>

          <View className="gap-4">
            <Campo
              etiqueta="Correo"
              valor={email}
              onCambiar={setEmail}
              tipo="email"
              placeholder="tucorreo@ejemplo.com"
              error={errores.email}
            />
            <Campo
              etiqueta="Contraseña"
              valor={clave}
              onCambiar={setClave}
              tipo="clave"
              error={errores.password}
              alEnviar={enviar}
            />
          </View>

          {registrar.isError ? (
            <Aviso mensaje={registrar.error.mensaje} detalle={registrar.error.detalle} />
          ) : null}

          <Boton alTocar={enviar} cargando={registrar.isPending}>
            {registrar.isPending ? 'Creando…' : 'Crear cuenta'}
          </Boton>

          <Pressable
            onPress={() => router.replace('/entrar')}
            accessibilityRole="link"
            className="min-h-toque justify-center"
          >
            <Texto estilo="apoyo" className="text-center">
              ¿Ya tienes cuenta?{' '}
              <Texto
                estilo="apoyo"
                style={{ fontFamily: 'Inter_600SemiBold' }}
                className="text-acento-texto"
              >
                Entrar
              </Texto>
            </Texto>
          </Pressable>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
