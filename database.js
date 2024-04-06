const pgp = require('pg-promise')()
const { Sequelize } = require('sequelize')
import initUserModel from './models/user.model'

const connectionConf = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
}
const db = pgp(connectionConf)

module.exports = db

const sequelize = new Sequelize(process.env.DATABASE_URL)
const db_user = {}
db_user.Sequelize = Sequelize
db_user.sequelize = sequelize
db_user.user = initUserModel(sequelize, Sequelize)

export default db_user