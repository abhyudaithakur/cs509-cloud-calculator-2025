import mysql from 'mysql2';

var pool;

let ComputeArgumentValue = (value) => {
    let numeric_value = parseFloat(value);
    if (isNaN(numeric_value)) {
        return new Promise((resolve, reject) => {
            pool.query(
                "SELECT * FROM Constants WHERE name=?",
                [value],
                (error, rows) => {
                    if (error) { return reject(error.sqlMessage); }
                    if (rows && rows.length === 1) {
                        return resolve(rows[0].value);
                    } else {
                        return reject("unable to locate constant '" + value + "'");
                    }
                }
            );
        });
    } else {
        return Promise.resolve(numeric_value);
    }
};

export const handler = async (event) => {
    pool = mysql.createPool({
        host: process.env.RDS_HOST,
        user: process.env.RDS_USER,
        password: process.env.RDS_PASSWORD,
        database: process.env.RDS_DATABASE
    });

    let result;
    let code;

    try {
        const arg1_value = await ComputeArgumentValue(event.arg1);
        const arg2_value = await ComputeArgumentValue(event.arg2);
        result = arg1_value * arg2_value;   // multiply
        code = 200;
    } catch (error) {
        result = "SQL error:" + error;
        code = 400;
    }

    const response = {
        statusCode: code,
        body: JSON.stringify(result),
    };

    pool.end();     // close DB connections
    return response;
};
