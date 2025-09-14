import mysql from 'mysql2/promise'

export const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    port: Number(process.env.MYSQL_PORT) || 3306,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ssl: { "rejectUnauthorized": true },
    waitForConnections: true,
    connectionLimit: 10,
})