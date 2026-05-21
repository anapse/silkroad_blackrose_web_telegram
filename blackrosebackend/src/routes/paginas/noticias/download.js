import { Router } from "express";
import controller from "../../../controllers/paginas/noticias/download";


const download = Router()

download.get('/download',controller.download)
export default download