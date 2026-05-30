import { Router } from "express";
import controller from "../../controllers/rankings/Rfortres";


const rankingfortres = Router()

rankingfortres.get('/rfortres',controller.rankingfortres)
export default rankingfortres
