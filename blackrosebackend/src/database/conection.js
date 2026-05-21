import sql from "mssql";

const dbsetting = {
    user: 'sa',
    password: '16546203osiris*',
    server: 'localhost',
    port: 51551,
    database: 'SRO_VT_SHARD',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

export async function getconnection() {
    try {
        const pool = await sql.connect(dbsetting)
        return pool;
    } catch (error) {
        console.log(error);
    }

}
