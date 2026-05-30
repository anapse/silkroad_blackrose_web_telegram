import { Router } from "express";
import controller from "../../controllers/pages/noticias";


const noticias = Router()

noticias.get('/Noticias',controller.todaslasnoticias)

export default noticias;
