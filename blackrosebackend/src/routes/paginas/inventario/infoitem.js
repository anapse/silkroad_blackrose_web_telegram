import { Router } from "express";
import controller from "../../../controllers/paginas/inventario/infoitem"

const infoitem = Router()

infoitem.get('/infoitem/:Item',controller.infoitem)
export default infoitem
