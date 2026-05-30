import { Router } from "express";
import controller from "../../controllers/rankings/guildmember";


const guildmember = Router()

guildmember.get('/guildmember/:GuilID',controller.guildmember)
export default guildmember
