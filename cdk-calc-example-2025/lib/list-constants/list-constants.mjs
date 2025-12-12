import mysql from "mysql2";

let pool;

export const handler = async () => {
    pool = mysql.createPool({
        host: process.env.RDS_HOST,
        user: process.env.RDS_USER,
        password: process.env.RDS_PASSWORD,
        database: process.env.RDS_DATABASE,
    });

    let statusCode;
    let body;

    try {
        const rows = await new Promise((resolve, reject) => {
            pool.query(
                "SELECT name, value FROM Constants ORDER BY name",
                (error, rows) => {
                    if (error) return reject(error);
                    resolve(rows);
                }
            );
        });

        statusCode = 200;
        body = { constants: rows };
    } catch (err) {
        statusCode = 400;
        body = {
            error:
                "Database error: " +
                (err.sqlMessage || err.message || String(err)),
        };
    }

    pool.end();

    return {
        statusCode,
        body: JSON.stringify(body),
    };
};
