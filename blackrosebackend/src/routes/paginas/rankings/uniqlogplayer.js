import { Router } from "express";
import controller from "../../../controllers/paginas/Rankings/uniqlogplayer";

const uniqlogplayer = Router()

uniqlogplayer.get('/uniqlogplayer/:Char',controller.uniqlogplayer)
export default uniqlogplayer