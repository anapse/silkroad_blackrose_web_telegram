import { Router } from "express";
import controller from "../../../controllers/paginas/uniqmapmob/uniquemapmob";


const uniqmap = Router()

uniqmap.get('/uniqmap',controller.uniqmap)

export default uniqmap;