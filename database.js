// const pgp = require('pg-promise')()
import pgp from 'pg-promise'

const connectionConf = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
}
export const db = pgp(connectionConf)
