# Backend Nest.js: SSE + CORS + Cookies (Localhost)

> **✅ Implementado. Verificado el 22 nov 2026.**
>
> El backend tiene `GET /api/dashboard/stream`, CORS configurado en
> `src/main.ts` y cookies de sesión con `REFRESH_COOKIE_NAME`.
>
> Nota: el móvil **no** usa cookies. Un cliente nativo recibe su token
> de renovación en el cuerpo, porque no hay cookies fiables en un
> teléfono — ver ADR 7 del backend.

Este documento describe qué ajustar en el backend (Nest.js) para que el **SSE** del dashboard funcione en local con frontend en `http://localhost:8080` y backend en `http://localhost:3000`.

---

## 1) CORS con credenciales

El SSE requiere que el navegador pueda enviar cookies al backend. Por eso, **CORS debe permitir credenciales**.

**main.ts (Nest):**
```ts
app.enableCors({
  origin: 'http://localhost:8080',
  credentials: true,
});
```

Si usas varios orígenes:
```ts
const allowed = ['http://localhost:8080'];
app.enableCors({
  origin: (origin, callback) => {
    if (!origin || allowed.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
});
```

---

## 2) Cookies httpOnly para refresh

El refresh token debe guardarse como cookie httpOnly para que el SSE lo use sin headers.

**Ejemplo (AuthController):**
```ts
res.cookie('refresh_token', refreshToken, {
  httpOnly: true,
  sameSite: 'Lax',
  secure: false, // true solo en HTTPS
});
```

**Importante en local:**
- `sameSite: 'Lax'`
- `secure: false`
- Dominio no necesario (usa localhost)

---

## 3) SSE endpoint con cookies

El SSE debe leer el `userId` desde el token (access o refresh) de cookie.

**Recomendación:**
- Extraer userId del access token cuando esté disponible.
- Si access expira, usar refresh para resolver el userId.

Si hay fallback:
```
GET /api/dashboard/stream?userId=<id>
```

---

## 4) Headers para SSE

Asegura que el endpoint SSE envíe:
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

Y haga `res.flush()` si aplicas compresión.

---

## 5) Nginx / Proxy (si aplica)

Si hay reverse proxy, habilitar soporte a SSE:
```
proxy_set_header Connection '';
proxy_http_version 1.1;
chunked_transfer_encoding off;
proxy_buffering off;
proxy_cache off;
```

---

## 6) Endpoints relacionados

Asegúrate de que estos endpoints estén con `credentials: true`:
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/dashboard/stream`

---

## 7) Verificación rápida

1) Login desde frontend.
2) Revisa que el cookie `refresh_token` exista en el navegador.
3) Abre `http://localhost:3000/api/dashboard/stream` desde el frontend (no en el navegador directo).
4) El frontend debe mostrar **En vivo** si el stream conecta.

---

## Errores comunes

- **Sin conexión** en UI: el SSE no conectó o no recibió cookies.
- **CORS error**: falta `credentials: true` o el `origin` no coincide.
- **Cookie no llega**: `SameSite=None` sin HTTPS bloquea cookie.

---

Si necesitas el código exacto de Nest para SSE con EventEmitter y cleanup, lo puedo preparar también.
