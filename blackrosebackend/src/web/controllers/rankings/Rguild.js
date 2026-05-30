import { getconnection } from "../../../shared/database/conection";
import {  rguild } from "../../../shared/database/dbquery";

const controller = {};

controller.rankingguild =async (req,res)=>{

    try {
        const pool = await getconnection();
        const result = await pool.request().query(rguild);
    
        res.json(result.recordset);
        
      } catch (error) {
        res.status(500);
        res.send(error,message);
      }
    };

export default controller; 

