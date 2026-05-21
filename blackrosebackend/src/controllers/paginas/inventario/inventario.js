import { getconnection } from "../../../database/conection"
import {inventariochar } from "../../../database/dbquery";
import {querrys } from "../../../database/dbquery";
const controller = {};

controller.inventario = async (req, res) => {
 const {Char} =  req.params;
 
  try {
    const pool = await getconnection();
    const result = await pool.request().input("Char", Char).query(inventariochar);
   
    const avatar = await pool.request().input("Char", Char).query(querrys.inventarioavatar);
    const respuesta = result.recordset
    const respuesta2 = respuesta.map((resp)=>({...resp,avatarset:avatar.recordset})) 

    res.json(respuesta2);
  } catch (error) {
    res.status(500);
    res.send(error,message);
  }
};

export default controller;