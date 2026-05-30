import { Router } from "express";
import controller from "../../controllers/rankings/Rplayers";


const rankingsplayers = Router()

rankingsplayers.get('/rplayers',controller.rankingsplayers)
export default rankingsplayers
