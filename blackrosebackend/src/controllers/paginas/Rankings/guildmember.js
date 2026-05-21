import { getconnection } from "../../../database/conection";
import {  querrys } from "../../../database/dbquery";

const controller = {};

controller.guildmember =async (req,res)=>{
    const {GuilID} =  req.params;
    try {
        const pool = await getconnection();
        const result = await pool.request().input("GuilID", GuilID).query(querrys.guildmember);
    
        res.json(result.recordset);
        
      } catch (error) {
        res.status(500);
        res.send(error);
      }
    };

export default controller; 