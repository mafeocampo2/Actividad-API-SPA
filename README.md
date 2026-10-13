# mi-app-backend

API REST en **Express 5 + TypeScript + Awilix** para la app móvil de agendamiento de citas (`mi-app`).
Sigue la misma arquitectura del proyecto base [ExpressTS-API-REST](https://github.com/juanjo525/ExpressTS-API-REST).

## Estructura

```
src/
├── config/
│   └── containers.ts          # contenedor de inyección de dependencias (Awilix)
├── dto/                       # contratos de entrada/salida
│   ├── auth.dto.ts
│   ├── cliente.dto.ts
│   ├── servicio.dto.ts
│   └── cita.dto.ts
├── services/                  # lógica de negocio
│   ├── interfaces/
│   │   ├── auth.interface.ts
│   │   ├── cliente.interface.ts
│   │   ├── servicio.interface.ts
│   │   └── cita.interface.ts
│   ├── auth.service.ts
│   ├── cliente.service.ts
│   ├── servicio.service.ts
│   └── cita.service.ts
├── routers/
│   └── v1/
│       ├── index.ts           # monta todas las rutas en /api/v1
│       ├── auth.route.ts
│       ├── cliente.route.ts
│       ├── servicio.route.ts
│       └── cita.route.ts
├── server.ts                  # crea la app de Express
└── main.ts                    # arranca el servidor en el puerto 3000
```

## Cómo correrlo

```bash
npm install
npm run dev        # modo desarrollo (tsx watch)
# o
npm run build && npm start
```

El servidor queda en `http://localhost:3000`.

> Los datos se guardan **en memoria** (no hay base de datos todavía), así que se borran al reiniciar el servidor.

## Endpoints

| # | Método | Ruta | Pantalla de la app | Descripción |
|---|--------|------|--------------------|-------------|
| 1 | POST | `/api/v1/auth/login` | Login | Inicia sesión y devuelve token + usuario |
| 2 | POST | `/api/v1/clientes` | Clientes | Registra un cliente |
| 3 | GET | `/api/v1/servicios` | Servicio | Lista los servicios disponibles |
| 4 | POST | `/api/v1/citas` | AgendarCita | Agenda una cita (valida cliente, servicio y cruces de horario) |
| 5 | GET | `/api/v1/citas` | Citas | Lista las citas (filtros `fecha`, `clienteId`, `estado`) |

### 1. Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "admin@miapp.com", "password": "123456" }
```

- `200` → `{ token, usuario }`
- `400` → faltan email o password
- `401` → credenciales inválidas

### 2. Crear cliente

```http
POST /api/v1/clientes
Content-Type: application/json

{ "nombre": "Laura", "apellido": "Gómez", "telefono": "3001234567", "email": "laura@mail.com" }
```

- `201` → cliente creado (con `id`, `nombreCompleto`, `fechaRegistro`)
- `400` → faltan campos
- `409` → ya existe un cliente con ese email

### 3. Listar servicios

```http
GET /api/v1/servicios
GET /api/v1/servicios?todos=true   # incluye inactivos
```

- `200` → arreglo de servicios (`id`, `nombre`, `descripcion`, `duracionMinutos`, `precio`, `activo`)

### 4. Agendar cita

```http
POST /api/v1/citas
Content-Type: application/json

{ "clienteId": "<id del cliente>", "servicioId": "s-1", "fecha": "2026-10-20", "hora": "10:00", "notas": "opcional" }
```

- `201` → cita creada en estado `PENDIENTE`, con `horaFin` calculada según la duración del servicio
- `400` → faltan campos o formato de fecha/hora inválido
- `404` → cliente o servicio no existe (o servicio inactivo)
- `409` → ya hay una cita que se cruza en ese horario

### 5. Listar citas

```http
GET /api/v1/citas
GET /api/v1/citas?fecha=2026-10-20
GET /api/v1/citas?clienteId=<id>&estado=PENDIENTE
```

- `200` → arreglo de citas ordenadas por fecha y hora
- `400` → fecha o estado inválido

Formato de error en todos los endpoints:

```json
{ "code": "BAD_REQUEST", "message": "..." }
```
