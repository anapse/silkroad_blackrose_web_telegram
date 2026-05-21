import { Router } from "express";
import controller from "../../controllers/fragmentos/controller.fragmentos";


const fragmentos = Router()

fragmentos.get('/onlines',controller.fragmentoonlines)
export default fragmentos