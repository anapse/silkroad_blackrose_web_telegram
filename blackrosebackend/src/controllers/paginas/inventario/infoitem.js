import { getconnection } from "../../../database/conection"

import {querrys } from "../../../database/dbquery";
const controller = {};

controller.infoitem = async (req, res) => {
 const {Item} =  req.params;
 
  try {
    const pool = await getconnection();
    const result = await pool.request().input("Item", Item).query(querrys.infoitem);
   

    const respuesta = result.recordset


    res.json(respuesta);
  } catch (error) {
    res.status(500);
    res.send(error)
    
  }
};

export default controller;