import { getconnection } from "../../database/conection";
import { querrys } from "../../database/dbquery";

const controller = {};

controller.cantsilk = async (req, res) => {
  const { user } = req.params;
  try {
  const pool = await getconnection();
  const result = await pool
    .request()
    .input("user", user)
    .query(querrys.cantsilk);


    const resultado = result.recordset[0].silk_own;
    res.json(resultado);

} catch (error) {
     res.json(0)
  }
  
};

export default controller;
