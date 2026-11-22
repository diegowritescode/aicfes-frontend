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

## Dónde va cada cosa

`ARQUITECTURA.md` lo explica con el porqué. En corto:

| Carpeta | Qué va ahí |
|---|---|
| `core/` | HTTP, almacenamiento, configuración |
| `shared/` | lo que usan tres o más features |
| `features/` | una carpeta por capacidad del producto |
| `app/` | rutas; solo ensamblan |

Las reglas se verifican solas en `src/shared/arquitectura/capas.test.ts`.
