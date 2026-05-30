import { Router } from "express"
import controller from '../../controllers/auth/registrouserexiste.js'
const userexiste = Router()


userexiste.get('/existe/:User',controller.users)
export default userexiste
