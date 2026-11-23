import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Boton } from '@/shared/ui/Boton';
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
              Crear cuenta
            </Text>
            <Text className="text-[15px] leading-6 text-slate-600">
              Guardamos tu progreso para que no empieces de cero cada vez.
            </Text>
          </View>

          <View className="gap-4">
            <Campo
              etiqueta="Correo"
              valor={email}
              onCambiar={setEmail}
              tipo="email"
              placeholder="suemail@ejemplo.com"
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

          {registrar.isError ? <Aviso mensaje={registrar.error.mensaje} detalle={registrar.error.detalle} /> : null}

          <Boton onPress={enviar} cargando={registrar.isPending} tamano="grande" ancho>
            {registrar.isPending ? 'Creando…' : 'Crear cuenta'}
          </Boton>

          <Pressable
            onPress={() => router.replace('/entrar')}
            accessibilityRole="link"
            className="min-h-[44px] justify-center"
          >
            <Text className="text-center text-[14px] text-slate-600">
              ¿Ya tiene cuenta? <Text className="font-semibold text-brand-bright">Entrar</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
