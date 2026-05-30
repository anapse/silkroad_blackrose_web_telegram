import { getconnection } from "../../../shared/database/conection";
import {querrys } from "../../../shared/database/dbquery";

const controller = {};

controller.inventarioavatar = async (req, res) => {
 const {Char} =  req.params;
 
  try {
    const pool = await getconnection();
    const result = await pool.request().input("Char", Char).query(querrys.inventarioavatar);
    const respuesta = result.recordset
  

    res.json(respuesta);
  } catch (error) {
    res.status(500);
    res.send(error,message);
  }
};

export default controller;

