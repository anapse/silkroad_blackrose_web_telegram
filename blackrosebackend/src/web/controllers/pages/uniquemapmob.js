import { getconnection } from "../../../shared/database/conection";
import { querrys } from "../../../shared/database/dbquery";

const controller = {};

controller.uniqmap = async (req, res) => {
  try {
    const pool = await getconnection();
    const result = await pool.request().query(querrys.uniqmapmob);
    res.json(result.recordset);
  } catch (error) {
    res.status(500);
    res.send(error);
  }
};
export default controller;

