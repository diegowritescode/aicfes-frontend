# Backend Improvements Proposal (AICFES)

Este documento propone mejoras concretas para el backend con impacto directo en métricas, gamificación y consistencia de datos.

---

## 1) XP y dificultad por pregunta

### Problema
Actualmente el XP se calcula con reglas simples (10 XP por respuesta correcta + 1 XP por minuto). No diferencia por dificultad.

### Propuesta
Agregar multiplicadores por dificultad (por pregunta y/o por sesión).

### Opción A (por pregunta)
Requiere capturar la dificultad de cada pregunta en `POST /api/answers`.

**Regla sugerida:**
- facil: 1.0x
- media: 1.3x
- alta: 1.7x

XP por respuesta correcta:
```
xp = baseCorrectXp * dificultadMultiplier
```

### Opción B (por sesión)
Usar la dificultad general de la sesión (generación libre):
```
xp = correctQuestions * baseCorrectXp * dificultadMultiplier
```

### Cambios necesarios
- Guardar dificultad por pregunta o por sesión.
- Actualizar cálculo de XP en backend.

---

## 2) Mejor medición de tiempo estudiado

### Problema
El tiempo se calcula entre `start` y `end` al finalizar la sesión, pero se pierde si el usuario sale antes.

### Propuesta
Agregar eventos de “heartbeat” o checkpoints de tiempo.

### Implementación sugerida
**POST /api/study-sessions/:id/heartbeat**
```
{ "elapsedSeconds": 120 }
```

El backend actualiza tiempo acumulado y evita pérdida por cierre inesperado.

---

## 3) Misiones con criterios reales

### Problema
Las misiones diarias no siempre se pueden validar sin data granular.

### Propuesta
Agregar tracking por pregunta para:
- “Revisar explicaciones”
- “Responder X preguntas de Matemáticas”
- “Mejorar precisión en un área específica”

### Cambios necesarios
Expandir `POST /api/answers`:
```
{ sessionId, questionIndex, selectedAnswer, isCorrect, area, dificultad }
```

Con esto el backend puede medir:
- Conteos por área
- Precisión real por área
- Progreso diario por misión

---

## 4) Retos dinámicos (Suggested Challenge)

### Problema
El reto sugerido es estático (mayor XP pendiente).

### Propuesta
Elegir retos con mayor impacto según:
- áreas débiles
- racha baja
- tiempo sin sesiones

### Ejemplo de reglas
```
if streak.currentDays == 0 → recomendar 1 sesión rápida
if areaProgress.MAT < 50 → recomendar 5 preguntas de MAT
if no contrarreloj en 7 días → sugerir contrarreloj
```

---

## 5) Sistema de logros (badges)

### Propuesta
Agregar endpoint de logros para gamificar:
```
GET /api/achievements
```

Ejemplos:
- “Racha 7 días”
- “10 sesiones de Matemáticas”
- “5 contrarreloj en una semana”

---

## 6) Métricas avanzadas

### Propuesta
Agregar métricas comparativas y tendencias:
- Precisión por área vs semana anterior
- Tiempo promedio por pregunta
- Dificultad promedio de preguntas respondidas

### Endpoint sugerido
```
GET /api/dashboard/advanced
```

---

## 7) Seguridad y sesión

### Propuesta
Agregar refresh token:
- `POST /api/auth/refresh`
- Refresh token httpOnly cookie

Evita expiraciones inesperadas del JWT.

---

## 8) Consistencia de datos

### Propuesta
Validar `area`, `dificultad`, `tema` en backend:
- area ∈ {MAT, LC, CN, SOC, ING}
- dificultad ∈ {facil, media, alta}

---

## 9) Sincronización offline (opcional)

### Propuesta
Guardar sesiones localmente si no hay conexión y sincronizar luego:
```
POST /api/sessions/sync
```

---

## 10) Auditoría y debug

### Propuesta
Agregar endpoint para ver logs de cálculo:
```
GET /api/dashboard/debug
```
Permite inspeccionar cómo se calcularon XP, racha, misiones.

---

## Resumen de mejoras prioritarias
1) XP por dificultad + tracking por pregunta
2) Heartbeat para tiempo real
3) Misiones con data granular
4) Retos dinámicos por debilidad
5) Logros/badges
