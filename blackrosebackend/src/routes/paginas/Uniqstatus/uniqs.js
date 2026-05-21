import { Router } from "express";
import controller from "../../../controllers/paginas/Uniqstatus/uniqs";


const uniquestatus = Router()

uniquestatus.get('/uniqstatus',controller.uniquestatus)
export default uniquestatus