# Feedback Prompt Enhancements (AICFES)

Este documento sugiere mejoras concretas al prompt y al contrato del backend para enriquecer la retroalimentación con métricas accionables y insights de desempeño.

## Objetivo
Entregar un reporte más profundo que explique **por qué** se acertó o falló, cómo mejorar con precisión y qué patrón de comportamiento aparece en la sesión.

## Datos adicionales recomendados (si existen en backend)
- `avgTimePerQuestionSeconds` y `medianTimePerQuestionSeconds`
- `accuracyByArea` (porcentaje por área)
- `difficultySummary` (correctas por dificultad)
- `errorPatterns` (tipo de errores: comprensión, cálculo, inferencia, vocabulario)
- `consistency` (si el rendimiento es estable o irregular)
- `focusScore` (señal estimada de concentración)

## Campos nuevos sugeridos en respuesta
```json
{
  "diagnostic": {
    "primaryWeakness": "LC",
    "secondaryWeakness": "MAT",
    "speedIssue": true,
    "consistency": "stable | inconsistent"
  },
  "metrics": {
    "accuracyByArea": [
      { "area": "LC", "accuracy": 0.72 },
      { "area": "MAT", "accuracy": 0.58 }
    ],
    "accuracyByDifficulty": [
      { "dificultad": "facil", "accuracy": 0.9 },
      { "dificultad": "media", "accuracy": 0.6 },
      { "dificultad": "alta", "accuracy": 0.4 }
    ],
    "timeDistribution": {
      "avg": 42,
      "median": 38,
      "p90": 70
    }
  },
  "actions": [
    {
      "title": "Subir precisión en LC",
      "detail": "Resolver 10 preguntas de inferencia textual con límite de 60s."
    }
  ],
  "mistakePatterns": [
    "Confunde inferencias con ideas explícitas.",
    "Selecciona distractores por palabra clave."
  ]
}
```

## Prompt sugerido (extracto)
Incluye explícitamente:
- Resumen ejecutivo en 2–3 frases.
- Fortalezas y debilidades por área.
- Patrones de error detectables (si aplica).
- Recomendaciones accionables con volumen y tiempo.
- Observación sobre gestión del tiempo.

Ejemplo:
```
Analiza la sesión y entrega:
1) Resumen ejecutivo (2–3 frases).
2) Fortalezas (por área) con 1 frase cada una.
3) Debilidades (por área) con 1 frase cada una.
4) Patrones de error detectados (máx 3 bullets).
5) Plan de estudio concreto (máx 3 acciones, con cantidades y tiempos).
6) Comentario de manejo del tiempo (si aplica).
Responde en JSON con el contrato definido.
```

## Integración en frontend
El frontend ya puede renderizar campos opcionales. Los campos extra se muestran si vienen en el payload.
