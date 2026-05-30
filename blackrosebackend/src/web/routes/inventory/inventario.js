import { Router } from "express";
import controller from '../../controllers/inventory/inventario'

const inventario = Router()

inventario.get('/inventario/:Char',controller.inventario)
export default inventario
