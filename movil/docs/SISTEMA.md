# The design system

Validated as an artifact first, then built here:
<https://claude.ai/artifact/UMP3vGbbEscbtf67Dbcfd2>

The artifact is the spec. If this app and that page disagree about a colour, a
size or a layout, the page is right and the app is wrong. The two exceptions are
recorded at the bottom of this file — both are cases where the artifact's value
failed a contrast measurement and was changed deliberately.

## Where things live

```
src/shared/ui/
  tokens.ts          every colour, size, radius and duration
  sombras.ts         elevation, which Tailwind cannot do on Android
  atomos/            Boton Texto Chip Avatar Insignia
  moleculas/         Opcion Explicacion Progreso Tarjeta Cifra
                     Contexto Encabezado FilaMateria BarraRespuesta
  organismos/        Personaje/ BarraPestanas
  index.ts           the public surface — screens import from here
```

A screen imports from `@/shared/ui`, never from the folders. Whether something
is an atom or a molecule is how the system is built, not something a screen
should have to know; moving a component between them then costs one line.

## The three rules the design rests on

These came from the user, and the artifact exists because the first attempt
broke all three.

1. **One structural colour.** The accent appears once per screen, on the button
   that says what the screen is for. Three saturated accents competing is what
   the first attempt looked like, and the verdict was that it violated every law
   of graphic design.
2. **A card separates by being whiter, not by a border.** `fondo` is tinted,
   `capa` is pure white. That brightness difference *is* the elevation system;
   the shadow only confirms it.
3. **Hierarchy is size and weight, never colour.** A large dark number beside a
   small grey label. A coloured number that was not earned spends the one signal
   the palette has.

## The five bugs this system exists to prevent

Each of these reached a real phone. Each has a test.

**An inline `style` drops the compiled class.** NativeWind compiles classes into
styles, and a `style` prop passed alongside can win. Passing
`style={{ minHeight: 56 }}` next to `className="bg-acento"` shipped a button with
the right touch area and no fill at all — the user found it before any test did:
*"el botón si está, pero está como invisible, si le doy al espacio si sirve."*
Only `width`/`height` percentages and `sombra.*` belong in a `style` object.
`tokens.test.ts` fails the build otherwise.

**`shadow-*` does nothing on Android.** It compiles to the web `box-shadow`. The
first build of the redesign came out completely flat because of it. Use
`Tarjeta`, or `style={sombra.tarjeta}`.

**A font family plus a weight does not resolve.** React Native looks a font up by
its registered key, so `font-marca` with `font-bold` silently falls back to the
system face. That is why the first redesign build looked untouched: *"nada a
cambiado en el estilo prácticamente."* Always name the face —
`Nunito_800ExtraBold`, `Inter_600SemiBold`. `Texto` does this for you, which is
the main reason to use it instead of a raw `<Text>`.

**A disabled button has to stay visible.** `capa-alta` against `capa` measures
1,04:1. On the sign-in screen, which was white, the button was effectively not on
the page until both fields were filled. The disabled state now carries a border
as well as a fill, and the auth screens sit on `fondo`.

**A control border has to be visible.** The reference design used a prettier
`#d6d4e6`, which measures 1,46:1 against white. A field nobody can see is a field
nobody fills. `bordeControl` is darker than it looks like it should be, on
purpose.

## The screen skeletons

**A screen where the learner answers a question** — the toll, a drill, a duel, a
mock exam. All four share this, which is why `Encabezado` and `BarraRespuesta`
exist rather than each screen rolling its own:

```tsx
<SafeAreaView className="flex-1 bg-fondo">
  <ScrollView contentContainerClassName="gap-3.5 px-5 py-4">
    <Encabezado rotulo="Lectura crítica" derecha={<Chip tono="acento">2 de 10</Chip>} />
    <Progreso hechas={2} total={10} />
    <Contexto>{item.contexto}</Contexto>
    <Texto estilo="pregunta">{item.pregunta}</Texto>
    <View className="gap-[9px]">{/* Opcion per option */}</View>
    {respondida ? <Explicacion …/> : null}
  </ScrollView>
  <BarraRespuesta>
    <Boton …>{/* Elige una opción → Responder → Siguiente */}</Boton>
  </BarraRespuesta>
</SafeAreaView>
```

The button lives **outside** the scroll view. With a 1200-character stimulus and
four options it otherwise lands at the end of a screen and a half of scrolling,
and a button nobody scrolls to is a button that does not exist. On the toll, where
the learner is already annoyed at being interrupted, that is the difference
between answering and force-quitting.

**A screen the learner navigates to** — inicio, entrenar, duelos, repaso, yo:
same, but `BarraPestanas` instead of `BarraRespuesta`, and the primary button
sits at the end of the scroll because the content is short enough to reach it.

The tab bar is deliberately absent from the toll, the duel, the drill and the
mock exam. Those are one task each, and offering an exit is offering an
abandonment. The toll in particular runs over another app and has nowhere else
to go.

## Where the artifact and the tokens differ

Two values, both measured and both changed on purpose:

| | artifact | here | why |
|---|---|---|---|
| `ganado` | `#2f9e68` | `#258055` | white text on the lighter green measured 3,38:1, and "Cobrar 15 minutos" is a green button with white text |
| `bordeControl` | `#d6d4e6` | `#8c8a9e` | 1,46:1 against white |

Anything else that drifts is a bug in the app, not a decision.
