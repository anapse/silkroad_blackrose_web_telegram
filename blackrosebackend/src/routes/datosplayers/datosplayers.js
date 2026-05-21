import { Router } from "express";
import controller from "../../controllers/datosplayer/datosplayers";

const datosplayer = Router()

datosplayer.get('/datosplayer/:Char',controller.datosplayer)
export default datosplayer
