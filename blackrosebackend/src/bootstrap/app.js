/**
 * BOOTSTRAP — Express Application
 * 
 * Configura la aplicación Express con middleware y rutas de API.
 * NO sirve archivos estáticos — el frontend corre con Vite (npm run dev).
 */

import express from 'express'
import "dotenv/config.js";
import cors from 'cors'
import bodyParse from 'body-parser'
import { ENV } from '../shared/config/env.js';

const PORT = Number(process.env.PORT) || 100;

const app = express();
app.use(cors());
app.use(bodyParse.json());

app.set('port', PORT)
export default app
