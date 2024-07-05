// const pgp = require('pg-promise')()
import pgp from 'pg-promise'

const connectionConf = {
  connection: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
}
const db = pgp(connectionConf)
export default db