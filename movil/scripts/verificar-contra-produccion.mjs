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

console.log(fallos === 0 ? '\nTodos los esquemas coinciden.' : `\n${fallos} esquema(s) no coinciden.`);
process.exit(fallos === 0 ? 0 : 1);
