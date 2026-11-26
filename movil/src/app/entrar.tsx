import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Boton, Texto } from '@/shared/ui';
import { Campo } from '@/shared/ui/Campo';
import { Aviso } from '@/shared/ui/Aviso';
import { useAccionesSesion } from '@/features/sesion/hooks/useSesion';

/**
 * Signing in.
 *
 * The route assembles; it does not decide. Validation lives in the
 * feature's model and the request in its api layer, so this file is
 * about what the learner sees and nothing else.
 *
 * KeyboardAvoidingView is not optional on a phone: without it the
 * keyboard covers the password field and the button, and the form
 * becomes unusable on exactly the devices this app is for.
 */
export default function Entrar() {
  const router = useRouter();
  const { entrar } = useAccionesSesion();
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');

  const enviar = () => {
    if (!email.trim() || !clave) return;
    entrar.mutate(
      { email: email.trim(), password: clave },
      /* Navigating here rather than in the hook: the mutation is about
         the session, and where to go next is this screen's business.
         Omitting it left a successful sign-in sitting on the sign-in
         form with nothing on screen to explain why. */
      { onSuccess: () => router.replace('/inicio') },
    );
  };

  return (
    /* `fondo`, not `capa`. The disabled sign-in button fills with
       `capa-alta` (#f2f1f9), which against white measures 1,04:1 —
       the button was invisible until both fields had text in them,
       found on a real phone on the one screen that gates the whole
       app. On `fondo` the fill is quiet but present, and every other
       screen in the app already sits on it. */
    <SafeAreaView className="flex-1 bg-fondo">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center gap-6 px-5 py-10"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-2">
            <Texto estilo="titulo-grande">Entrar</Texto>
            <Texto estilo="apoyo">Sigue donde quedaste.</Texto>
          </View>

          <View className="gap-4">
            <Campo
              etiqueta="Correo"
              valor={email}
              onCambiar={setEmail}
              tipo="email"
              placeholder="tucorreo@ejemplo.com"
            />
            <Campo
              etiqueta="Contraseña"
              valor={clave}
              onCambiar={setClave}
              tipo="clave"
              alEnviar={enviar}
            />
          </View>

          {entrar.isError ? (
            <Aviso mensaje={entrar.error.mensaje} detalle={entrar.error.detalle} />
          ) : null}

          <Boton
            alTocar={enviar}
            cargando={entrar.isPending}
            deshabilitado={!email.trim() || !clave}
          >
            {entrar.isPending ? 'Entrando…' : 'Entrar'}
          </Boton>

          <Pressable
            onPress={() => router.push('/registro')}
            accessibilityRole="link"
            className="min-h-toque justify-center"
          >
            <Texto estilo="apoyo" className="text-center">
              ¿No tienes cuenta?{' '}
              <Texto
                estilo="apoyo"
                style={{ fontFamily: 'Inter_600SemiBold' }}
                className="text-acento-texto"
              >
                Crear una
              </Texto>
            </Texto>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
