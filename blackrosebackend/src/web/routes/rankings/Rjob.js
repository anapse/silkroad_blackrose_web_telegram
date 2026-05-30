import { Router } from "express";
import controller from "../../controllers/rankings/Rjob";


const rankingjob = Router()

rankingjob.get('/rjob',controller.rankingjob)
export default rankingjob
