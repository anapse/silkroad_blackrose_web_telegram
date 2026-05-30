import { getconnection } from "../../../shared/database/conection";
import { querrys } from "../../../shared/database/dbquery";

const controller = {};
var md5 = require("md5");

controller.registro = async (req, res) => {
  const { ID, PW, EMAIL, SUGERIDO } = req.body?.datos;
  let Error = ""
  let emailRegex = /[a-z0-9]+@[a-z]+\.[a-z]{2,3}/;

  const PWMD5 = md5(PW);
  if (ID.length < 5) {
    Error = "ID Muy Corto"
  } else if (PW.length < 5) {
    Error = "PW Muy Corto"
  } if (!emailRegex.test(EMAIL)) {
    Error = "Email Invalido"
  } else {
    Error = "Usuario Registrado Satisfactoriamernte"

    try {
      const pool = await getconnection();
      await pool
        .request()
        .input("ID", ID)
        .input("PW", PWMD5)
        .input("Contra", PW)
        .input("Email", EMAIL)
        .input("referido", SUGERIDO)
        .query(querrys.registro);


      res.json(Error)

    } catch (error) {
      res.status(500);
      res.send(Error);
    }
  }
}
export default controller;

