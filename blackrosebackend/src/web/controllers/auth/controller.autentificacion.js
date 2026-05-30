import jwt from "jsonwebtoken";
import { getconnection } from "../../../shared/database/conection";
import md5 from "md5";
import { JWT_CONFIG } from "../../../shared/config/security.js";
const controller = {};

// ================= LOGIN NORMAL =================
controller.auth = (req, res) => {
  const { token } = req.body;

  if (!token) return res.send("Acceso Denegado");

  try {
    const payload = jwt.verify(token, JWT_CONFIG.secret);
    return res.send(payload);
  } catch (error) {
    return res.send({ ID: "error" });
  }
};

// ================= TELEGRAM =================

// 🔍 GET → buscar cuentas
controller.telegramAuth = async (req, res) => {
  const { telegramId } = req.params;

  try {
    const pool = await getconnection();

    const result = await pool.request().query(`
      SELECT JID, StrUserID
      FROM [SRO_VT_ACCOUNT].[dbo].TB_User
      WHERE registerid = 'tg_${telegramId}'
    `);

    if (result.recordset.length === 0) {
      return res.send({ status: "NO_ACCOUNT" });
    }

    return res.send({
      status: "OK",
      accounts: result.recordset,
    });

  } catch (error) {
    return res.send({ status: "ERROR", error: error.message });
  }
};

// 🔗 POST → vincular
controller.telegramLink = async (req, res) => {
  const { jid, telegramId } = req.body;

  try {
    const pool = await getconnection();

    const check = await pool.request().query(`
      SELECT 1 FROM [SRO_VT_ACCOUNT].[dbo].[TB_User]
      WHERE registerid = 'tg_${telegramId}'
    `);

    if (check.recordset.length > 0) {
      return res.send({ status: "ALREADY_LINKED" });
    }

    await pool.request().query(`
      UPDATE TB_User
      SET registerid = 'tg_${telegramId}'
      WHERE JID = ${jid}
    `);

    return res.send({ status: "LINKED" });

  } catch (error) {
    return res.send({ status: "ERROR", error: error.message });
  }
};

// 🔐 POST → login
controller.telegramLogin = async (req, res) => {
  const { jid, telegramId } = req.body;

  try {
    const pool = await getconnection();

    const result = await pool.request().query(`
      SELECT JID, StrUserID
      FROM [SRO_VT_ACCOUNT].[dbo].[TB_User]
      WHERE JID = ${jid}
      AND registerid = 'tg_${telegramId}'
    `);

    if (result.recordset.length === 0) {
      return res.send({ status: "DENIED" });
    }

    const user = result.recordset[0];

    const token = jwt.sign(
      { jid: user.JID, user: user.StrUserID },
      JWT_CONFIG.secret
    );

    return res.send({ status: "OK", token });

  } catch (error) {
    return res.send({ status: "ERROR", error: error.message });
  }
};

controller.login = async (req, res) => {
  const { user, password } = req.body;

  if (!user || !password) {
    return res.send({ status: "ERROR", message: "Faltan datos" });
  }

  try {
    const pool = await getconnection();

    const result = await pool.request()
      .input("user", user)
      .input("password", md5(password))
      .query(`
    SELECT JID, StrUserID, Email
    FROM [SRO_VT_ACCOUNT].[dbo].[TB_User]
    WHERE StrUserID = @user
    AND password = @password
  `);

    if (result.recordset.length === 0) {
      return res.send({ status: "ERROR", message: "Usuario o contraseña incorrectos" });
    }

    const userData = result.recordset[0];
    const token = jwt.sign(
      { jid: userData.JID, user: userData.StrUserID },
      JWT_CONFIG.secret
    );

    return res.send({
      status: "OK",
      token,
      jid: userData.JID,
      user: userData.StrUserID,
      email: userData.Email   // 👈
    });
  } catch (error) {
    return res.send({ status: "ERROR", message: error.message });
  }
};
export default controller;

