import { globales } from "../../../database/dbquery";
import { getconnection } from "../../../database/conection";

const controller = {};

controller.globales = async (req, res) => {
    
  const Cant = parseInt(req.params.Cant);
  console.log(Cant);
  let Cont = req.params.Cont;
  if (Cont === "vacio") {
    Cont = "";
  } else {
    Cont = req.params.Cont;
  }

  try {
    const pool = await getconnection();
    const result = await pool
      .request()
      .input("Cant", Cant)
      .input("Cont", "%" + Cont + "%")
      .query(globales);

    res.json(result.recordset);
  } catch (error) {
    res.status(500);
    res.send(error);
  }
};

export default controller;
