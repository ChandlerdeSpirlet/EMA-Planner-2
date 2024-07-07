const pgp = require('pg-promise')()

const connectionConf = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
}
const db = pgp(connectionConf)

module.exports = db