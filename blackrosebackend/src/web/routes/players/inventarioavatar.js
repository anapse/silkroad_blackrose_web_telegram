import { Router } from "express";
import controller from '../../controllers/players/inventarioavatar'

const inventarioavatar = Router()

inventarioavatar.get('/inventarioavatar/:Char',controller.inventarioavatar)
export default inventarioavatar
