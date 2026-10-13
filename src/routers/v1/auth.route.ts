import { Router } from "express";
import { LoginRequestDTO } from "../../dto/auth.dto";
import { container } from "../../config/containers";
import { AuthService } from "../../services/auth.service";

export const authRouter = Router();

// POST /api/v1/auth/login
authRouter.post("/login", async (req, res) => {

    const request: LoginRequestDTO = req.body as LoginRequestDTO;
    if (!request?.email || !request?.password) {
        res.status(400).json({
            code: "BAD_REQUEST",
            message: "email and password are required"
        });
        return;
    };

    const authService = container.resolve<AuthService>("authService");
    const result = await authService.login(request);
    if (!result) {
        res.status(401).json({
            code: "UNAUTHORIZED",
            message: "invalid credentials"
        });
        return;
    }
    res.status(200).json(result);
});
