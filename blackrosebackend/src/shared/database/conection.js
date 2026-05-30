import sql from "mssql";
import { DB_CONFIG } from "../config/database.js";

export async function getconnection() {
    try {
        const pool = await sql.connect(DB_CONFIG)
        return pool;
    } catch (error) {
        // Error de conexión
    }

}
