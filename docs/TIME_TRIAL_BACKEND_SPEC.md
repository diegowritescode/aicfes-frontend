# Contrarreloj Backend Spec (AICFES v1)

Este documento define **todo lo necesario** en backend para habilitar el modo Contrarreloj con retos predefinidos, modo personalizado, XP con bonus de velocidad y métricas para dashboard.

---

## 1) Objetivo

Habilitar un modo Contrarreloj con:
- **Retos predefinidos** (3 modos iniciales).
- **Modo personalizado** (área + dificultad + tiempo + cantidad).
- **XP con bonus de velocidad**.
- **Compatibilidad con dashboard** (misiones, progreso por área, sesiones).

---

## 2) Modelos / Datos necesarios

### TimeTrialMode
- `id: string`
- `title: string`
- `description: string`
- `timeLimitSeconds: number`
- `questions: number`
- **Predefinido**: `area?: Area`, `dificultad?: Dificultad`
- **Mixto**: `mix?: Array<{ area: Area; dificultad: Dificultad; n: number }>`
- `enabled: boolean`

### StudySession (ya existente)
Debe aceptar:
- `mode: "contrarreloj"`
- `modeId?: string`
- `timeLimitSeconds?: number`
- `questions?: number`
- `area?: Area`
- `dificultad?: Dificultad`

---

## 3) Endpoints

### 3.1 Listar retos contrarreloj
**GET** `/api/time-trial/modes`

Response:
```json
{
  "ok": true,
  "data": [
    {
      "id": "sprint_10",
      "title": "Sprint 10",
      "description": "10 preguntas mixtas en 10 minutos",
      "timeLimitSeconds": 600,
      "questions": 10,
      "mix": [
        { "area": "MAT", "dificultad": "media", "n": 2 },
        { "area": "LC", "dificultad": "media", "n": 3 },
        { "area": "CN", "dificultad": "media", "n": 2 },
        { "area": "SOC", "dificultad": "media", "n": 2 },
        { "area": "ING", "dificultad": "media", "n": 1 }
      ]
    },
    {
      "id": "reto_5",
      "title": "Reto 5",
      "description": "5 preguntas de área objetivo en 5 minutos",
      "timeLimitSeconds": 300,
      "questions": 5,
      "area": "MAT",
      "dificultad": "media"
    },
    {
      "id": "explosivo",
      "title": "Explosivo",
      "description": "3 preguntas difíciles en 3 minutos",
      "timeLimitSeconds": 180,
      "questions": 3,
      "area": "LC",
      "dificultad": "alta"
    }
  ],
  "meta": {}
}
```

---

### 3.2 Iniciar contrarreloj (predefinido o personalizado)
**POST** `/api/time-trial/start`

Body (modo predefinido):
```json
{ "modeId": "sprint_10" }
```

Body (personalizado):
```json
{
  "custom": {
    "area": "MAT",
    "dificultad": "alta",
    "timeLimitSeconds": 420,
    "questions": 7
  }
}
```

Response:
```json
{
  "ok": true,
  "data": {
    "sessionId": "cmk...",
    "timeLimitSeconds": 600,
    "items": [ /* preguntas */ ]
  },
  "meta": {}
}
```

**Notas:**
- Debe crear `StudySession` con `mode: "contrarreloj"` y `modeId` si aplica.
- Para modos mixtos, usar generación mixta y devolver items combinados.

---

### 3.3 Heartbeat de sesión
**POST** `/api/study-sessions/:sessionId/heartbeat`

Body:
```json
{ "elapsedSeconds": 240 }
```

---

### 3.4 Completar sesión
**POST** `/api/study-sessions/:sessionId/complete`

Body:
```json
{
  "endedAt": "2024-10-01T20:10:00Z",
  "durationSeconds": 600,
  "totalQuestions": 10,
  "correctQuestions": 7,
  "areaSummary": [
    { "area": "MAT", "totalQuestions": 2, "correctQuestions": 2 },
    { "area": "LC", "totalQuestions": 3, "correctQuestions": 2 }
  ]
}
```

---

## 4) XP y Bonus de velocidad

**Base XP**
- `10 XP` por respuesta correcta
- Multiplicador por dificultad (facil=1.0, media=1.3, alta=1.7)

**Bonus de velocidad**
```
accuracy = correctQuestions / totalQuestions
speedFactor = max(0, (timeLimitSeconds - durationSeconds) / timeLimitSeconds)
bonusXP = round(speedFactor * totalQuestions * 4)

if (accuracy < 0.5) bonusXP = 0
```

**XP Total**
```
totalXP = baseXP + bonusXP
```

---

## 5) Validaciones

- `timeLimitSeconds >= 60`
- `questions >= 1`
- `correctQuestions <= totalQuestions`
- `modeId` debe existir si se usa modo predefinido
- En modo personalizado, `area` y `dificultad` obligatorias

---

## 6) Impacto en Dashboard

El dashboard usa las sesiones `mode=contrarreloj` para:
- Misiones diarias
- Racha activa
- Tiempo estudiado
- Progreso por área (si se envía areaSummary)

---

## 7) Modo personalizado (Frontend)

Requiere que backend soporte:
- `custom` en `/api/time-trial/start`
- o generar items con `/api/items/generate` y crear sesión con `mode=contrarreloj`

---

## 8) Consideraciones técnicas

- SSE debe emitir eventos cuando se crea/completa sesión contrarreloj.
- Si hay mix, usar `areaSummary` y/o `answers` para métricas finas.

---

## 9) Resumen MVP

1) `GET /api/time-trial/modes`
2) `POST /api/time-trial/start`
3) `POST /api/study-sessions/:id/complete` con `areaSummary`
4) Bonus de velocidad
5) Dashboard reacciona a sesiones contrarreloj

