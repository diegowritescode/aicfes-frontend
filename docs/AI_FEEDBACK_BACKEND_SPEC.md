# Retroalimentación IA Personalizada – Backend Contract (AICFES)

> **✅ Implementado. Verificado el 22 nov 2026.**
>
> Esta especificación se construyó. El backend sirve
> `POST /api/feedback/generate` y `GET /api/feedback/:sessionId`.
>
> Se conserva por el razonamiento del diseño. Para el contrato vigente:
> `/api/docs` del backend, o `aicfes-backend/docs/FEEDBACK.md`.

Este documento define el contrato completo del backend para generar, almacenar y consultar retroalimentación IA de forma profesional y costo‑eficiente.

---

## 1) Objetivo

Generar feedback personalizado posterior a una sesión:
- Resumen de desempeño
- Fortalezas y debilidades por área
- Recomendaciones accionables
- Insights de tiempo/velocidad y patrones

---

## 2) Datos requeridos

Para generar feedback de calidad el backend necesita, por sesión:
- `answersHistory` (correcta/incorrecta, area, dificultad)
- `areaSummary` (si no hay answers)
- `durationSeconds`
- `totalQuestions` y `correctQuestions`
- `mode` (generacion_libre | contrarreloj | tecnica)
- `time per question` (opcional, si se registra)

---

## 3) Endpoints

### 3.1 Generar feedback
**POST** `/api/feedback/generate`

**Body:**
```json
{
  "sessionId": "cmk...",
  "mode": "generacion_libre",
  "focus": "summary | strengths | weaknesses | plan",
  "language": "es",
  "force": false
}
```

**Reglas:**
- Si ya existe feedback para `sessionId` y `force=false`, devolver cache.
- Si `force=true`, recalcular y sobrescribir.

**Response:**
```json
{
  "ok": true,
  "data": {
    "summary": "Resumen corto y útil...",
    "strengths": [
      { "area": "LC", "note": "Comprensión literal sólida" },
      { "area": "CN", "note": "Identifica relaciones básicas" }
    ],
    "weaknesses": [
      { "area": "MAT", "note": "Errores de cálculo en operaciones" }
    ],
    "plan": [
      { "title": "Practica MAT", "detail": "10 preguntas media con foco en fracciones" },
      { "title": "Revisa SOC", "detail": "2 explicaciones sobre argumentos" }
    ],
    "insights": {
      "avgTimePerQuestionSeconds": 42,
      "accuracy": 0.7,
      "speedNote": "Buen ritmo pero baja precisión en MAT"
    },
    "generatedAt": "2024-10-01T20:10:00Z",
    "model": "gpt-4o-mini"
  },
  "meta": { "sessionId": "cmk...", "cached": false }
}
```

---

### 3.2 Consultar feedback existente
**GET** `/api/feedback/:sessionId`

**Response (si existe):**
```json
{
  "ok": true,
  "data": { /* mismo esquema que generate */ },
  "meta": { "sessionId": "cmk...", "cached": true }
}
```

**Response (si no existe):**
```json
{
  "ok": false,
  "error": { "code": "NOT_FOUND", "message": "No feedback available." }
}
```

---

### 3.3 Regenerar feedback (opcional)
**POST** `/api/feedback/:sessionId/regenerate`

Internamente igual a `generate` con `force=true`.

---

## 4) Modelo IA recomendado (cost‑efficient)

- Generación de preguntas: GPT‑5 mini (actual)
- Retroalimentación IA: **gpt‑4o‑mini** o **o4‑mini**

**Razón:**
- El feedback requiere análisis y resumen, no creatividad pesada.
- Reduce costo y latencia.

---

## 5) Storage / Persistencia

Guardar el feedback generado por sesión:
- `sessionId`
- `summary`, `strengths`, `weaknesses`, `plan`, `insights`
- `generatedAt`
- `model`
- `promptVersion` (para auditoría)

---

## 6) Prompt base sugerido (backend)

```
Eres un tutor de preparación ICFES. Analiza el desempeño y da feedback práctico.
- Resumen breve (2–3 frases)
- Fortalezas (máx 3)
- Debilidades (máx 3)
- Plan de estudio (máx 3 acciones)
- Observación sobre ritmo (tiempo)

Datos:
<JSON_SESSION_DATA>
```

---

## 7) Seguridad y límites

- Limitar generación a 1 cada X minutos por sesión (ej. 10–30 min).
- Guardar cache para evitar costos repetidos.
- Validar que `sessionId` pertenezca al usuario.

---

## 8) Eventos SSE (opcional)

Si se genera feedback:
- emitir evento `feedback:ready` con `sessionId`.

---

## 9) Resumen MVP

- `POST /api/feedback/generate`
- `GET /api/feedback/:sessionId`
- Uso de modelo barato (`gpt-4o-mini`)
- Cache por sesión

