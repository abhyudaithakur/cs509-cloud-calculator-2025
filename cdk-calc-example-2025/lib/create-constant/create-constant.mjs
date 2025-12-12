import mysql from "mysql2";

let pool;

export const handler = async (event) => {
    // Same DB config as add.mjs
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
        const rawValue = event.value;

        if (!name || rawValue === undefined || rawValue === null) {
            throw new Error("name and value are required");
        }

        const numericValue = parseFloat(rawValue);
        if (Number.isNaN(numericValue)) {
            throw new Error("value must be numeric");
        }

        // Insert or update the constant
        await new Promise((resolve, reject) => {
            pool.query(
                "INSERT INTO Constants (name, value) VALUES (?, ?) " +
                "ON DUPLICATE KEY UPDATE value = VALUES(value)",
                [name, numericValue],
                (error, results) => {
                    if (error) return reject(error);
                    resolve(results);
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
