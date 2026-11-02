import express from "express";
import { routerV1 } from "./routers/v1";


export const createserver = () => {

    const app = express();
    app.use(express.json());

    // Todas las rutas de la versión 1 quedan bajo /api/v1
    app.use("/api/v1", routerV1);

    return app;
}
