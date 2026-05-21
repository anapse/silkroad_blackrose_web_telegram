import { Router } from "express";
import controller from "../../controllers/auth/controller.autentificacion.js";

const auth = Router();

// 🔐 login normal
auth.post("/auth", controller.auth);

// 🔍 GET → consultar cuentas por telegram
auth.get("/telegram/:telegramId", controller.telegramAuth);

// 🔗 vincular cuenta
auth.post("/telegram/link", controller.telegramLink);

// 🔐 login con telegram
auth.post("/telegram/login", controller.telegramLogin);
auth.post("/login", controller.login);
export default auth;