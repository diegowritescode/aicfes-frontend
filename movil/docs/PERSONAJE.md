# El que anota: dónde sale y cómo reacciona

Written for whoever builds or changes the character's appearances.

Antes de escribir componentes hay que cerrar esto, porque la respuesta
cambia qué componentes hacen falta.

## La regla de la que sale todo

El personaje es un **notario**: registra, no enseña ni anima. De ahí
salen tres reglas que no se negocian pantalla por pantalla.

**No ocupa el centro mientras hay una pregunta.** El contenido es la
pregunta. Él está en una esquina, pequeño.

**Solo habla cuando lo invocan o cuando se falló.** Eso ya está en el
código: `debeAbrirTutoria` en `shared/pregunta/model/reglas.ts` abre
solo al fallar y solo si el ítem tiene algo útil que decir. El
comentario de esa función explica por qué — «abrir un panel cuyo
primer mensaje estaría vacío le enseña al estudiante que el panel es
ruido». Eso es el personaje callándose cuando no tiene nada anotado,
escrito meses antes de que el personaje existiera.

**Se celebra lo que costó, no lo que se tocó.** Acertar una pregunta
fácil no produce fiesta. Terminar un simulacro de 254 preguntas, sí.

## Las cuatro poses y qué significa cada una

| Pose | Qué pasó | Qué hace |
|---|---|---|
| `espera` | nada todavía | Quieto, párpados a media asta, mirada a un lado. Parpadea. |
| `acierto` | respondió bien | Un trazo en la libreta y sigue. Sin celebración. |
| `fallo` | respondió mal | Baja la cabeza a la libreta, tacha y reescribe. **No mira al estudiante.** |
| `invocado` | le pidieron ayuda | Levanta la libreta hacia el frente. Único momento de contacto visual. |

La distinción que sostiene todo: **una mueca de desaprobación es una
reacción a ti; una de concentración es una reacción al dato.** Al
fallar mira la página, no al estudiante. Fallar le da más trabajo, no
tristeza.

Prueba para descartar cualquier dibujo o animación nueva: **si en el
fallo te está mirando, está mal.**

## Dónde aparece, pantalla por pantalla

| Pantalla | ¿Sale? | Dónde y cómo |
|---|---|---|
| `peaje.tsx` | Sí, **callado** | Esquina inferior, 56 px. Nunca habla aquí. |
| `entrenar.tsx` | Sí | Esquina, 64 px. Tocable: abre la pista. |
| `repaso.tsx` | Sí, **protagonista** | Él entrega el análisis del fallo. Aquí es grande. |
| `simulacro/` | Sí, mínimo | Esquina, 48 px. Sesiones largas: presencia, no interrupción. |
| `contrarreloj.tsx` | Sí, mínimo | 48 px. El cronómetro ya presiona; él no suma. |
| `duelos.tsx` | Sí | Anota el resultado. No festeja al ganar. |
| `inicio.tsx` | Sí | En espera, saludo mudo. |
| `pregunta-del-dia.tsx` | Sí | Como en entrenar. |
| `bloqueo.tsx` | **No** | Pantalla de sistema. |
| `moderacion.tsx` | **No** | Herramienta de operación, no producto. |
| `entrar` / `registro` | **No** | Nadie quiere un personaje mientras teclea una contraseña. |
| `salida.tsx` | **No** | Despedirse con mascota es retención barata. |

### El peaje es el caso especial

Estamos **encima de Instagram sin que nos llamaran**. Una criatura
contenta en ese momento se lee como burla, y la app pasa de «me ayuda»
a «me jode».

Aquí el personaje existe y se calla. Parpadea, anota, nada más. No hay
pose `invocado` en el peaje: pedir ayuda es para cuando el estudiante
eligió estudiar.

## Cuándo cambia de expresión

El disparador es siempre un hecho del dominio, nunca un temporizador.

```
monta la pantalla        -> espera
el estudiante responde   -> acierto | fallo   (según esCorrecta)
toca al personaje        -> invocado
cierra la pista          -> vuelve a la anterior
avanza de pregunta       -> espera
```

Dos cosas que **no** disparan cambio: el tiempo transcurrido y el
scroll. Un personaje que reacciona a que lo miren es un personaje que
distrae.

### Qué dura cada cosa

- Transición entre poses: **420 ms**, con rebote suave.
- Parpadeo: **110 ms** bajando, **130 ms** subiendo.
- Intervalo entre parpadeos: **2,8 a 7 s, aleatorio**. A ritmo fijo se
  ve robótico.
- El lápiz trazando: **180 ms por marca**, tres marcas.
- Al fallar, el tachón entra **después** de las marcas.

## Accesibilidad

El personaje es **decorativo**: `accessibilityElementsHidden` y
`importantForAccessibility="no-hide-descendants"`, salvo cuando es
tocable (la pista), donde tiene rol de botón y nombre propio.

Nada de lo que comunica puede existir solo en él. Si falló, el texto
lo dice; la pose es refuerzo, nunca el único canal.

Y respeta `useReducedMotion`: con movimiento reducido, las poses
cambian sin animar y el parpadeo se apaga.

## La única celebración

Terminar un simulacro completo —254 preguntas, horas de trabajo— es lo
único que de verdad costó, y es el único momento en que el personaje
celebra. Decidido por Diego el 26 de noviembre de 2026.

Qué hace: se endereza, cierra la libreta y mira al frente. **Un
segundo.** No hay confeti, no hay texto de felicitación, no hay sonido.

Y no se repite en ninguna otra parte. Acertar una pregunta, ganar un
duelo o pagar el peaje no producen nada: si la celebración aparece en
dos sitios, deja de significar que algo costó.

Esto es la regla «se celebra lo que costó, no lo que se tocó» en su
forma más literal: una sola pantalla en toda la app tiene derecho.

## Lo que queda abierto

- **Si tiene nombre propio.** Sin nombre es más frío y más fácil de
  respetar; con nombre es más querible. No hace falta decidirlo para
  construir.
