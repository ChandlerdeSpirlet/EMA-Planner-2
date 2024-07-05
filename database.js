// const pgp = require('pg-promise')()
import pgPromise from 'pg-promise'

const connectionConf = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
}
export const db = pgPromise(connectionConf)
