import { Router } from "express";
import controller from "../../../controllers/paginas/Rankings/guildmember";


const guildmember = Router()

guildmember.get('/guildmember/:GuilID',controller.guildmember)
export default guildmember