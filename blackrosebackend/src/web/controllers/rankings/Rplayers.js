import { getconnection } from "../../../shared/database/conection";
import {  rankingsplayers } from "../../../shared/database/dbquery";

const controller = {};

controller.rankingsplayers =async (req,res)=>{

    try {
        const pool = await getconnection();
        const result = await pool.request().query(rankingsplayers);
    
        res.json(result.recordset);
        
      } catch (error) {
        res.status(500);
        res.send(error);
      }
    };

export default controller; 

