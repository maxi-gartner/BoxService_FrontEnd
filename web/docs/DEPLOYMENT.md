# Infraestructura: ambientes, CI/CD y secretos

Frontend en [Vercel](https://vercel.com). Backend en
[Render](https://render.com) — ver `docs/DEPLOYMENT.md` de
`BoxService_BackEnd` para ese lado.

## Ambientes

Dos por ahora: **development** (rama `develop`) y **production** (rama
`main`). Un único proyecto de Vercel alcanza para los dos — Vercel ya
soporta env vars con scope distinto por rama, no hace falta crear un
segundo proyecto.

## Setup del proyecto en Vercel (una sola vez)

1. Conectar este repo en Vercel.
2. **Root Directory = `web`** — la app Next.js no está en la raíz del
   repo (conviven con la versión vanilla JS vieja), así que Vercel no la
   encuentra si no se le dice explícitamente.
3. **Production Branch = `main`** (Vercel usa `main`/`master` por
   default, pero hay que confirmarlo).
4. Cargar las env vars de la tabla de abajo — con scope **Production**
   para los valores de `main`, y overrides puntuales para la rama
   `develop` (Vercel: Settings → Environment Variables → "Add" y elegir
   la rama específica en vez de "Preview" genérico).

## Env vars por ambiente

| Env var | development (rama `develop`) | production (rama `main`) |
|---|---|---|
| `BACKEND_MODE` | `real` | `real` |
| `BACKEND_URL` | URL del servicio `boxservice-backend-dev` en Render | URL del servicio `boxservice-backend-prod` en Render |
| `NEXT_PUBLIC_APP_URL` | URL que Vercel le da al deploy de `develop` | dominio de producción |

Ninguna de estas tres es secreta en el sentido de "credencial" — son URLs
públicas. No hay ningún token ni clave del lado del frontend: el JWT vive
en una cookie `httpOnly` que arma el backend en el login
(`app/api/auth/login/route.ts`), el navegador nunca lo toca directamente.

## CI

`.github/workflows/ci.yml` corre en cada push/PR a `develop`/`main`:
`npm ci`, `lint`, `tsc --noEmit` y `next build` — sin ningún secreto ni
backend real levantado (sin `BACKEND_MODE` seteada cae a `mock`, que es
autocontenido). Vercel hace su propio build+deploy por separado vía su
integración de Git; este workflow es solo el gate de PR, no dispara ningún
deploy.

## Verificar un deploy

Mismo flujo que se usa en desarrollo local, contra la URL real:

1. `POST /api/auth/login` con las credenciales de alguno de los 3 usuarios
   demo (ver `BoxService_BackEnd/docs/DEPLOYMENT.md`).
2. `GET /dashboard` y `GET /admin` con la cookie de sesión — deben
   responder 200 (o 307 a `/dashboard` en `/admin` si el rol no alcanza),
   nunca un loop de redirect a `/login`.
