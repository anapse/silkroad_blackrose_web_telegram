import express from 'express'
import "dotenv/config.js";
import cors from 'cors'
import bodyParse from 'body-parser'
import path from 'path';

const app = express();
app.use(cors());
app.use(bodyParse.json());

// Servir archivos estáticos del frontend (producción)
const frontendDist = path.resolve(process.cwd(), '../blackroseweb/dist');
app.use(express.static(frontendDist));

// Servir data/items.json e icon/ desde la carpeta public del frontend
const frontendPublic = path.resolve(process.cwd(), '../blackroseweb/public');
app.use(express.static(frontendPublic));

app.set('port', process.env.PORT || 4000)
export default app