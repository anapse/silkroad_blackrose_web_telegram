import { getconnection } from "../../../shared/database/conection";
import { querrys } from "../../../shared/database/dbquery";

const controller = {};

controller.serverevent=async (req,res)=>{

    try {
        const pool = await getconnection();
        const result = await pool.request().query(querrys.serverevent);
       let respuesta
     if (result.recordset.length > 0) {
     respuesta = true
      
     }else {
     respuesta = false
        
     }
     res.json(respuesta);
      } catch (error) {
        res.status(500);
        res.send(error,message);
      }
    };

export default controller; 

