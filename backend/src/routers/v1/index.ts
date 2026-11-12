import { Router } from "express";
import { authRouter } from "./auth.route";
import { clienteRouter } from "./cliente.route";
import { servicioRouter } from "./servicio.route";
import { citaRouter } from "./cita.route";
import { dashboardRouter } from "./dashboard.route";
import { disponibilidadRouter } from "./disponibilidad.route";

export const routerV1 = Router();

routerV1.use("/auth", authRouter);
routerV1.use("/clientes", clienteRouter);
routerV1.use("/servicios", servicioRouter);
routerV1.use("/citas", citaRouter);
routerV1.use("/dashboard", dashboardRouter);
routerV1.use("/disponibilidad", disponibilidadRouter);
