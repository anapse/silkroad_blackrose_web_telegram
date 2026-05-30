import { Router } from "express";
import controller from '../../controllers/uniqstatus/uniqs';


const uniquestatus = Router()

uniquestatus.get('/uniqstatus',controller.uniquestatus)
export default uniquestatus
