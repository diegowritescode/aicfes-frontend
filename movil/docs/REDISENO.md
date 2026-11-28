# Rediseño v1: plan de trabajo

Written for whoever picks this up, including future me.

## Qué estamos cambiando

La app hoy es **blanca con azul**, heredada de la plantilla: `bg-white`,
`border-slate-200`, `bg-brand-bright`. El sistema de diseño validado es
otro — claro con un solo acento morado, tarjetas sin borde, un color de
estructura por pantalla.

Las pantallas aprobadas están en
<https://claude.ai/artifact/UMP3vGbbEscbtf67Dbcfd2>. Lo que se ve ahí
es el destino.

## Atomic design sobre las capas que ya existen

El proyecto ya tiene capas verificadas por `shared/arquitectura/capas.test.ts`:
`core -> shared -> features -> app`, y una feature no importa de otra.
Eso no se toca. Atomic design se mete **dentro** de `shared/ui`, no
encima de la arquitectura.

```
shared/ui/
  atomos/       Boton, Texto, Chip, Insignia, Riel
  moleculas/    Opcion, Explicacion, Progreso, FilaDato
  organismos/   TarjetaPregunta, BarraDeRespuesta, Personaje
```

**Por qué no hay «templates» ni «pages».** En Expo Router las páginas
son `app/*.tsx` y las plantillas son los `_layout.tsx`. Inventar otra
carpeta para lo mismo crea dos sitios donde buscar la misma cosa.

Un átomo no sabe de ICFES. Una molécula sí puede: `Opcion` conoce la
letra A-D. Un organismo compone y puede tener estado de presentación,
nunca de dominio.

## Los tokens

Van en un solo sitio, `shared/ui/tokens.ts`, generados a mano desde
`tokens.json` del sistema. Nada de hex suelto en un componente: si
aparece uno, es un token que falta.

NativeWind ya está, así que los tokens se exponen también por
`tailwind.config.js` para poder escribir `bg-capa` en vez de estilos
en línea.

## El orden, y por qué

Cada paso deja la app funcionando. Nada de una rama de dos semanas que
no compila.

1. **Tokens y átomos.** Sin cambiar ninguna pantalla todavía. Al final
   de este paso la app se ve igual pero los átomos nuevos existen y
   tienen pruebas.
2. **El personaje.** Su componente y sus animaciones, en
   `shared/ui/organismos/Personaje`. Se prueba en una pantalla sola.
3. **El peaje.** Primero porque es la pantalla que define el producto
   y la que Diego usa a diario: si algo está mal, se nota en horas.
4. **Entrenar, repaso, pregunta del día.** Comparten casi todo.
5. **Inicio y duelos.** Las de más superficie.
6. **Simulacro y contrarreloj.** Las que menos cambian.
7. **Las de sistema** — entrar, registro, bloqueo, moderación. Tokens
   sí, personaje no.

## Estado: los siete pasos están hechos

Los siete, más cuatro cosas que el plan no contemplaba y que
aparecieron al hacerlo:

- **La barra de pestañas reemplazó al cajón.** El artifact pone las
  cinco destinos en pantalla siempre. Eso obligó a crear `app/yo.tsx`,
  porque todo lo que el tablero tenía de más — nivel, XP, retos,
  logros, recordatorio — necesitaba un sitio. `Menu.tsx`,
  `BotonMenu.tsx` y su modelo quedaron huérfanos; siguen en el repo
  porque `estabilidad.test.ts` lee el modelo.
- **El botón de responder salió del scroll.** Con 1200 caracteres de
  contexto quedaba al final de pantalla y media. En el simulacro era
  peor: la navegación estaba dentro del scroll, así que llegar a
  «Siguiente» significaba recorrer el enunciado completo en cada una
  de hasta 254 preguntas.
- **`Contexto` no existía y ahora se usa en todas.** El enunciado
  largo se imprimía entero, empujando las cuatro opciones fuera de
  vista.
- **Los textos sí cambiaron**, contra la regla de abajo. Apareció
  «usted» en entrar, registro y simulacro — a dos toques de pantallas
  que tutean. `tono.test.ts` existía para eso y no vigilaba esos
  archivos; ahora sí. La regla sigue siendo buena, pero un registro
  formal junto a uno informal es un defecto, no una preferencia.

### Lo que el backend tiene que mandar

Tres textos del artifact no se pueden renderizar con lo que llega hoy:

| Lo que falta | Dónde | Qué pasa sin eso |
|---|---|---|
| fecha del examen | inicio | «38 días para el examen» no se muestra |
| área y ronda del duelo | inicio, duelos | la fila dice «5 preguntas» sin materia |
| el distractor repetido y su pista | repaso | la tarjeta del `d = +0,33` muestra solo el conteo |

El tercero es el que más vale. Esa tarjeta es la única pantalla con
efecto positivo medido del producto, y hoy dice «Lo has fallado 3
veces» sin poder decir *qué* eliges siempre. Necesita dos campos en
`errorPendiente`: la opción que el estudiante repite y una línea que
la distinga de la correcta.

Ninguno se inventó. Un conteo falso en la pantalla que mide errores
es exactamente el dato que no se puede falsear.

## Las APK

Tres, en los hitos que valen la pena probar en un teléfono:

- **A** — el personaje y el peaje. Lo que define el producto.
- **B** — las pantallas de estudio: entrenar, repaso, pregunta del día,
  inicio, duelos.
- **C** — la v1 completa.

Entre hitos la app sigue compilando y las pruebas pasando, pero no se
construye APK: cada build son diez minutos y una interrupción.

## Las reglas que no se rompen

- **Nada de hex sueltos.** Hay una prueba que lo verifica.
- **Los textos no cambian en este trabajo.** Rediseño es rediseño; si
  un texto está mal, es otro commit.
- **Cada pantalla migrada se prueba en el teléfono**, no solo en que
  compile. Esta sesión ya enseñó que compilar no es funcionar.
- **Las 429 pruebas siguen pasando** después de cada paso.
- **Nada que se toque mide menos de 44 px.**

## Lo que NO entra en v1

- Modo oscuro. Los tokens lo contemplan y la app se queda en claro:
  `userInterfaceStyle: "light"` ya lo fija.
- Cambiar el acento en caliente. Los tres acentos existen en el
  sistema de diseño para comparar, no como ajuste del usuario.
- Rediseñar moderación. Es herramienta interna.
