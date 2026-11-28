# Lo que hay que llenar en Google Play Console

Las respuestas de los formularios de Play, derivadas de lo que la app
hace de verdad. Cada afirmación aquí se midió leyendo el código o el
manifest fusionado, no se dedujo.

**Por qué existe este archivo.** El Data safety y la política de
privacidad tienen que concordar campo por campo: Google trata un
desajuste como motivo de acción, y la política dice «Your Data safety
form responses must remain accurate and complete at all times». Si
alguien cambia el código y no vuelve aquí, el formulario publicado se
vuelve falso. Las guardas que lo sostienen están listadas al final.

---

## 1. Público objetivo y contenido

| Campo | Respuesta |
|---|---|
| Grupos de edad | **16-17** y **18 y más** |
| ¿Dirigida a niños? | No |
| ¿Anuncios? | **No.** La app no muestra publicidad de ningún tipo |
| Programa Designed for Families | No aplica |

### Pantalla neutral de edad: no se necesita

Google exige la pantalla neutral de edad para que «any ads not
suitable for children are only shown to older audiences», o para usar
un SDK no aprobado para servicios dirigidos a menores. **La app no
tiene anuncios ni SDK de terceros en el cliente**, así que el
disparador no se cumple.

Esto se verificó contra la política, no se asumió. Si algún día se
añade publicidad, la pantalla pasa a ser obligatoria el mismo día.

### Lo que sí aplica por incluir menores

- **Recordatorio de seguridad en línea** antes de intercambiar texto
  libre. Implementado en `/perfil-publico`, arriba de los campos
  (`RecordatorioDeSeguridad`).
- **Autorización del acudiente** antes de las funciones sociales.
  Implementada como `tutorAutorizoEn`; sin ella, alias público, duelos
  y amistades no se activan.
- **Forma de desactivar lo social.** Los dos interruptores de
  `/privacidad`, ambos reversibles.
- **Prohibido transmitir identificadores persistentes** de un menor o
  de edad desconocida. Sin campo de edad, todos son de edad
  desconocida: la app no toca ninguno de los nueve.

---

## 2. Data safety

«Collect» en el formulario significa **transmitir datos fuera del
aparato**. Lo que se queda en el teléfono no se declara. Esa
definición es la que decide casi todo lo de abajo.

### Sí se recoge y se transmite

| Tipo | Dato | ¿Obligatorio? | Para qué | ¿Se comparte? |
|---|---|---|---|---|
| Información personal | Dirección de correo | Sí | Gestión de la cuenta | No |
| Mensajes | Lo que el estudiante escribe al tutor | No | Función de la app | **Sí**, a OpenAI |
| Mensajes | Alias y descripción (120 caracteres) | No | Función de la app, interacción social | No |
| Actividad en la app | Respuestas a ejercicios, tiempos, aciertos | Sí | Función de la app, análisis del propio progreso | No |
| Actividad en la app | Racha, XP, nivel, logros | Sí | Función de la app | No |

- **Cifrado en tránsito:** sí, HTTPS en todas las rutas.
- **Borrado de cuenta:** sí. Se pide a
  `privacidad@aicfes.deviego.xyz`; se elimina todo lo asociado en un
  máximo de 30 días.
- **Datos recogidos de forma opcional:** el tutor, el alias y la
  descripción. La app funciona sin ninguno.

### NO se recoge — y por qué, con evidencia

| Lo que Play pregunta | Respuesta | Evidencia |
|---|---|---|
| Apps instaladas | **No** | El bloqueo lee cuál app está adelante y eso nunca sale del aparato. Android tampoco entrega los nombres de paquete a JavaScript: el módulo devuelve un id opaco. Guarda: `el-uso-no-viaja.test.ts` |
| Interacciones con otras apps | **No** | Igual que arriba: local, nunca transmitido |
| Ubicación | **No** | Sin permiso de ubicación en el manifest fusionado |
| Contactos | **No** | Sin permiso de contactos |
| Fotos, vídeos, archivos | **No** | Sin selector de imágenes. El avatar son 24 figuras SVG dentro de la app; se guarda un slug y un índice, nunca una imagen. Guarda: `avatar-sin-fotos.test.ts` |
| Micrófono, audio | **No** | `RECORD_AUDIO` se quita del manifest. La app solo reproduce cuatro tonos sintetizados |
| Identificadores del dispositivo | **No** | Sin `expo-device`, sin analítica, sin reporte de fallos. Única cabecera añadida: `X-Cliente: movil`. Guarda: `ningun-identificador-de-dispositivo.test.ts` |
| Información financiera | **No** | No hay pasarela de pago todavía |
| Salud, estado físico | **No** | — |
| Historial de navegación web | **No** | — |
| Dirección IP | **No** | El servidor la lee como clave de límite de peticiones en un `Map` en memoria. Nunca a la base, nunca a un log, muere con el proceso: no es «transmitir fuera del aparato» ni almacenamiento |

### Terceros que reciben datos

| Proveedor | Qué recibe | Qué NO recibe |
|---|---|---|
| **OpenAI** | El enunciado del ejercicio, las opciones y lo que escribió el estudiante | El correo, el alias y el identificador de la cuenta. Verificado en `tutoria.service.ts` |
| **Resend** | La dirección de destino y el texto de los correos del sistema | El texto libre de la denuncia, los correos de los involucrados y los ids. Guarda: `correo-denuncia.test.ts` |
| **Hostinger** | Aloja el servidor, en Boston, Estados Unidos | — |
| **Firebase (messaging)** | Solo el token de notificaciones push | Sin Analytics, sin `AD_ID`, sin anuncios |

---

## 3. Permisos que el revisor va a ver

| Permiso | Para qué | Cómo se declara |
|---|---|---|
| `INTERNET`, `ACCESS_NETWORK_STATE` | Hablar con el servidor | Normal |
| `PACKAGE_USAGE_STATS` | Saber qué app está adelante, para mostrar las preguntas encima | **Acceso especial.** No tiene formulario de permisos declarados, pero sí exige divulgación prominente en la app |
| `SYSTEM_ALERT_WINDOW` | Dibujar el escudo sobre la otra app | Acceso especial |
| `POST_NOTIFICATIONS` | Recordatorios de estudio | Diálogo del sistema |
| `FOREGROUND_SERVICE_SPECIAL_USE` | El servicio que vigila el bloqueo | Normal |
| `RECEIVE_BOOT_COMPLETED` | Que el bloqueo siga activo tras reiniciar | Normal |

### Lo que deliberadamente NO se declara

- **`BIND_DEVICE_ADMIN`** — un admin activo impide desinstalar, y Play
  solo lo permite a apps de control parental autorizadas por un
  acudiente o a administración empresarial. Un estudiante que se
  restringe a sí mismo no encaja. Se quita con `tools:node="remove"`.
- **`AccessibilityService`** — es el mayor riesgo de revisión para una
  app que bloquea apps: declaración en Console, video demo,
  documentación en la ficha. No se usa:
  `accessibilityEngine: false`. Google además pide «more narrowly
  scoped APIs in lieu of the Accessibility API when possible», y
  UsageStats más overlay *es* esa alternativa.
- **`QUERY_ALL_PACKAGES`** — permiso restringido. No se necesita: el
  estudiante escoge las apps en un selector del sistema y el módulo
  devuelve un id opaco.

### Divulgación prominente

Play exige que la divulgación esté «immediately preceded by» la
petición del permiso. Implementada en `ModalDivulgacion`, interpuesta
en `pedirSiguiente`, que es el único camino a la pantalla de Ajustes.

Las tres reglas que el componente existe para cumplir:

1. Navegar fuera **no** es consentimiento. El botón atrás va al
   rechazo, no hay fondo que tocar.
2. Sin cierre automático. Nada tiene temporizador.
3. Nada ajeno. Solo ese permiso: ni términos, ni registro.

---

## 4. Clasificación de contenido (IARC)

El cuestionario no se ramifica según el público declarado; son dos
declaraciones independientes.

| Pregunta | Respuesta |
|---|---|
| Violencia, sexo, lenguaje, drogas, apuestas | No, en todas |
| ¿Los usuarios interactúan entre sí? | **Sí** — duelos y amistades |
| ¿Pueden compartir texto libre? | **Sí** — alias y descripción, 120 caracteres |
| ¿Pueden compartir ubicación? | No |
| ¿Pueden compartir fotos? | No |
| ¿Compras dentro de la app? | No, todavía |

La interacción social obliga a describir la moderación: hay bloqueo,
hay denuncia, y las denuncias las revisa una persona.

### «Addictive elements»

El centro de ayuda dice que una app «may not be suitable» para 16-17
si tiene elementos adictivos. Vale la pena anotar qué peso tiene eso:
la frase aparece **cero veces** en la política consolidada, nunca se
define, y Google lista insignias, niveles y desbloqueos como
incentivos apropiados para edades mucho menores.

Las rachas, el XP y los duelos de AICFES son mecánicas estándar de app
educativa. El bullet con dientes de verdad de esa lista es «high spend
thresholds», que no aplica porque no hay compras. Además, la función
central de la app **reduce** el uso del teléfono.

---

## 5. Antes de subir

- [ ] La política de privacidad responde en
      `https://aicfes-backend.deviego.xyz/privacidad.html`.
      **Requiere desplegar el backend**: la imagen se etiqueta con el
      SHA de `main` y hay que subir `AICFES_API_TAG`. Mientras
      devuelva 404, no se pega esa URL en Play Console
- [ ] Volver a probar el bloqueo en el teléfono **sin** el receptor de
      device admin. La versión que Diego probó lo tenía. El receptor
      nunca se activaba, así que debería funcionar igual, pero eso es
      un razonamiento y hay que convertirlo en medida
- [ ] Data safety y clasificación, con este archivo al lado
- [ ] Primer `app-bundle` a internal testing:
      `eas build --platform android --profile production`

---

## Las guardas que sostienen este archivo

Si alguna de estas se pone roja, el formulario publicado dejó de ser
cierto y hay que volver aquí antes de arreglar el test.

| Guarda | Qué afirma |
|---|---|
| `el-manifest-fusionado.test.ts` | Lo que Play de verdad lee: sin device admin, sin micrófono, sin accesibilidad, sin `QUERY_ALL_PACKAGES`; y **con** los dos permisos que el bloqueo necesita |
| `el-uso-no-viaja.test.ts` | Nada de lo que el estudiante hace en otras apps sale del teléfono |
| `ningun-identificador-de-dispositivo.test.ts` | Ninguno de los nueve identificadores que Play prohíbe aparece en `src`, ni hay SDK que los transmita |
| `nada-de-device-admin.test.ts` | El paso nunca se le ofrece al estudiante, y el plugin corre después del de la librería |
| `divulgacion.test.ts` | El texto de la divulgación cumple la plantilla de Google |
| `seguridad-en-linea.test.ts` | El recordatorio nombra el riesgo, da una salida, y se renderiza **antes** de los campos |
| `avatar-sin-fotos.test.ts` | No entra un selector de imágenes ni un campo de URL |
| `politica-de-privacidad.test.ts` (backend) | La política entra en la imagen y sus afirmaciones siguen ahí |
| `correo-denuncia.test.ts` (backend) | El correo de moderación no lleva el texto del estudiante, ni ids, ni correos |
