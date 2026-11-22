import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton } from '@/shared/ui/Boton';
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
  const { entrar } = useAccionesSesion();
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');

  const enviar = () => {
    if (!email.trim() || !clave) return;
    entrar.mutate({ email: email.trim(), password: clave });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center gap-6 px-6 py-10"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-2">
            <Text className="text-[28px] font-bold tracking-tight text-slate-900">
              Entrar
            </Text>
            <Text className="text-[15px] leading-relaxed text-slate-600">
              Siga donde quedó.
            </Text>
          </View>

          <View className="gap-4">
            <Campo
              etiqueta="Correo"
              valor={email}
              onCambiar={setEmail}
              tipo="email"
              placeholder="suemail@ejemplo.com"
            />
            <Campo
              etiqueta="Contraseña"
              valor={clave}
              onCambiar={setClave}
              tipo="clave"
              alEnviar={enviar}
            />
          </View>

          {entrar.isError ? <Aviso mensaje={entrar.error.mensaje} /> : null}

          <Boton
            onPress={enviar}
            cargando={entrar.isPending}
            deshabilitado={!email.trim() || !clave}
            tamano="grande"
            ancho
          >
            {entrar.isPending ? 'Entrando…' : 'Entrar'}
          </Boton>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
