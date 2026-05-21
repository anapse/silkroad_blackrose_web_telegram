import { getconnection } from "../../../database/conection";
import {  fortres } from "../../../database/dbquery";

const controller = {};

controller.rankingfortres =async (req,res)=>{

    try {
        const pool = await getconnection();
        const result = await pool.request().query(fortres);
       
        res.json(result.recordset);
    
      } catch (error) { 
        
        res.status(500);
        res.send(error,message);
      }
    };

export default controller; 