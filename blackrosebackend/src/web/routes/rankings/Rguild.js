import { Router } from "express";
import controller from "../../controllers/rankings/Rguild";


const rankingguild = Router()

rankingguild.get('/rguild',controller.rankingguild)
export default rankingguild
