import { Router } from "express";
import controller from "../../../controllers/paginas/Rankings/Rguild";


const rankingguild = Router()

rankingguild.get('/rguild',controller.rankingguild)
export default rankingguild