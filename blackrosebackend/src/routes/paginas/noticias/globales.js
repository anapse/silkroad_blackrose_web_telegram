import { Router } from "express";
import controller from "../../../controllers/paginas/noticias/globales";



const globales = Router()

globales.get('/globales/:Cant/:Cont',controller.globales)

export default globales