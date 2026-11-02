import express from "express";
import { routerV1 } from "./routers/v1";


export const createserver = () => {

    const app = express();
    app.use(express.json());

    // CORS: permite que la app (Expo web o el celular) llame a la API
    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        if (req.method === "OPTIONS") {
            res.sendStatus(204);
            return;
        }
        next();
    });

    // Todas las rutas de la versión 1 quedan bajo /api/v1
    app.use("/api/v1", routerV1);

    return app;
}
