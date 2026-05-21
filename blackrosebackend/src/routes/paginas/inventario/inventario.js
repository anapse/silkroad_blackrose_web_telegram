import { Router } from "express";
import controller from "../../../controllers/paginas/inventario/inventario"

const inventario = Router()

inventario.get('/inventario/:Char',controller.inventario)
export default inventario
