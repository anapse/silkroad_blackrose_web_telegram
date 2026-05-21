import { Router } from "express";
import controller from "../../controllers/recargasilk/cantidadsilk";

const cantidadsilk = Router()

cantidadsilk.get('/cantidadsilk/:user',controller.cantsilk)
export default cantidadsilk
