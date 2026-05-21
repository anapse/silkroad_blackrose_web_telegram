import { getconnection } from "../../../database/conection";
import { todaslasnoticias } from "../../../database/dbquery";

const controller = {};

controller.todaslasnoticias =async (req,res)=>{

    try {
        const pool = await getconnection();
        const result = await pool.request().query(todaslasnoticias);
    
        res.json(result.recordset);
        
      } catch (error) {
        res.status(500);
        res.send(error,message);
      }
    };

export default controller; 