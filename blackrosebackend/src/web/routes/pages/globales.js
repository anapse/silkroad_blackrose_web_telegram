import { Router } from "express";
import controller from "../../controllers/pages/globales";



const globales = Router()

globales.get('/globales/:Cant/:Cont',controller.globales)

export default globales
