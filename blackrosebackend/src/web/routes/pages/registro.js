import { Router } from "express";
import controller from "../../controllers/pages/registro";


const registro = Router()

registro.post('/registrar',controller.registro)

export default registro;
