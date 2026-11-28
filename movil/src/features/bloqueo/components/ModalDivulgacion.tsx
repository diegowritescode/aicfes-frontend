import { Modal, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton, Tarjeta, Texto } from '@/shared/ui';
import type { Divulgacion } from '../model/divulgacion';

/**
 * What the learner reads before the app asks for app-usage access.
 *
 * Required by Play's User Data policy, and required to appear
 * «immediately preceded by» the permission request — so it opens
 * from the button that would have gone straight to Settings, and
 * nowhere else.
 *
 * Three rules this component exists to obey, each one written in
 * Google's policy as a sentence:
 *
 * 1. **Navigating away is not consent.** «Must not interpret
 *    navigation away from the disclosure (including tapping away or
 *    pressing the back or home button)» as agreement. So there is no
 *    backdrop to tap, and the hardware back button closes WITHOUT
 *    consenting — `onRequestClose` goes to the same place as «Ahora
 *    no».
 * 2. **No auto-dismiss.** Nothing here has a timer.
 * 3. **Nothing unrelated.** «Cannot be included with other
 *    disclosures unrelated to personal and sensitive user data
 *    collection» — so no terms of service, no privacy policy link as
 *    a substitute, no sign-up, nothing but this one permission.
 *
 * It is a full screen rather than a small dialog on purpose: a modal
 * someone can see around reads as skippable, and this is the one
 * screen a reviewer will look for.
 */
export function ModalDivulgacion({
  texto,
  visible,
  onAceptar,
  onRechazar,
}: {
  texto: Divulgacion;
  visible: boolean;
  /** The learner agreed. Only this leads to the system screen. */
  onAceptar: () => void;
  /** «Ahora no», the back button, or anything else that is not a yes. */
  onRechazar: () => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      /* Opaque: a see-through sheet invites tapping outside, and a
         tap outside must never read as agreement. */
      presentationStyle="fullScreen"
      /* Android's back button. Routed to the refusal, deliberately:
         the policy names it as something that is NOT consent. */
      onRequestClose={onRechazar}
    >
      <SafeAreaView className="flex-1 bg-fondo">
        <View className="flex-1 justify-between gap-6 px-5 py-6">
          <View className="gap-5">
            <Texto estilo="titulo-grande">{texto.titulo}</Texto>

            {/* What is read, and what for. Google's own template:
                «[app] collects [data] to enable [feature], [when]». */}
            <Texto estilo="cuerpo">{texto.queRecogemos}</Texto>

            {/* Where it goes. Set apart because it is the answer to
                the question a 16-year-old actually has. */}
            <Tarjeta variante="acento">
              <Texto estilo="cuerpo">{texto.aDondeVa}</Texto>
            </Tarjeta>

            <View className="gap-2">
              {texto.puntos.map((punto) => (
                <View key={punto} className="flex-row gap-2">
                  <Texto estilo="apoyo">•</Texto>
                  <Texto estilo="apoyo" className="flex-1">
                    {punto}
                  </Texto>
                </View>
              ))}
            </View>
          </View>

          <View className="gap-2">
            {/* Affirmative action, and the label says what happens
                next: the system settings screen, not a silent grant. */}
            <Boton alTocar={onAceptar}>{texto.aceptar}</Boton>
            <Boton variante="plano" alTocar={onRechazar}>
              {texto.rechazar}
            </Boton>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
