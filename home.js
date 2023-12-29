const express = require('express')
const bodyParser = require('body-parser')
const nunjucks = require('nunjucks')
const session = require('express-session')
const exp_val = require('express-validator')
const flash = require('connect-flash')

// const ics = require('ics')
var cookieParser = require('cookie-parser')
// const { writeFileSync, read } = require('fs')
// const { readFileSync } = require('fs')
'use strict';
// const request = require('request')
// const crypto = require('crypto')
// const Json2csvParser = require("json2csv").Parser
// const fs = require("fs")
// const csv = require('csv-parser')
const fileUpload = require('express-fileupload')

// const settings = {
//   port: 8080,
//   apiv4url: 'https://api.paysimple.com/v4',
//   apiv4url_beta: 'https://sandbox-api.paysimple.com/v4',
//   username: 'APIUser145350',
//   username_beta: 'APIUser156358',
//   apikey: process.env.ps_api,
//   apikey_beta: process.env.ps_api_beta
// }

// function getAuthHeader(){
//   let time = (new Date()).toISOString();
//   let hash = crypto.createHmac('SHA256', settings.apikey).update(time).digest('base64');
//   return "PSSERVER" + " " + "accessid=" + settings.username + "; timestamp=" + time + "; signature=" + hash;
// }
// function getAuthHeader_beta(){
//   let time = (new Date()).toISOString();
//   let hash = crypto.createHmac('SHA256', settings.apikey_beta).update(time).digest('base64');
//   return "PSSERVER" + " " + "accessid=" + settings.username_beta + "; timestamp=" + time + "; signature=" + hash;
// }

const app = express()
app.use(flash())
const port = process.env.port
const router = express.Router()
app.use(cookieParser('side-kick-2'))
router.use(fileUpload())
router.use(session({
  secret: process.env.secret_key,
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 60 * 60 * 1000, secure: false }
}))

app.set('view engine', 'html')
app.engine('html', nunjucks.render)
nunjucks.configure('views', { noCache: true })

app.use(express.static(__dirname))
app.use(bodyParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))
app.use('/', router)
//router.use(exp_val())

// const db = require('./database')
// const { proc } = require('./database')
// const { get } = require('http')
// const { json } = require('body-parser')
// const { resolveObjectURL } = require('buffer')

app.use(flash({ sessionKeyName: 'ema-Planner-two' }))

app.get('/', (req, res) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood.herokuapp.com/')
  } else {
    if (req.session.loggedin) {
      res.render('home.html', {
      })
    } else {
      console.log('LOGIN')
      // Add login
    }
  }
})

app.listen(port, () => {
  console.info('EMA-Planner running on port', port)
})
