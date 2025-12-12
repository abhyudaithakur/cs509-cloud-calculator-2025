import mysql from "mysql2";

let pool;

export const handler = async (event) => {
    pool = mysql.createPool({
        host: process.env.RDS_HOST,
        user: process.env.RDS_USER,
        password: process.env.RDS_PASSWORD,
        database: process.env.RDS_DATABASE,
    });

    let statusCode;
    let body;

    try {
        const name = event.name;
        if (!name) {
            throw new Error("name is required");
        }

        await new Promise((resolve, reject) => {
            pool.query(
                "DELETE FROM Constants WHERE name = ?",
                [name],
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
        });

        statusCode = 200;
        body = "ok";
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
