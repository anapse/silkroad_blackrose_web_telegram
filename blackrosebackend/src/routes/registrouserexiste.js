import { Router } from "express"
import controller from "../../src/controllers/registrouserexiste"
const userexiste = Router()


userexiste.get('/existe/:User',controller.users)
export default userexiste