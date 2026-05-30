import { Router } from "express";
import controller from '../../controllers/players/getPlayerData.js';

const players = Router();

players.get("/player/:jid", controller.getPlayerData);
players.get("/character/:charid", controller.getCharacterByID);

export default players;
