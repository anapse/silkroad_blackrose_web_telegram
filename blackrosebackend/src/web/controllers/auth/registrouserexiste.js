import { getconnection } from "../../../shared/database/conection";
import { querrys } from "../../../shared/database/dbquery";

const controller = {};

controller.users = async (req, res) => {
  const { User } = req.params;

  const pool = await getconnection();
  const result = await pool
    .request()
    .input("User", User)
    .query(querrys.userexiste);

  
  if (result.recordset.length > 0 ) {
    res.json("existe");
  } else {
    res.json("noexiste");
  }
};

export default controller;

