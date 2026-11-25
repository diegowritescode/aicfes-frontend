# AICFES — Android y web

Un solo código para Android y para la web. Reemplaza el frontend de
Vite en `../src`, que sigue en producción hasta que esto lo sustituya.

## Correr

```sh
npm install
npx expo start            # elige Android, o 'w' para web
```

La URL de la API sale de `app.json` (`expo.extra.apiUrl`) o de
`EXPO_PUBLIC_API_URL`. Falla ruidosamente si no está: un build que
apunta en silencio a localhost llega a un teléfono y falla ahí, donde
nadie puede ver la consola.

## Verificar

```sh
npm run typecheck
npm test                  # incluye las pruebas de arquitectura
npm run verificar:api     # contra el servidor real
```

`verificar:api` es el que encuentra lo que las pruebas unitarias no
pueden: una prueba con `fetch` simulado demuestra que el cliente
maneja una forma, no que la forma sea la correcta. Así se descubrió
que `expiresIn` llega como `"7d"` y no como número.

Con `VERIFICAR_ENTRENAMIENTO=1` recorre también generación, sesión,
respuestas y tutoría. Cuesta una generación real, por eso no corre por
defecto.

## Construir

```sh
npx expo export --platform android
npx expo export --platform web
```

Para producción web, la imagen hace lo mismo detrás de nginx:

```sh
docker build --build-arg EXPO_PUBLIC_API_URL=https://aicfes-backend.deviego.xyz .
```

### La APK, y cuál de las dos

```sh
npx eas-cli build --platform android --profile preview
```

**`preview` es la que sirve para probar en un teléfono.** El
JavaScript va empaquetado dentro del APK: se instala, se abre y
funciona sola.

**`development` no.** Deja el JavaScript fuera a propósito, así que al
abrirla pide la IP de un computador con `npx expo start` en la misma
red. Es cómoda para desarrollar —se cambia una pantalla y el teléfono
la recarga— e inútil para entregarle la app a alguien. Que diga "Expo
development build" y pida una IP no significa que no sea un APK: es un
APK al que le falta el código.

**`production`** hace un `.aab` para Play Store, no un APK.

### Compilar en el Mac, sin EAS

El plan gratuito de EAS da unos pocos builds de Android al mes y se
agota. Compilar localmente no tiene cuota:

```sh
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export JAVA_HOME=$(/usr/libexec/java_home -v 21)

npx expo prebuild --platform android --no-install   # solo la primera vez
cd android && ./gradlew assembleRelease --no-daemon --max-workers=2
```

La APK sale en
`android/app/build/outputs/apk/release/app-release.apk`, firmada con
la clave de depuración — sirve para instalar a mano, no para Play
Store.

**Lo que hace falta tener**, todo por Homebrew:
`android-commandlinetools`, `openjdk@21`, y del SDK:
`platform-tools`, `platforms;android-36`, `build-tools;36.0.0`
(`sdkmanager` los instala).

**Dos trampas que ya costaron un intento fallido:**

El **JDK por omisión puede ser demasiado nuevo**. Gradle de Android no
corre con Java 26; de ahí el `JAVA_HOME` explícito al 21.

Y el build **muere sin memoria** con la configuración por omisión: las
compilaciones de C++ de `reanimated` y `worklets` son pesadas, y
cuatro en paralelo con 2 GB de heap tumbaron todo con un exit 137.
`gradle.properties` ya pide 6 GB y `org.gradle.workers.max=2`. En una
máquina con más RAM se puede subir.

La primera vez tarda 15-20 minutos porque compila todo el código
nativo. Las siguientes son mucho más rápidas: Gradle cachea.

La carpeta `android/` la genera `prebuild` y **no se commitea**: se
regenera desde `app.json`, y una copia vieja ahí anularía en silencio
la configuración de la que salió.

Las tres pasan su propio nombre en `EXPO_PUBLIC_PERFIL_BUILD`, que es
como el código distingue un build de prueba del de tienda. `__DEV__`
no sirve para eso —es `false` en un APK `preview`— y `NODE_ENV`
tampoco, porque vale `production` en los dos. Las pantallas de prueba
se esconden con `entorno.esDePrueba`.

## Dónde va cada cosa

`ARQUITECTURA.md` lo explica con el porqué. En corto:

| Carpeta | Qué va ahí |
|---|---|
| `core/` | HTTP, almacenamiento, configuración |
| `shared/` | lo que usan tres o más features |
| `features/` | una carpeta por capacidad del producto |
| `app/` | rutas; solo ensamblan |

Las reglas se verifican solas en `src/shared/arquitectura/capas.test.ts`.
