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
npm run db:setup         # crea la base de datos SQLite del backend (solo la primera vez)
```

Los datos se guardan en `backend/prisma/dev.db` y no se pierden al reiniciar. Más detalles en [backend/README.md](backend/README.md#base-de-datos).

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
