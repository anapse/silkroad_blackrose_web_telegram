import { Router } from "express";
import controller from '../../controllers/players/datosplayers';

const datosplayer = Router()

datosplayer.get('/datosplayer/:Char',controller.datosplayer)
export default datosplayer
