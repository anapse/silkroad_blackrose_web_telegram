import { getconnection } from "../../database/conection.js";

const controller = {};

controller.getPlayerData = async (req, res) => {
    const { jid } = req.params;

    try {
        const pool = await getconnection();

        const result = await pool.request()
            .input("jid", jid)
            .query(`
               SELECT 
    users.UserJID,
    chars.*,
    rlv.Exp_C          
FROM [SRO_VT_SHARD].[dbo].[_User] AS users
INNER JOIN [SRO_VT_SHARD].[dbo].[_Char] AS chars
    ON chars.CharID = users.CharID
LEFT JOIN SRO_VT_SHARD.[dbo].[_RefLevel] as rlv 
    ON chars.CurLevel = rlv.Lvl   
WHERE users.UserJID = @jid
AND chars.Deleted = 0
            `);

        return res.json({
            status: "OK",
            count: result.recordset.length,
            characters: result.recordset
        });

    } catch (error) {
        console.log(error);
        return res.json({
            status: "ERROR",
            message: error.message
        });
    }
};



// Obtener datos de un personaje específico
controller.getCharacterByID = async (req, res) => {
    const { charid } = req.params;

    try {
        const pool = await getconnection();

        const result = await pool.request()
            .input("charid", charid)
            .query(`
        SELECT *
        FROM [SRO_VT_SHARD].[dbo].[_Char]
        WHERE CharID = @charid
        AND Deleted = 0
      `);

        if (result.recordset.length === 0) {
            return res.send({ status: "ERROR", message: "Personaje no encontrado" });
        }

        return res.send({ status: "OK", character: result.recordset[0] });

    } catch (error) {
        console.log(error);
        return res.send({ status: "ERROR", message: error.message });
    }
};

export default controller;