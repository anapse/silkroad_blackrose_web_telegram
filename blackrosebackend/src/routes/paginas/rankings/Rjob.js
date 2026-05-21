import { Router } from "express";
import controller from "../../../controllers/paginas/Rankings/Rjob";


const rankingjob = Router()

rankingjob.get('/rjob',controller.rankingjob)
export default rankingjob