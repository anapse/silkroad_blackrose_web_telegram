import { Router } from "express";
import controller from "../../../controllers/paginas/noticias/noticias";


const noticias = Router()

noticias.get('/Noticias',controller.todaslasnoticias)

export default noticias;