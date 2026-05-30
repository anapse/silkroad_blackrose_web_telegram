import { Router } from "express";
import controller from "../../controllers/rankings/uniqlogplayer";

const uniqlogplayer = Router()

uniqlogplayer.get('/uniqlogplayer/:Char',controller.uniqlogplayer)
export default uniqlogplayer
