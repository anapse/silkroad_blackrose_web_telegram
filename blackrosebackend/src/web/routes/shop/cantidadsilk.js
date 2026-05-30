import { Router } from "express";
import controller from '../../controllers/shop/cantidadsilk';

const cantidadsilk = Router()

cantidadsilk.get('/cantidadsilk/:user',controller.cantsilk)
export default cantidadsilk
