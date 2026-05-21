import { Router } from "express";
import controller from "../../../controllers/paginas/registro/registro";


const registro = Router()

registro.post('/registrar',controller.registro)

export default registro;