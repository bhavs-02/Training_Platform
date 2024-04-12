const {Pool}=require("pg")

const pool = new Pool({
    user: "postgres",
    password: "Jman@600113",
    host: "localhost",
    port: 5432,
    database: 'finalproj'
})

module.exports = pool;