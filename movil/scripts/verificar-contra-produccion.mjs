/**
 * Do the schemas match what production sends?
 *
 * Unit tests stub fetch, so they prove the client handles a shape —
 * not that the shape is right. Only the server settles that, and
 * getting it wrong is how `expiresIn: z.number()` nearly shipped
 * against a field that holds "7d".
 *
 * Runs the whole sitting: start, read, answer, flag, grade.
 */
import { z } from 'zod';

const API = 'https://aicfes-backend.deviego.xyz';

const area = z.enum(['MAT', 'LC', 'CN', 'SOC', 'ING']);
const letra = z.enum(['A', 'B', 'C', 'D']);
const estadoSimulacro = z.enum(['en_curso', 'terminado', 'abandonado']);

const preguntaSimulacro = z.object({
  orden: z.number().int().min(0),
  area,
  itemId: z.string(),
  contexto: z.string(),
  pregunta: z.string(),
  opciones: z.record(z.string(), z.string()),
  tieneFigura: z.boolean(),
  respuesta: letra.nullable(),
  marcada: z.boolean(),
});

const resultadosSimulacro = z.object({
  correctas: z.number(),
  total: z.number(),
  porcentaje: z.number(),
  areas: z.array(
    z.object({
      area: z.string(),
      correctas: z.number(),
      total: z.number(),
      porcentaje: z.number(),
    }),
  ),
  recomendacion: z.array(z.string()),
});

const simulacroEnCurso = z.object({
  id: z.string(),
  status: estadoSimulacro,
  totalPreguntas: z.number(),
  minutos: z.number(),
  startedAt: z.string(),
  segundosRestantes: z.number(),
  resultados: resultadosSimulacro.nullable(),
  preguntas: z.array(preguntaSimulacro),
  expirado: z.boolean(),
});

const simulacroIniciado = z.object({
  id: z.string(),
  totalPreguntas: z.number(),
  minutos: z.number(),
  startedAt: z.string(),
  status: estadoSimulacro,
});

const respuestaRegistrada = z.object({ orden: z.number(), registrada: z.boolean() });
const marcaRegistrada = z.object({ orden: z.number(), marcada: z.boolean() });

const itemGenerado = z.object({
  id: z.string(),
  area,
  dificultad: z.enum(['facil', 'media', 'alta']),
  plantilla: z.string(),
  contexto: z.string(),
  pregunta: z.string(),
  opciones: z.record(z.string(), z.string()),
  respuesta_correcta: letra,
  justificacion: z.string(),
  tags: z.array(z.string()),
  distractores: z.record(z.string(), z.string()).nullable().optional(),
  explicaciones: z.record(z.string(), z.string()).nullable().optional(),
  figura: z.unknown().nullable().optional(),
});

const sesionIniciada = z.object({ sessionId: z.string(), startedAt: z.string() });
const sesionCompletada = z.object({
  sessionId: z.string(),
  xpAwarded: z.number().optional(),
  xpDelta: z.number().optional(),
});
const respuestasGuardadas = z.object({
  inserted: z.number(),
  xpAdjusted: z.number().optional(),
});
const estadoTutoria = z.object({
  id: z.string(),
  mensajes: z.array(
    z.object({
      autor: z.enum(['estudiante', 'tutor']),
      contenido: z.string(),
      createdAt: z.string(),
    }),
  ),
  turnosUsados: z.number(),
  turnosRestantes: z.number(),
  esperaDefensa: z.boolean(),
});

const inventarioBanco = z.object({
  porArea: z.array(
    z.object({ area: z.string(), verificados: z.number(), paraExamenCompleto: z.number() }),
  ),
  total: z.number(),
  simulacroMaximo: z.number(),
});

let fallos = 0;

function comprobar(nombre, esquema, valor) {
  const r = esquema.safeParse(valor);
  if (r.success) {
    console.log(`  ✓ ${nombre}`);
  } else {
    fallos += 1;
    console.log(`  ✗ ${nombre}`);
    for (const i of r.error.issues) {
      console.log(`      ${i.path.join('.')}: ${i.message}`);
    }
  }
  return r.success ? r.data : null;
}

async function llamar(ruta, token, opciones = {}) {
  const r = await fetch(`${API}${ruta}`, {
    method: opciones.metodo ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
    signal: AbortSignal.timeout(60_000),
  });
  const cuerpo = await r.json().catch(() => null);
  return cuerpo?.data ?? cuerpo?.items ?? cuerpo;
}

const email = `verif-fase1-${Date.now()}@aicfes.dev`;
const password = `Verif${Math.random().toString(36).slice(2, 10)}Aa1!`;

console.log('\n— sesión —');
const auth = await llamar('/api/auth/register', null, {
  metodo: 'POST',
  cuerpo: { email, password },
});
const token = auth?.token;
console.log(token ? '  ✓ registro' : '  ✗ registro');

console.log('\n— inventario del banco —');
comprobar('inventarioBanco', inventarioBanco, await llamar('/api/items/bank/stats', token));

console.log('\n— simulacro —');
const iniciado = comprobar(
  'simulacroIniciado',
  simulacroIniciado,
  await llamar('/api/simulacro/start', token, {
    metodo: 'POST',
    cuerpo: { totalPreguntas: 5 },
  }),
);

if (iniciado) {
  const id = iniciado.id;
  const estado = comprobar('simulacroEnCurso', simulacroEnCurso, await llamar(`/api/simulacro/${id}`, token));

  if (estado) {
    const texto = JSON.stringify(estado);
    const filtra =
      !/respuesta_correcta/.test(texto) &&
      !/justificacion/.test(texto) &&
      !/explicaciones/.test(texto);
    console.log(
      filtra
        ? '  ✓ la respuesta correcta no viaja al dispositivo'
        : '  ✗ FUGA: el payload lleva la respuesta correcta',
    );
    if (!filtra) fallos += 1;
  }

  comprobar(
    'respuestaRegistrada',
    respuestaRegistrada,
    await llamar(`/api/simulacro/${id}/answer`, token, {
      metodo: 'POST',
      cuerpo: { orden: 0, respuesta: 'A' },
    }),
  );

  comprobar(
    'marcaRegistrada',
    marcaRegistrada,
    await llamar(`/api/simulacro/${id}/marcar`, token, {
      metodo: 'POST',
      cuerpo: { orden: 1, marcada: true },
    }),
  );

  const calificado = await llamar(`/api/simulacro/${id}/finish`, token, {
    metodo: 'POST',
    cuerpo: {},
  });
  comprobar('resultadosSimulacro', resultadosSimulacro, calificado?.resultados);
}

/* The training path: generating an item, recording a session, saving
   answers, and opening a tutoring thread. Costs a generation, so it
   runs only with VERIFICAR_ENTRENAMIENTO=1. */
if (process.env.VERIFICAR_ENTRENAMIENTO === '1') {
  console.log('\n— entrenamiento —');

  const generados = await llamar('/api/items/generate', token, {
    metodo: 'POST',
    cuerpo: { area: 'MAT', dificultad: 'media', n: 1 },
  });
  const item = comprobar('itemGenerado', z.array(itemGenerado), generados)?.[0];

  const sesion = comprobar(
    'sesionIniciada',
    sesionIniciada,
    await llamar('/api/study-sessions/start', token, {
      metodo: 'POST',
      cuerpo: { mode: 'generacion_libre', area: 'MAT', startedAt: new Date().toISOString() },
    }),
  );

  if (sesion && item) {
    comprobar(
      'respuestasGuardadas',
      respuestasGuardadas,
      await llamar('/api/answers', token, {
        metodo: 'POST',
        cuerpo: [
          {
            sessionId: sesion.sessionId,
            questionIndex: 0,
            area: 'MAT',
            dificultad: 'media',
            selectedAnswer: 'A',
            isCorrect: false,
            itemId: item.id,
            tiempoMs: 4200,
          },
        ],
      }),
    );

    comprobar(
      'sesionCompletada',
      sesionCompletada,
      await llamar(`/api/study-sessions/${sesion.sessionId}/complete`, token, {
        metodo: 'POST',
        cuerpo: {
          endedAt: new Date().toISOString(),
          durationSeconds: 42,
          totalQuestions: 1,
          correctQuestions: 0,
          areaBreakdown: { MAT: { correct: 0, total: 1 } },
        },
      }),
    );

    const hilo = comprobar(
      'estadoTutoria',
      estadoTutoria,
      await llamar(`/api/tutoria/${item.id}/abrir`, token, {
        metodo: 'POST',
        cuerpo: { opcionElegida: 'A' },
      }),
    );

    if (hilo) {
      const texto = JSON.stringify(hilo);
      const guarda = !texto.includes(`"${item.respuesta_correcta}" es la correcta`);
      console.log(
        guarda
          ? '  ✓ la apertura de la tutoría no entrega la letra'
          : '  ✗ la tutoría reveló la respuesta',
      );
      if (!guarda) fallos += 1;
    }
  }
}

console.log(fallos === 0 ? '\nTodos los esquemas coinciden.' : `\n${fallos} esquema(s) no coinciden.`);
process.exit(fallos === 0 ? 0 : 1);
