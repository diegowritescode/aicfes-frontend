/**
 * Every word on the landing page, in one place.
 *
 * The tone speaks to a student who already knows studying alone is
 * hard: it names procrastination, the lost afternoon and the quiet
 * giving-up, without lecturing. It never promises a score.
 */

export const navLinks = [
  { label: 'El problema', href: '#problema' },
  { label: 'Cómo funciona', href: '#como' },
  { label: 'Simulacros', href: '#simulacros' },
  { label: 'Preguntas', href: '#faq' },
] as const;

export const hero = {
  eyebrow: 'Entrena tu Saber 11',
  titleLine1: 'Estudiar solo',
  titleLine2: 'es muy berraco.',
  titleAccent: 'Ya no.',
  body: 'Abres el cuadernillo, lees dos páginas, y a los veinte minutos estás en TikTok. No es que te falte capacidad: es que nadie te dijo qué estudiar hoy, ni por cuánto rato, ni cómo saber si vas bien. AICFES sí.',
  primary: 'Empezar gratis',
  secondary: 'Ver cómo funciona',
  reassurance: ['Crear la cuenta es gratis', 'Sin tarjeta', 'Preguntas verificadas'],
} as const;

export const ticker = [
  'Lectura Crítica',
  'Matemáticas',
  'Ciencias Naturales',
  'Sociales y Ciudadanas',
  'Inglés',
  'Simulacros completos',
  'Racha diaria',
  'Explicación de cada opción',
] as const;

export const problem = {
  eyebrow: 'El problema',
  title: 'No es falta de ganas.',
  titleAccent: 'Es falta de un plan.',
  body: 'Todos empiezan en enero con el cuadernillo nuevo y la mejor intención. En marzo ya nadie lo abre. No porque sean vagos, sino porque estudiar sin saber qué sigue agota más que el examen mismo.',
  stats: [
    { value: '2', label: 'páginas aguanta la concentración antes de que llegue el celular.' },
    { value: '254', label: 'preguntas tiene el examen real. ¿Cuántas has resuelto este mes?' },
    { value: '9 h', label: 'dura la prueba, en dos jornadas. Sin práctica, se siente eterno.' },
    { value: '0', label: 'personas te avisan que llevas una semana sin estudiar. Hasta ahora.' },
  ],
} as const;

export const steps = {
  eyebrow: 'Cómo funciona',
  title: 'De «no sé por dónde empezar»',
  titleAccent: 'a saber exactamente qué sigue.',
  items: [
    {
      n: '01',
      title: 'Haz un diagnóstico.',
      body: 'Un simulacro corto, con la misma estructura del examen real. No para calificarte: para saber dónde estás parado hoy, área por área.',
    },
    {
      n: '02',
      title: 'Recibe tu plan.',
      body: 'La plataforma ordena tus áreas de la más floja a la más fuerte y te dice qué practicar hoy. Sin decidir nada tú: solo abres y estudias.',
    },
    {
      n: '03',
      title: 'Practica con preguntas que sí sirven.',
      body: 'Cada pregunta se genera y después se resuelve de nuevo por separado, para comprobar que la respuesta correcta de verdad lo sea. Si no cuadra, no te la mostramos.',
    },
    {
      n: '04',
      title: 'Mide, no adivines.',
      body: 'Tu racha, tu nivel y tu porcentaje por área. Ves el progreso en números, que es lo único que sostiene la disciplina cuando se va la motivación.',
    },
  ],
} as const;

export const features = {
  eyebrow: 'Qué hay adentro',
  title: 'Todo lo que necesitas',
  titleAccent: 'en un solo lugar.',
  items: [
    { title: 'Simulacros completos', body: 'Las cinco áreas con el peso exacto del examen real, en la duración que tengas.' },
    { title: 'Contrarreloj', body: 'Practica con el cronómetro corriendo, porque en el examen el tiempo también cuenta.' },
    { title: 'Explicación de cada opción', body: 'No solo cuál era la correcta: por qué las otras tres no lo eran.' },
    { title: 'Racha diaria', body: 'Veinte minutos al día sostenidos valen más que seis horas un domingo.' },
    { title: 'Progreso por área', body: 'Sabes en qué estás flojo antes de que el examen te lo diga.' },
    { title: 'Misiones', body: 'Metas cortas y alcanzables, para los días en que no te provoca nada.' },
    { title: 'Nivel y XP', body: 'Cada sesión suma. Ver el número subir es tonto y funciona.' },
    { title: 'Sin alucinaciones', body: 'Ninguna pregunta llega a ti sin que un verificador independiente la haya resuelto antes.' },
  ],
} as const;

export const simulacro = {
  eyebrow: 'Simulacros',
  title: 'El examen real,',
  titleAccent: 'antes del examen real.',
  body: 'Mismo número de preguntas por área, mismo peso, mismo ritmo. Y si no tienes nueve horas libres, se ajusta a lo que tengas sin perder las proporciones.',
  areas: [
    { area: 'Lectura Crítica', n: 41 },
    { area: 'Matemáticas', n: 50 },
    { area: 'Sociales y Ciudadanas', n: 50 },
    { area: 'Ciencias Naturales', n: 58 },
    { area: 'Inglés', n: 55 },
  ],
  note: '254 preguntas · dos jornadas de 4 h 30',
} as const;

export const faq = {
  eyebrow: 'Preguntas',
  title: 'Lo que todos preguntan.',
  items: [
    { q: '¿Es gratis?', a: 'Crear la cuenta y practicar es gratis. No pedimos tarjeta para empezar.' },
    {
      q: '¿Las preguntas son del ICFES oficial?',
      a: 'No. Son preguntas nuevas, construidas con la misma estructura y los mismos tipos de razonamiento del Saber 11. No somos el ICFES ni estamos afiliados a esa institución.',
    },
    {
      q: '¿Y si la IA se equivoca?',
      a: 'Por eso cada pregunta se resuelve dos veces: una para crearla y otra, por separado, para verificar que la respuesta marcada sea la correcta. Si no coinciden, la pregunta se descarta antes de que la veas.',
    },
    {
      q: '¿Cuánto tengo que estudiar al día?',
      a: 'Veinte minutos sostenidos sirven más que una maratón el domingo. La plataforma está hecha para sesiones cortas.',
    },
    {
      q: '¿Sirve si voy muy perdido?',
      a: 'Sobre todo si vas perdido. El diagnóstico te dice dónde estás y el plan empieza por ahí, no por donde debería estar alguien más.',
    },
    {
      q: '¿Puedo usarlo desde el celular?',
      a: 'Sí. Está hecho para funcionar en el celular, que es donde realmente vas a estudiar.',
    },
  ],
} as const;

export const closing = {
  title: 'Tu próximo simulacro',
  titleAccent: 'empieza ahora.',
  body: 'Veinte minutos. Hoy. Es todo lo que hace falta para empezar.',
  primary: 'Crear mi cuenta',
  secondary: 'Ya tengo cuenta',
} as const;

export const disclaimer =
  'AICFES es un proyecto independiente de práctica. No está afiliado al ICFES ni al Ministerio de Educación Nacional de Colombia.';
