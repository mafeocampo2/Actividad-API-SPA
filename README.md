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
```

## Correr

Abre dos terminales en la raíz del repo:

```bash
npm run dev:backend      # API en http://localhost:3000
```

```bash
npm run start:frontend   # Expo (o npm run android / ios / web)
```

> Si pruebas la app en un celular físico, `localhost` apunta al celular y no a tu PC.
> En ese caso usa la IP local de tu PC (por ejemplo `http://192.168.x.x:3000`) para llamar a la API.
