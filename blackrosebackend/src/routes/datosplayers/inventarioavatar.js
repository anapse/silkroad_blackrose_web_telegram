import { Router } from "express";
import controller from "../../controllers/datosplayer/inventarioavatar"

const inventarioavatar = Router()

inventarioavatar.get('/inventarioavatar/:Char',controller.inventarioavatar)
export default inventarioavatar
