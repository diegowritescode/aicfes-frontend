# Arquitectura

Para Android y web desde el mismo código. Este documento dice **qué va
dónde y por qué**, porque la razón es lo que se pierde primero.

## El problema que esto resuelve

El frontend web tiene 9.750 líneas y estos síntomas:

| Síntoma | Medido |
|---|---|
| `api.ts` | 1.233 líneas, 34 funciones, 36 interfaces |
| `Test.tsx` | 482 líneas, 10 `useEffect` |
| `Results.tsx` | 595 líneas, 7 `useEffect` |
| react-query | instalado, **0 usos** |
| Páginas que llaman la API directo | 14 |

Ninguno es un bug. Todos son el mismo problema: **no hay una capa que
separe "hablar con el servidor" de "dibujar la pantalla"**, así que
cada pantalla resuelve otra vez carga, error, reintento y caché.

## Las capas

El flujo va en una sola dirección. Una capa conoce la de abajo y nunca
la de arriba.

```
app/        rutas (expo-router). Sólo ensamblan.
   ↓
features/   una carpeta por capacidad del producto
   ↓
shared/     lo que de verdad comparten varias features
   ↓
core/       cliente HTTP, almacenamiento, configuración
```

### `core/` — lo que toca el mundo exterior

El único sitio que sabe de HTTP, de tokens y del dispositivo. Si mañana
cambia el transporte, cambia aquí y en ningún otro lado.

No importa nada de `features/`.

### `shared/` — lo común, de verdad

Los primitivos de interfaz y los helpers que usan **tres o más**
features. El umbral es deliberado: mover algo a `shared/` en cuanto lo
usan dos acaba con un cajón de sastre que todo el mundo importa y nadie
entiende.

No importa nada de `features/`.

### `features/` — una carpeta por capacidad

```
features/examen/
  api/            llamadas al servidor y esquemas de respuesta
  hooks/          react-query: carga, caché, invalidación
  components/     interfaz propia de esta feature
  model/          tipos y reglas de negocio puras
```

Las features hoy: `examen`, `simulacro`, `contrarreloj`, `repaso`,
`peaje` (en `offline/`), `panel`, `tutoria`, `feedback`,
`recordatorio`, `sesion`, `duelos` y `moderacion`.

**Una feature no importa de otra feature.** Si dos necesitan lo mismo,
baja a `shared/`. Esta regla es la que mantiene el proyecto navegable:
sin ella, en seis meses todo depende de todo y no se puede tocar nada.

### `app/` — rutas

Archivos de `expo-router`. Ensamblan lo que la feature expone. Una ruta
larga es señal de que falta un componente en la feature.

## Las tres reglas que importan

**1. Los datos del servidor no viven en `useState`.**

Viven en react-query. Eso es lo que elimina los 10 `useEffect` de
`Test.tsx`: carga, error, reintento, caché e invalidación dejan de
escribirse a mano en cada pantalla.

`useState` queda para lo que de verdad es local: un campo de texto a
medio escribir, un panel abierto.

**2. Lo que llega del servidor se valida.**

Cada respuesta pasa por un esquema Zod antes de entrar a la aplicación.
No es ceremonia: el backend evoluciona, y un campo que cambió de forma
debe fallar en la frontera con un mensaje claro, no tres pantallas
después con `undefined is not an object`.

**3. Las reglas de negocio no viven en los componentes ni en los hooks.**

Si se puede probar sin renderizar, va en `model/`. Calcular el tiempo
restante, decidir si una pregunta cuenta como respondida, ordenar áreas
por debilidad — eso es lógica, y la lógica se prueba sin montar una
pantalla.

Y hay una razón mecánica además de la estética: un archivo que importa
`react-native` no se puede parsear en Node, porque trae tipos Flow. Una
función pura escondida en un hook es una función que **nadie puede
probar**. Eso pasó con `repartirMixto`: la suite falló, y por eso vive
en `model/`.

## Esto se verifica, no se promete

`src/shared/arquitectura/capas.test.ts` falla la compilación si:

- una feature importa de otra feature (con una excepción nombrada:
  `examen -> tutoria`, que es composición)
- `core/` mira hacia arriba
- `shared/` importa de `features/`
- algo en `model/` importa `react` o `react-native`

Escribir esas pruebas encontró **seis violaciones reales** el primer
día, y siguen cobrando: el 23 nov 2026 atraparon que `Menu.tsx`
(en `shared/`) importara el hook de la feature de moderación. El
arreglo fue un hook en `shared/` sobre el almacén de `core/`, del que
solo sale un booleano. Una regla en un README es una regla hasta el
primer afán.

`src/shared/arquitectura/estabilidad.test.ts` vigila otra cosa: que
una pregunta en pantalla **no se recargue sola**. Existe porque pasó
dos veces — el peaje saltaba de pregunta al tocar una opción, y la
pantalla de repaso rebarajaba las opciones *después* de que el
estudiante había respondido, porque la lista viva traía identidades
nuevas. Hoy también fija:

- que la ronda de duelo congele sus preguntas y que su consulta no
  pueda recargarlas por debajo (un duelo se puntúa contra otra
  persona: una pregunta que cambia a media ronda pierde el duelo por
  algo que el estudiante no puede ver);
- que el esquema del duelo **no acepte** `respuesta_correcta` ni
  `explicaciones`, porque el servidor no las manda y el duelo no se
  gana leyendo una respuesta HTTP;
- que nada de moderación se asome sin token en el teléfono, en los
  tres sitios que podrían filtrarlo: el aviso de Inicio, la entrada
  del menú y las propias peticiones.

Ese último grupo importa por una razón incómoda: **el fallo es
invisible desarrollando**, porque quien construye la función tiene un
token en su dispositivo y nunca vería la versión filtrada. Cada regla
nueva se comprobó rompiéndola a propósito y viendo fallar la prueba.

## Por qué NativeWind y no StyleSheet

Las 824 `className` del web sobreviven. `<div className="flex gap-4">`
pasa a `<View className="flex gap-4">`: cambia la etiqueta, no el
estilo. Con `StyleSheet.create` habría que reescribir cada una.

## Rutas de importación

`@/core/...`, `@/shared/...`, `@/features/...`. Sin rutas relativas que
suban dos niveles: un `../../../` es una invitación a mover un archivo
y romper diez.
