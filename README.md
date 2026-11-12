# mi-app

App de agendamiento de citas. Este repositorio contiene los dos proyectos:

```
backend/    API REST en Express 5 + TypeScript + Awilix (puerto 3000)
frontend/   App móvil en Expo / React Native
```

Cada carpeta tiene su propio `package.json` y su propio `node_modules`.
Los detalles de la API (endpoints, ejemplos) están en [backend/README.md](backend/README.md).

## Instalar

```bash
npm run install:all
npm run db:local         # arranca PostgreSQL en tu PC (sin instalar nada más)
npm run db:setup         # crea las tablas y carga el usuario y los servicios (solo la primera vez)
```

Los datos se guardan en **PostgreSQL** y no se pierden al reiniciar. Después de reiniciar el PC, vuelve a correr `npm run db:local` antes del backend. Más detalles en [backend/README.md](backend/README.md#base-de-datos).

## Desplegar en Render

El archivo [render.yaml](render.yaml) crea la API y la base de datos PostgreSQL en Render (plan gratis).

1. Fusiona los cambios a `main` (Render despliega esa rama).
2. En [render.com](https://render.com): **New → Blueprint**, conecta GitHub y elige este repositorio. Render lee `render.yaml` y crea `mi-app-api` y `mi-app-db`.
3. Cuando termine, la API queda en **https://mi-app-api-63nf.onrender.com** (pruébala en `/health`).
4. En `frontend/.env` pon `EXPO_PUBLIC_API_URL=https://mi-app-api-63nf.onrender.com/api/v1` y reinicia Expo. Así el celular funciona desde cualquier red.

En el plan gratis el servidor se duerme tras 15 minutos sin uso, y la primera petición después tarda cerca de un minuto. La base de datos gratis de Render vence a los 30 días: después hay que crear otra (o pasar a un plan pago).

## Correr

Abre dos terminales en la raíz del repo:

```bash
npm run dev:backend      # API en http://localhost:3000
```

```bash
npm run start:frontend   # Expo (o npm run android / ios / web)
```

Usuario de prueba para el login: `admin@miapp.com` / `123456`.

## Pantallas de la app

| Pantalla | API que usa |
|----------|-------------|
| Login | `POST /auth/login` |
| Clientes | `POST /clientes`, `GET /clientes` |
| Servicios | `GET /servicios` |
| Agendar cita | `GET /clientes`, `GET /servicios`, `POST /citas` |
| Citas | `GET /citas?fecha=` |

El cliente HTTP está en `frontend/src/api/`.

## URL de la API

La app elige la URL sola según dónde corre:

| Dónde corre la app | URL que usa |
|--------------------|-------------|
| Navegador (`npm run web`) | `http://<host de la página>:3000/api/v1` |
| Emulador Android | `http://10.0.2.2:3000/api/v1` |
| Simulador iOS | `http://localhost:3000/api/v1` |
| **Celular físico (Expo Go)** | Hay que configurarla (ver abajo) |

En un celular físico, `localhost` es el propio celular. Copia `frontend/.env.example` como `frontend/.env`,
pon la IP de tu PC (`ipconfig` → Dirección IPv4) y reinicia Expo:

```
EXPO_PUBLIC_API_URL=http://192.168.1.10:3000/api/v1
```

El celular y el PC deben estar en la misma red WiFi, y el firewall de Windows debe permitir Node en el puerto 3000.
