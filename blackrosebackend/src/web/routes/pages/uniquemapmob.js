import { Router } from "express";
import controller from "../../controllers/pages/uniquemapmob";


const uniqmap = Router()

uniqmap.get('/uniqmap',controller.uniqmap)

export default uniqmap;
