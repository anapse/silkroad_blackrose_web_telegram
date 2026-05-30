import { getconnection } from "../../../shared/database/conection";
import {  querrys } from "../../../shared/database/dbquery";

const controller = {};

controller.rankingjob =async (req,res)=>{

    try {
        const pool = await getconnection();
        const result = await pool.request().query(querrys.rjob);
    
        res.json(result.recordset);
        
      } catch (error) {
        res.status(500);
        res.send(error,message);
      }
    };

export default controller; 

