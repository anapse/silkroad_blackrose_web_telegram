import { map } from "mssql";
import { getconnection } from "../../../shared/database/conection";
import { loginin } from "../../../shared/database/dbquery";
import { JWT_CONFIG } from "../../../shared/config/security.js";
const jwt = require("jsonwebtoken");
const controller = {};
var md5 = require("md5");

controller.login = async (req, res) => {
  const { ID, PW } = req.body;
  const PWMD5 = md5(PW);


  try {
    const pool = await getconnection();
    const result = await pool
      .request()
      .input("ID", ID)
      .input("PW", PWMD5)
      .query(loginin);
    const respuesta = result.recordset;

    if (respuesta.length > 0) {


      logininn(respuesta);

    }
  } catch (error) {
    res.status(500);
    res.send(error);
  }

  function logininn(data) {

    const infouser = {
      user: data[0].Usuario,
      Silk: data[0].Silk,
    };
    const players = data.map((valor) => {
      return valor.Char
    })
    const objids = data.map((valor) => {
      return valor.objid
    })
    const accesttoken = generartoken({ ID: ID });

    const resp = { ...infouser, players, objids, token: accesttoken };
    res.json(resp);

  }
  function badlogin() { }
};
export default controller;

function generartoken(user) {
  return jwt.sign(user, JWT_CONFIG.secret, { expiresIn: JWT_CONFIG.expiresIn });
}

