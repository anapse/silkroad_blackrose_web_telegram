import { Router } from "express";
import controller from '../../controllers/fragments/serverevent';


const serverevent = Router()

serverevent.get('/serverevent',controller.serverevent)
export default serverevent
