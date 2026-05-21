import { getconnection } from "../../database/conection";
import {querrys } from "../../database/dbquery";

const controller = {};

controller.datosplayer = async (req, res) => {
 const {Char} =  req.params;
 
  try {
    const pool = await getconnection();
    const result = await pool.request().input("Char", Char).query(querrys.datosplayer);
    const respuesta = result.recordset
    const masterys = respuesta.map((valor)=>{
      return valor.MasteryID
    })
    const resp = {...respuesta[0],MasteryID:masterys}

    res.json(resp);
  } catch (error) {
    res.status(500);
    res.send(error,message);
  }
};

export default controller;


//
