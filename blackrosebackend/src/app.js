import express from 'express'
import "dotenv/config.js";
import cors from 'cors'
import bodyParse from 'body-parser'




const app = express();
app.use(cors());
app.use(bodyParse.json());

app.set('port', process.env.PORT || 4000 )
export default app