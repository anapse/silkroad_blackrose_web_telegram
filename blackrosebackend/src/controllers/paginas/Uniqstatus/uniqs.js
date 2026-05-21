import { getconnection } from "../../../database/conection";
import {  querrys } from "../../../database/dbquery";

const controller = {};

controller.uniquestatus =async (req,res)=>{

    try {
        const pool = await getconnection();
        const result = await pool.request().query(querrys.uniqstatus);
    
        res.json(result.recordset);
        
      } catch (error) {
        res.status(500);
        res.send(error,message);
      }
    };

export default controller; 