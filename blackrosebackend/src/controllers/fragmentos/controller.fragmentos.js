import { getconnection } from "../../database/conection";
import { cantplateronline } from "../../database/dbquery";

const controller = {};

controller.fragmentoonlines =async (req,res)=>{

    try {
        const pool = await getconnection();
        const result = await pool.request().query(cantplateronline);
    
        res.json(result.recordset);
        
      } catch (error) {
        res.status(500);
        res.send(error,message);
      }
    };

export default controller; 