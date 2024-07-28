/* eslint-disable no-case-declarations */
const express = require('express')
const bodyParser = require('body-parser')
const nunjucks = require('nunjucks')
const session = require('express-session')
const path = require('path')
const ics = require('ics')
// const exp_val = require('express-validator')
const { check, validationResult } = require('express-validator')
const flash = require('connect-flash')
const fs = require('fs')
const { writeFileSync } = require('fs')
const { readFileSync } = require('fs')
// const ics = require('ics')
var cookieParser = require('cookie-parser')
// const { readFileSync } = require('fs')
'use strict';
const request = require('request')
const crypto = require('crypto')
// const Json2csvParser = require("json2csv").Parser
// const csv = require('csv-parser')
const fileUpload = require('express-fileupload')
const Passage = require('@passageidentity/passage-node')

const passageConfig = {
  appID: process.env.PASSAGE_ID,
  apiKey: process.env.PASSAGE_API,
}
const staffArray = process.env.STAFF_USER_ID.split(',')

const settings = {
  port: 8080,
  apiv4url: 'https://api.paysimple.com/v4',
  apiv4url_beta: 'https://sandbox-api.paysimple.com/v4',
  username: process.env.API_USER,
  username_beta: 'APIUser156358',
  apikey: process.env.PS_API,
  apikey_beta: process.env.ps_api_beta
}

function getAuthHeader () {
  const time = (new Date()).toISOString()
  const hash = crypto.createHmac('SHA256', settings.apikey).update(time).digest('base64')
  return 'PSSERVER' + ' ' + 'accessid=' + settings.username + '; timestamp=' + time + '; signature=' + hash
}
const sdk = require('api')('@paysimple-developer-portal/v1.1#fv6vw4al5ip3eo1')
const auth_header = getAuthHeader()
sdk.auth(auth_header)
// function getAuthHeader_beta () {
//   let time = (new Date()).toISOString()
//   let hash = crypto.createHmac('SHA256', settings.apikey_beta).update(time).digest('base64')
//   return "PSSERVER" + " " + "accessid=" + settings.username_beta + "; timestamp=" + time + "; signature=" + hash;
// }

const app = express()
app.use(flash())
const port = process.env.PORT
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
// router.use(exp_val()) https://express-validator.github.io/docs/guides/getting-started

const db = require('./database')
const { type } = require('os')
// const { proc } = require('./database')
// const { get } = require('http')
// const { json } = require('body-parser')
// const { resolveObjectURL } = require('buffer')

app.use(flash({ sessionKeyName: 'ema-Planner-two' }))

console.log('Passage is ' + typeof Passage)
// let passage = new Passage(passageConfig)
let passage = new Passage(passageConfig)
console.log('passage is ' + typeof passage)
let passageAuthMiddleware = (() => {
  return async (req, res, next) => {
    try {
      let userID = await passage.authenticateRequest(req)
      if (userID) {
        res.userID = userID
        next()
      }
    } catch (e) {
      res.status(401).render('login')
      console.log('Error authenticating: ' + e)
      //res.status(401).send('Could not authenticate user!')
    }
  }
})()

function parseStudentInfo (info) {
  console.log('In parseStudentInfo, got: ' + info)
  let studInfo = ['', 0]
  studInfo[0] = info.substring(0, info.indexOf(' - '))
  studInfo[1] = info.substring(info.indexOf(' - ') + 3, info.length)
  if (studInfo[0].indexOf(',') !== -1) {
    const lastName = studInfo[0].substring(0, studInfo[0].indexOf(','))
    const firstName = studInfo[0].substring(studInfo[0].indexOf(',') + 2, studInfo[0].length)
    studInfo[0] = firstName + ' ' + lastName
  }
  console.log('In parseStudentInfo, returning: ' + studInfo)
  return studInfo
}

function convertTZ (date, tzString) {
  return new Date((typeof date === 'string' ? new Date(date) : date).toLocaleString('en-US', { timeZone: tzString }))
}
function parseBB(currentColor, isPromotion) { //returns belt color, level, and belt_order
  var beltInfo = ['', '', 999]
  if (isPromotion){
    switch (currentColor) {
      case 'High Brown': 
        beltInfo = ['Prep', 'Black Belt', 4]
        break;
      case 'Prep':
        beltInfo = ['Conditional', 'Black Belt', 5]
        break;
      case 'Conditional': 
        beltInfo = ['Conditional (pc)', 'Black Belt', 6]
        break;
      case 'Conditional (pc)':
        beltInfo = ['First Degree', 'Black Belt', 7]
        break;
      case 'First Degree':
        beltInfo = ['First Degree - White Bar', 'Black Belt', 8]
        break;
      case 'First Degree - White Bar':
        beltInfo = ['First Degree - Gold Bar', 'Black Belt', 9]
        break;
      case 'First Degree - Gold Bar':
        beltInfo = ['First Degree - Orange Bar', 'Black Belt', 10]
        break;
      case 'First Degree - Orange Bar':
        beltInfo = ['First Degree - Green Bar', 'Black Belt', 11]
        break;
      case 'First Degree - Green Bar':
        beltInfo = ['First Degree - Purple Bar', 'Black Belt', 12]
        break;
      case 'First Degree - Purple Bar':
        beltInfo = ['First Degree - Blue Bar', 'Black Belt', 13]
        break;
      case 'First Degree - Blue Bar':
        beltInfo = ['First Degree - Brown Bar', 'Black Belt', 14]
        break;
      case 'First Degree - Brown Bar':
        beltInfo = ['Second Degree', 'Black Belt', 15]
        break;
      case 'Second Degree':
        beltInfo = ['Second Degree (pc)', 'Black Belt', 16]
        break;
      case 'Second Degree (pc)':
        beltInfo = ['Third Degree', 'Black Belt', 17]
        break;
      case 'Third Degree':
        beltInfo = ['Third Degree (pc)', 'Black Belt', 18]
        break;
      case 'Third Degree (pc)':
        beltInfo = ['Fourth Degree', 'Black Belt', 19]
        break;
      case 'Fourth Degree':
        beltInfo = ['Fourth Degree (pc)', 'Black Belt', 20]
        break;
      case 'Fourth Degree (pc)':
        beltInfo = ['Fifth Degree', 'Black Belt', 21]
        break;
      case 'Fifth Degree':
        beltInfo = ['Fifth Degree (pc)', 'Black Belt', 22]
        break;
      case 'Fifth Degree (pc)':
        beltInfo = ['Sixth Degree', 'Black Belt', 23]
        break;
      default:
        console.log('Unknown belt color: ' + currentColor)
        beltInfo = ['?', '?', 999];
        break;
    }
  } else {
    switch (currentColor) {
      case 'High Brown':
        beltInfo = ['High Brown', 'Level 3', 3]
        break;
      case 'Prep':
        beltInfo = ['Prep', 'Black Belt', 4]
        break;
      case 'Conditional': 
        beltInfo = ['Conditional', 'Black Belt', 5]
        break;
      case 'Conditional (pc)':
        beltInfo = ['Conditional (pc)', 'Black Belt', 6]
        break;
      case 'First Degree':
        beltInfo = ['First Degree', 'Black Belt', 7]
        break;
      case 'First Degree - White Bar':
        beltInfo = ['First Degree - White Bar', 'Black Belt', 8]
        break;
      case 'First Degree - Gold Bar':
        beltInfo = ['First Degree - Gold Bar', 'Black Belt', 9]
        break;
      case 'First Degree - Orange Bar':
        beltInfo = ['First Degree - Orange Bar', 'Black Belt', 10]
        break;
      case 'First Degree - Green Bar':
        beltInfo = ['First Degree - Green Bar', 'Black Belt', 11]
        break;
      case 'First Degree - Purple Bar':
        beltInfo = ['First Degree - Purple Bar', 'Black Belt', 12]
        break;
      case 'First Degree - Blue Bar':
        beltInfo = ['First Degree - Blue Bar', 'Black Belt', 13]
        break;
      case 'First Degree - Brown Bar':
        beltInfo = ['First Degree - Brown Bar', 'Black Belt', 14]
        break;
      case 'Second Degree':
        beltInfo = ['Second Degree', 'Black Belt', 15]
        break;
      case 'Second Degree (pc)':
        beltInfo = ['Second Degree (pc)', 'Black Belt', 16]
        break;
      case 'Third Degree':
        beltInfo = ['Third Degree', 'Black Belt', 17]
        break;
      case 'Third Degree (pc)':
        beltInfo = ['Third Degree (pc)', 'Black Belt', 18]
        break;
      case 'Fourth Degree':
        beltInfo = ['Fourth Degree', 'Black Belt', 19]
        break;
      case 'Fourth Degree (pc)':
        beltInfo = ['Fourth Degree (pc)', 'Black Belt', 20]
        break;
      case 'Fifth Degree':
        beltInfo = ['Fifth Degree', 'Black Belt', 21]
        break;
      case 'Fifth Degree (pc)':
        beltInfo = ['Fifth Degree (pc)', 'Black Belt', 22]
        break;
      case 'Sixth Degree':
        beltInfo = ['Sixth Degree', 'Black Belt', 23]
        break;
      default:
        console.log('Unknown belt color: ' + currentColor);
        beltInfo = ['?', '?', 999];
        break;
    }
  }
  return beltInfo;
}

function parseBelt (currentColor, isPromotion) { // returns belt color, level, and belt_order value
  var beltInfo = ['', '', 999]
  if (isPromotion) {
    switch (currentColor) {
      case 'Dragons White':
        beltInfo[0] = 'Dragons Gold'
        beltInfo[1] = 'Dragons'
        beltInfo[2] = -1
        break
      case 'Dragons Gold':
        beltInfo[0] = 'Dragons Orange'
        beltInfo[1] = 'Dragons'
        beltInfo[2] = -1
        break
      case 'Dragons Orange':
        beltInfo[0] = 'Dragons Green'
        beltInfo[1] = 'Dragons'
        beltInfo[2] = -1
        break
      case 'Dragons Green':
        beltInfo[0] = 'Dragons Purple'
        beltInfo[1] = 'Dragons'
        beltInfo[2] = -1
        break
      case 'Dragons Purple':
        beltInfo[0] = 'Dragons Blue'
        beltInfo[1] = 'Dragons'
        beltInfo[2] = -1
        break
      case 'Dragons Blue':
        beltInfo[0] = 'Dragons Red'
        beltInfo[1] = 'Dragons'
        beltInfo[2] = -1
        break
      case 'Dragons Red':
        beltInfo[0] = 'Dragons Brown'
        beltInfo[1] = 'Dragons'
        beltInfo[2] = -1
        break
      case 'Dragons Brown':
        beltInfo[0] = 'White'
        beltInfo[1] = 'Basic'
        beltInfo[2] = 0
        break
      case 'White':
        beltInfo[0] = 'Gold'
        beltInfo[1] = 'Basic'
        beltInfo[2] = 0
        break
      case 'Gold':
        beltInfo[0] = 'Orange'
        beltInfo[1] = 'Level 1'
        beltInfo[2] = 1
        break
      case 'Orange':
        beltInfo[0] = 'High Orange'
        beltInfo[1] = 'Level 1'
        beltInfo[2] = 1
        break
      case 'High Orange':
        beltInfo[0] = 'Green'
        beltInfo[1] = 'Level 1'
        beltInfo[2] = 1
        break
      case 'Green':
        beltInfo[0] = 'High Green'
        beltInfo[1] = 'Level 1'
        beltInfo[2] = 1
        break
      case 'High Green':
        beltInfo[0] = 'Purple'
        beltInfo[1] = 'Level 2'
        beltInfo[2] = 2
        break
      case 'Purple':
        beltInfo[0] = 'High Purple'
        beltInfo[1] = 'Level 2'
        beltInfo[2] = 2
        break
      case 'High Purple':
        beltInfo[0] = 'Blue'
        beltInfo[1] = 'Level 2'
        beltInfo[2] = 2
        break
      case 'Blue':
        beltInfo[0] = 'High Blue'
        beltInfo[1] = 'Level 2'
        beltInfo[2] = 2
        break
      case 'High Blue':
        beltInfo[0] = 'Red'
        beltInfo[1] = 'Level 3'
        beltInfo[2] = 3
        break
      case 'Red':
        beltInfo[0] = 'High Red'
        beltInfo[1] = 'Level 3'
        beltInfo[2] = 3
        break
      case 'High Red':
        beltInfo[0] = 'Brown'
        beltInfo[1] = 'Level 3'
        beltInfo[2] = 3
        break
      case 'Brown':
        beltInfo[0] = 'High Brown'
        beltInfo[1] = 'Level 3'
        beltInfo[2] = 3
        break
      case 'High Brown':
        beltInfo = ['Prep', 'Black Belt', 4]
        break
      case 'Prep':
        beltInfo = ['Conditional', 'Black Belt', 5]
        break
      case 'Conditional':
        beltInfo = ['Conditional (pc)', 'Black Belt', 6]
        break
      case 'Conditional (pc)':
        beltInfo = ['First Degree', 'Black Belt', 7]
        break
      case 'First Degree':
        beltInfo = ['First Degree - White Bar', 'Black Belt', 8]
        break
      case 'First Degree - White Bar':
        beltInfo = ['First Degree - Gold Bar', 'Black Belt', 9]
        break
      case 'First Degree - Gold Bar':
        beltInfo = ['First Degree - Orange Bar', 'Black Belt', 10]
        break
      case 'First Degree - Orange Bar':
        beltInfo = ['First Degree - Green Bar', 'Black Belt', 11]
        break
      case 'First Degree - Green Bar':
        beltInfo = ['First Degree - Purple Bar', 'Black Belt', 12]
        break
      case 'First Degree - Purple Bar':
        beltInfo = ['First Degree - Blue Bar', 'Black Belt', 13]
        break
      case 'First Degree - Blue Bar':
        beltInfo = ['First Degree - Brown Bar', 'Black Belt', 14]
        break
      case 'First Degree - Brown Bar':
        beltInfo = ['Second Degree', 'Black Belt', 15]
        break
      case 'Second Degree':
        beltInfo = ['Second Degree (pc)', 'Black Belt', 16]
        break
      case 'Second Degree (pc)':
        beltInfo = ['Third Degree', 'Black Belt', 17]
        break
      case 'Third Degree':
        beltInfo = ['Third Degree (pc)', 'Black Belt', 18]
        break
      case 'Third Degree (pc)':
        beltInfo = ['Fourth Degree', 'Black Belt', 19]
        break
      case 'Fourth Degree':
        beltInfo = ['Fourth Degree (pc)', 'Black Belt', 20]
        break
      case 'Fourth Degree (pc)':
        beltInfo = ['Fifth Degree', 'Black Belt', 21]
        break
      case 'Fifth Degree':
        beltInfo = ['Fifth Degree (pc)', 'Black Belt', 22]
        break
      case 'Fifth Degree (pc)':
        beltInfo = ['Sixth Degree', 'Black Belt', 23]
        break
      default:
        console.log('Unknown belt color: ' + currentColor)
        beltInfo = ['?', '?', 999]
        break
    }
  } else {
    switch (currentColor) {
      case 'Dragons White':
        beltInfo[0] = 'Dragons White'
        beltInfo[1] = 'Dragons'
        beltInfo[2] = -1
        break
      case 'Dragons Gold':
        beltInfo[0] = 'Dragons Gold'
        beltInfo[1] = 'Dragons'
        beltInfo[2] = -1
        break
      case 'Dragons Orange':
        beltInfo[0] = 'Dragons Orange'
        beltInfo[1] = 'Dragons'
        beltInfo[2] = -1
        break
      case 'Dragons Green':
        beltInfo[0] = 'Dragons Green'
        beltInfo[1] = 'Dragons'
        beltInfo[2] = -1
        break
      case 'Dragons Purple':
        beltInfo[0] = 'Dragons Purple'
        beltInfo[1] = 'Dragons'
        beltInfo[2] = -1
        break
      case 'Dragons Blue':
        beltInfo[0] = 'Dragons Blue'
        beltInfo[1] = 'Dragons'
        beltInfo[2] = -1
        break
      case 'Dragons Red':
        beltInfo[0] = 'Dragons Red'
        beltInfo[1] = 'Dragons'
        beltInfo[2] = -1
        break
      case 'Dragons Brown':
        beltInfo[0] = 'Dragons Brown'
        beltInfo[1] = 'Dragons'
        beltInfo[2] = -1
        break
      case 'White':
        beltInfo[0] = 'White'
        beltInfo[1] = 'Basic'
        beltInfo[2] = 0
        break
      case 'Gold':
        beltInfo[0] = 'Gold'
        beltInfo[1] = 'Basic'
        beltInfo[2] = 0
        break
      case 'Orange':
        beltInfo[0] = 'Orange'
        beltInfo[1] = 'Level 1'
        beltInfo[2] = 1
        break
      case 'High Orange':
        beltInfo[0] = 'High Orange'
        beltInfo[1] = 'Level 1'
        beltInfo[2] = 1
        break
      case 'Green':
        beltInfo[0] = 'Green'
        beltInfo[1] = 'Level 1'
        beltInfo[2] = 1
        break
      case 'High Green':
        beltInfo[0] = 'High Green'
        beltInfo[1] = 'Level 1'
        beltInfo[2] = 1
        break
      case 'Purple':
        beltInfo[0] = 'Purple'
        beltInfo[1] = 'Level 2'
        beltInfo[2] = 2
        break
      case 'High Purple':
        beltInfo[0] = 'High Purple'
        beltInfo[1] = 'Level 2'
        beltInfo[2] = 2
        break
      case 'Blue':
        beltInfo[0] = 'Blue'
        beltInfo[1] = 'Level 2'
        beltInfo[2] = 2
        break
      case 'High Blue':
        beltInfo[0] = 'High Blue'
        beltInfo[1] = 'Level 2'
        beltInfo[2] = 2
        break
      case 'Red':
        beltInfo[0] = 'Red'
        beltInfo[1] = 'Level 3'
        beltInfo[2] = 3
        break
      case 'High Red':
        beltInfo[0] = 'High Red'
        beltInfo[1] = 'Level 3'
        beltInfo[2] = 3
        break
      case 'Brown':
        beltInfo[0] = 'Brown'
        beltInfo[1] = 'Level 3'
        beltInfo[2] = 3
        break
      case 'High Brown':
        beltInfo[0] = 'High Brown'
        beltInfo[1] = 'Level 3'
        beltInfo[2] = 3
        break
      case 'Prep':
        beltInfo = ['Prep', 'Black Belt', 4]
        break
      case 'Conditional':
        beltInfo = ['Conditional', 'Black Belt', 5]
        break
      case 'Conditional (pc)':
        beltInfo = ['Conditional (pc)', 'Black Belt', 6]
        break
      case 'First Degree':
        beltInfo = ['First Degree', 'Black Belt', 7]
        break
      case 'First Degree - White Bar':
        beltInfo = ['First Degree - White Bar', 'Black Belt', 8]
        break
      case 'First Degree - Gold Bar':
        beltInfo = ['First Degree - Gold Bar', 'Black Belt', 9]
        break
      case 'First Degree - Orange Bar':
        beltInfo = ['First Degree - Orange Bar', 'Black Belt', 10]
        break
      case 'First Degree - Green Bar':
        beltInfo = ['First Degree - Green Bar', 'Black Belt', 11]
        break
      case 'First Degree - Purple Bar':
        beltInfo = ['First Degree - Purple Bar', 'Black Belt', 12]
        break
      case 'First Degree - Blue Bar':
        beltInfo = ['First Degree - Blue Bar', 'Black Belt', 13]
        break
      case 'First Degree - Brown Bar':
        beltInfo = ['First Degree - Brown Bar', 'Black Belt', 14]
        break
      case 'Second Degree':
        beltInfo = ['Second Degree', 'Black Belt', 15]
        break
      case 'Second Degree (pc)':
        beltInfo = ['Second Degree (pc)', 'Black Belt', 16]
        break
      case 'Third Degree':
        beltInfo = ['Third Degree', 'Black Belt', 17]
        break
      case 'Third Degree (pc)':
        beltInfo = ['Third Degree (pc)', 'Black Belt', 18]
        break
      case 'Fourth Degree':
        beltInfo = ['Fourth Degree', 'Black Belt', 19]
        break
      case 'Fourth Degree (pc)':
        beltInfo = ['Fourth Degree (pc)', 'Black Belt', 20]
        break
      case 'Fifth Degree':
        beltInfo = ['Fifth Degree', 'Black Belt', 21]
        break
      case 'Fifth Degree (pc)':
        beltInfo = ['Fifth Degree (pc)', 'Black Belt', 22]
        break
      case 'Sixth Degree':
        beltInfo = ['Sixth Degree', 'Black Belt', 23]
        break
      default:
        console.log('Unknown belt color: ' + currentColor)
        beltInfo = ['?', '?', 999]
        break
    }
  }
  return beltInfo
}

function parseID (idSet) {
  var setId = []
  while (idSet.indexOf(',') !== -1) {
    const idIdx = idSet.indexOf(',')
    const id = idSet.substring(0, idIdx)
    idSet = idSet.substring(idIdx + 1, idSet.length)
    setId.push(Number(id))
  }
  if ((idSet.indexOf(',') === -1) && (idSet !== '')) {
    setId.push(Number(idSet))
    idSet = ''
  }
  return setId
}

app.get('/logged-in', passageAuthMiddleware, async(req, res) => {
  let userID = res.userID
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/')
  } else {
    if (req.cookies.psg_auth_token && userID) {
      console.log('staffArray = ' + staffArray)
      let authLevel = '/student_portal_login'
      if (staffArray.includes(userID)) {
        authLevel = '/'
      } else {
        authLevel = '/student_portal_login'
      }
      res.render('logged-in', {
        authLevel: authLevel
      })
    } else {
      res.render('login', {
      })
    }
  }
})

app.get('/', passageAuthMiddleware, async(req, res) => {
  let userID = res.userID
  console.log('userID: ' + userID)
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/')
  } else {
    if (req.cookies.psg_auth_token && userID && staffArray.includes(res.userID)) {
      var event = new Date();
      var options_1 = { 
        month: 'long',
        timeZone: 'America/Denver'
      };
      var options_2 = { 
        day: 'numeric',
        timeZone: 'America/Denver'
      };
      var options_3 = { 
        year: 'numeric',
        timeZone: 'America/Denver'
      };
      const month = event.toLocaleDateString('en-US', options_1);
      const day = event.toLocaleDateString('en-US', options_2);
      const year = event.toLocaleDateString('en-US', options_3);
      const student_query = 'select level_name, count(level_name), belt_order from student_list group by level_name, belt_order order by belt_order;'
      const p_count = 'select count(belt_order) as num from student_list where belt_order = 4;'
      const c_count = 'select count(belt_order) as num from student_list where belt_order >= 5 and belt_order <= 6;'
      const b_count = 'select count(belt_order) as num from student_list where belt_order >= 7;'
      const total_new_student_list = "select count(barcode) as new_student_count from student_list where text(extract(month from join_date)) = text(extract(month from to_date($1, 'Month'))) and text(extract(year from join_date)) = text(extract(year from to_date($2, 'Year')));"
      const karate_new_student_list = "select count(barcode) as karate_student_count from student_list where text(extract(month from join_date)) = text(extract(month from to_date($1, 'Month'))) and text(extract(year from join_date)) = text(extract(year from to_date($2, 'Year'))) and karate_student = true;"
      const kickbox_new_student_list = "select count(barcode) as kickbox_student_count from student_list where text(extract(month from join_date)) = text(extract(month from to_date($1, 'Month'))) and text(extract(year from join_date)) = text(extract(year from to_date($2, 'Year'))) and kickboxer = true;"
      const find_missing = 'select count(barcode) as num_barcodes from temp_payments;'
      db.any(student_query)
        .then(function (rows) {
          // const stripe = require('stripe')(process.env.STRIPE_API_KEY)
          // stripe.balance.retrieve((err, balance) => {
          //  if (balance) {
          const failure_query = 'select count(id_failed) as failed_num from failed_payments'
          db.one(failure_query)
            .then(function (row) {
              const checked_in_query = "select count(class_session_id) as week_count from class_signups where class_session_id in (select class_id from classes where starts_at >= (now() - interval '7 hours') - interval '7 days' and starts_at < (now() + interval '17 hours'));";
              db.any(checked_in_query)
                .then(checked_week => {
                  const day_query = "select count(class_session_id) as day_count from class_signups where class_session_id in (select class_id from classes where starts_at >= (now() - interval '7 hours') - interval '24 hours' and starts_at < (now() - interval '7 hours'));"
                  db.any(day_query)
                    .then(days => {
                      const belt_count = "select count(belt_size) as belt_count from student_list where belt_size = -1;"
                      db.any(belt_count)
                        .then(belt_row => {
                          db.any(total_new_student_list, [month, year])
                            .then(stud_list => {
                              db.any(karate_new_student_list, [month, year])
                                .then(karate_list => {
                                  db.any(kickbox_new_student_list, [month, year])
                                    .then(kickbox_list => {
                                      db.any(find_missing)
                                        .then(missing => {
                                          db.one(p_count)
                                            .then(p_num => {
                                              db.one(c_count)
                                                .then(c_num => {
                                                  db.one(b_count)
                                                    .then(b_num => {
                                                      res.render('home.html', {
                                                        balance_available: '0',
                                                        balance_pending: '0',
                                                        checked_today: days,
                                                        belt_counts: belt_row,
                                                        checked_week: checked_week,
                                                        student_data: rows,
                                                        p_count: p_num,
                                                        c_count: c_num,
                                                        b_count: b_num,
                                                        failure_num: row,
                                                        month: month,
                                                        day: day,
                                                        year: year,
                                                        student_list: stud_list,
                                                        karate_list: karate_list,
                                                        kickbox_list: kickbox_list,
                                                        missing_names: missing
                                                      })
                                                    })
                                                    .catch(err => {
                                                      console.log('Could not get black belt counts ' + err);
                                                      res.render('home.html');
                                                    })
                                                })
                                                .catch(err => {
                                                  console.log('Could not get conditional counts ' + err);
                                                  res.render('home.html');
                                                })
                                            })
                                            .catch(err => {
                                              console.log('Could not get prep counts ' + err);
                                              res.render('home.html');
                                            })
                                        })
                                        .catch(err => {
                                          console.log('Could not get missing students ' + err);
                                          res.render('home.html');
                                        })
                                    })
                                    .catch(err => {
                                      console.log('Could not get new kickboxer list ' + err);
                                      res.render('home.html')
                                    })
                                })
                                .catch(err => {
                                  console.log('Cound not get new karate list ' + err);
                                  res.render('home.html')
                                })
                            })
                            .catch(err => {
                              console.log('Could not get new student list ' + err);
                              res.render('home.html');
                            })
                        })
                        .catch(err => {
                          console.log('Could not get belt count nums ' + err);
                          res.render('home.html');
                        })
                    })
                    .catch(err => {
                      console.log('Could not get checked in day numbers ' + err);
                      res.render('home.html');
                    })
                })
                .catch(err => {
                  console.log('Could not get checked in week numbers ' + err);
                  res.render('home.html');
                })
            })
            .catch(function (err) {
              console.log('Could not get failed_payment count ' + err)
              res.render('home.html')
            })
            .catch(function (err) {
              console.log('Could not run query to count students: ' + err)
            })
        })
    } else {
      res.render('login', {
      })
    }
  }
})

router.get('/home', passageAuthMiddleware, async(req, res) => {
  if (req.headers['x-forwarded-proto'] != 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/')
  } else {
    if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
      res.redirect('/')
    } else {
      res.render('login', {
        username: '',
        password: '',
        go_to: '/',
        alert_message: ''
      })
    }
  }
})

app.get('/setCookie', async (_req, res) => {
  res.cookie(
    'cbo_short_session',
    'eyJhbGciOiJSUzI1NiIsImtpZCI6InBraS04OTc5Mjk2NzI3NDc1MTEzNjI1IiwidHlwIjoiSldUIn0.eyJpc3MiOiJodHRwczovL2F1dGguY29yYmFkby5jb20iLCJzdWIiOiJ1c3ItMTM1OTEwNjU3MDExNzcxMDAzNzgiLCJleHAiOjE3MDU2NTg3MDIsIm5iZiI6MTcwNTY1ODM5MiwiaWF0IjoxNzA1NjU4NDAyLCJqdGkiOiJZY3JMWlFrVkw3ZE5YdktZMnY0YjUyamlDZlVkWUIiLCJuYW1lIjoiU2FtIE9kdW0iLCJvcmlnIjoic2FtLm9kdW1AY29yYmFkby5jb20iLCJlbWFpbCI6InNhbS5vZHVtQGNvcmJhZG8uY29tIiwidmVyc2lvbiI6MX0.0V6dfc9RQg7jCrTibJkoATCFwdbhWBWE44fOAFthb7Ch8E4XVXb6TFSa6cGyIzn_KQxeotUaRIueJKINY-BB2aA-DnrPP7NAue2N76NdBsjoJLH3CyCbNNZ506UlLpTbgvM5KWdDQhHL2uN36qiH_tfHMVrvVALwecmMjMWPsKT7HwZmTL3WzDud6IZcWXVOi0LgyrbDV0pg5Q2g1XWcnQ_NZq0Pg9AYTrl89CLQFPvQbGVO8hPiasZfXcfghOiceD_U8Mg4DJ2nqX2DIUhCTgwfXWItfhwJLXFGE-3cuyHGpiBuRLmfsO9nps3kITNg9JCTSP3gztvSh02za4TTOg',
    { maxAge: 5400000, httpOnly: false },
  );
  res.send('Cookie set!');
});

app.get('/logged-in', passageAuthMiddleware, async(req, res) => {
  let userID = res.userID
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/')
  } else {
    if (req.cookies.psg_auth_token && userID) {
      const staffArray = process.env.STAFF_USER_ID.split(',')
      const authLevel = ''
      if (staffArray.includes(userID)) {
        const authLevel = '/'
      } else {
        const authLevel = '/student_portal_login'
      }
      res.render('logged-in', {
        authLevel: authLevel
      })
    } else {
      res.render('login', {
      })
    }
  }
})

router.get('/login', (req, res) => {
  res.render('login', {
    project_id: process.env.PROJECT_ID
  })
})

router.get('/profile', (req, res) => {
  res.render('profile', {
    project_id: process.env.PROJECT_ID
  })
})

router.get('/login_success', (req, res) => {
  console.log('req.session.loggedin = ' + req.session.loggedin)
  res.render('login_success', {

  })
})

router.get('/login_failure/(:reason)', (req, res) => {
  res.render('login_failure', {
    reason: req.params.reason
  })
})

const loginValidate = [
  check('username', 'Username must not be empty').isLength({ min: 1 }).trim().escape(), check('password').isLength({ min: 8 }).withMessage('Password must be greater than 8 characters').trim().escape()
]
router.post('/login', loginValidate, (req, res) => {
  const loginErrors = validationResult(req)
  if (!loginErrors.isEmpty()) {
    res.status(422).json({ errors: loginErrors.array() })
  } else {
    const item = {
      username: req.body.username,
      password: req.body.password,
      go_to: req.body.go_to
    }
    if (item.username && item.password) {
      db.query('select * from login where username = $1 and password = $2', [item.username, item.password])
        .then(result => {
          if (Number(result.length) > 0) {
            console.log('Authenticated')
            req.session.loggedin = true
            req.session.username = item.username
            if (req.session.username === 'cdespirlet') {
              item.go_to = '/workout_home'
            }
            res.render('login_success', {
              go_to: item.go_to
            })
          } else {
            res.redirect('login_failure/username')
          }
        })
        .catch(err => {
          console.log('login error - ' + err)
          res.redirect('login_failure/username')
        })
    } else {
      console.log('Username and password not received')
    }
  }
})

router.get('/documents', (req, res) => {
  res.render('documents', {
  })
})

router.get('/schedule.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/sched.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/sched.pdf'))
    res.contentType('application/pdf')
    res.set('Cache-Control', 'no-store')
    res.set('Cache-Control', 'max-age=0')
    res.send(data)
  }
})
router.get('/Basic_Rubric.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/Basic_Rubric.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/Basic_Rubric.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/Level_1_Rubric.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/Level_1_Rubric.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/Level_1_Rubric.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/Level_2_Rubric.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/Level_2_Rubric.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/Level_2_Rubric.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/Level_3_Rubric.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/Level_3_Rubric.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/Level_3_Rubric.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/Level_1_Manual.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/Level_1_Manual.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/Level_1_Manual.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/Level_2_Manual.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/Level_2_Manual.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/Level_2_Manual.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/Level_3_Manual.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/Level_3_Manual.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/Level_3_Manual.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/CalendlyInstructions.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/CalendlyInstructions.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/CalendlyInstructions.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/ITP.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/ITP.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/ITP.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/L1.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/Level_1_Combos.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/Level_1_Combos.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/L2.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/Level_2_Combos.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/Level_2_Combos.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/L3.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/Level_3_Combos.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/Level_3_Combos.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/bingo_cards.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/bingo_cards.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/bingo_cards.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/aspHomework.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/ASPhomework.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/ASPhomework.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/Lvl1Homework.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/Lvl1Homework.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/Lvl1Homework.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/Lvl2Homework.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/Lv21Homework.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/Lvl2Homework.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/Lvl3Homework.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/Lvl3Homework.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/Lvl3Homework.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/BBHomework.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/BBHomework.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/BBHomework.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/Lvl1Sparring.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/Lvl1Sparring.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/Lvl1Sparring.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/Lvl2Sparring.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/Lvl2Sparring.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/Lvl2Sparring.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/ASPPacket.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/ASPPacket.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/ASPPacket.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/Calendar.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/Calendar.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/Calendar.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/yearly_calendar.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('yearly_calendar.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/yearly_calendar.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/last_month.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/last_month.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/last_month.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/1Confidence', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/1Confidence.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/1Confidence.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/2Discipline', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/2Discipline.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/2Discipline.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/3Respect', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/3Respect.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/3Respect.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/4Responsibility', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/4Responsibility.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/4Responsibility.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/5Focus', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/5Focus.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/5Focus.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/6GoalSetting', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/6GoalSetting.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/6GoalSetting.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/Level1Curriculum.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/Level1Curriculum.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/Level1Curriculum.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/Level2Curriculum.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/Level2Curriculum.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/Level2Curriculum.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/Level3Curriculum.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/Level3Curriculum.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/Level3Curriculum.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})
router.get('/SWAT1Tasks.pdf', function (req, res) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/SWAT1Tasks.pdf')
  } else {
    const data = fs.readFileSync(path.join(__dirname, '/views/storedFiles/SWAT1Tasks.pdf'))
    res.contentType('application/pdf')
    res.send(data)
  }
})

router.get('/dragons_signup', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID) {
    var dragonsDateCalculation = String(convertTZ(new Date(), 'America/Denver').getMonth() + 2) + ' 10, ' + String(convertTZ(new Date(), 'America/Denver').getFullYear())

    if ((convertTZ(new Date(), 'America/Denver').getMonth() + 2) === 13) {
      const year = convertTZ(new Date(), 'America/Denver').getFullYear() + 1
      var dragonsDateCalculation = '01 10, ' + String(year)
    }
    if (req.headers['x-forwarded-proto'] !== 'https') {
      res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/dragons_signup')
    } else {
      const classQuery = "select class_id, trim(to_char(starts_at, 'Day')) || ', ' || to_char(starts_at, 'Month') || ' ' || to_char(starts_at, 'DD') || ' at ' || to_char(starts_at, 'HH:MI PM') as class_instance, level, student_count from classes where level in (-1, -1.5) and starts_at >= (CURRENT_DATE - INTERVAL '7 hour')::date and can_view = TRUE and starts_at < (to_date($1, 'MM DD, YYYY')) and can_view = TRUE order by starts_at;"
      const getNames = 'select * from signup_names(-1);'
      db.any(getNames)
        .then(names => {
          db.any(classQuery, [dragonsDateCalculation])
            .then(rows => {
              if (rows.length === 0) {
                res.render('temp_classes', {
                  level: 'dragons',
                  alert_message: 'There are no dragons classes in the near future. Check back soon for more!'
                })
              } else {
                res.render('dragons_signup', {
                  alert_message: '',
                  fname: '',
                  lname: '',
                  level: '',
                  email: '',
                  classes: rows,
                  names: names
                })
              }
            })
            .catch(err => {
              console.log('Could not render dragons belt classes. ERROR: ' + err)
              res.render('dragons_signup', {
                alert_message: 'Could not find dragons classes.',
                fname: '',
                lname: '',
                level: '',
                email: '',
                classes: 'Unable to show classes.',
                names: ''
              })
            })
        })
        .catch(err => {
          console.log('Could not render dragons names. ERROR: ' + err)
          res.render('dragons_signup', {
            alert_message: 'Could not find dragons names to display.',
            fname: '',
            lname: '',
            level: '',
            email: '',
            classes: 'Unable to show classes.',
            names: ''
          })
        })
    }
  } else {
    res.render('login', {

    })
  }
})

router.get('/basic_signup', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID) {
    var basicDateCalculation = String(convertTZ(new Date(), 'America/Denver').getMonth() + 2) + ' 10, ' + String(convertTZ(new Date(), 'America/Denver').getFullYear())

    if ((convertTZ(new Date(), 'America/Denver').getMonth() + 2) === 13) {
      const year = convertTZ(new Date(), 'America/Denver').getFullYear() + 1
      var basicDateCalculation = '01 10, ' + String(year)
    }
    if (req.headers['x-forwarded-proto'] !== 'https') {
      res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/basic_signup')
    } else {
      const classQuery = "select class_id, trim(to_char(starts_at, 'Day')) || ', ' || to_char(starts_at, 'Month') || ' ' || to_char(starts_at, 'DD') || ' at ' || to_char(starts_at, 'HH:MI PM') as class_instance, level, student_count from classes where level in (0, 0.5) and starts_at >= (CURRENT_DATE - INTERVAL '7 hour')::date and can_view = TRUE and starts_at < (to_date($1, 'MM DD, YYYY')) and can_view = TRUE order by starts_at;"
      const getNames = 'select * from signup_names(0);'
      db.any(getNames)
        .then(names => {
          db.any(classQuery, [basicDateCalculation])
            .then(rows => {
              if (rows.length === 0) {
                res.render('temp_classes', {
                  level: 'basic',
                  alert_message: 'There are no basic classes in the near future. Check back soon for more!'
                })
              } else {
                res.render('basic_signup', {
                  alert_message: '',
                  fname: '',
                  lname: '',
                  level: '',
                  email: '',
                  classes: rows,
                  names: names
                })
              }
            })
            .catch(err => {
              console.log('Could not render black belt classes. ERROR: ' + err)
              res.render('basic_signup', {
                alert_message: 'Could not find basic classes.',
                fname: '',
                lname: '',
                level: '',
                email: '',
                classes: 'Unable to show classes.',
                names: ''
              })
            })
        })
        .catch(err => {
          console.log('Could not render basic names. ERROR: ' + err)
          res.render('basic_signup', {
            alert_message: 'Could not find basic names to display.',
            fname: '',
            lname: '',
            level: '',
            email: '',
            classes: 'Unable to show classes.',
            names: ''
          })
        })
    }
  } else {
    res.render('login', {

    })
  }
})

router.get('/level1_signup', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID) {
    var level1DateCalculation = String(convertTZ(new Date(), 'America/Denver').getMonth() + 2) + ' 10, ' + String(convertTZ(new Date(), 'America/Denver').getFullYear())

    if ((convertTZ(new Date(), 'America/Denver').getMonth() + 2) === 13) {
      const year = convertTZ(new Date(), 'America/Denver').getFullYear() + 1
      var level1DateCalculation = '01 10, ' + String(year)
    }
    if (req.headers['x-forwarded-proto'] !== 'https') {
      res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/level1_signup')
    } else {
      const classQuery = "select class_id, trim(to_char(starts_at, 'Day')) || ', ' || to_char(starts_at, 'Month') || ' ' || to_char(starts_at, 'DD') || ' at ' || to_char(starts_at, 'HH:MI PM') as class_instance, level, student_count from classes where level in (1, 1.5) and starts_at >= (CURRENT_DATE - INTERVAL '7 hour')::date and can_view = TRUE and starts_at < (to_date($1, 'MM DD, YYYY')) and can_view = TRUE order by starts_at;"
      const getNames = 'select * from signup_names(0);'
      db.any(getNames)
        .then(names => {
          db.any(classQuery, [level1DateCalculation])
            .then(rows => {
              if (rows.length === 0) {
                res.render('temp_classes', {
                  level: 'level 1',
                  alert_message: 'There are no level 1 classes in the near future. Check back soon for more!'
                })
              } else {
                res.render('level1_signup', {
                  alert_message: '',
                  fname: '',
                  lname: '',
                  level: '',
                  email: '',
                  classes: rows,
                  names: names
                })
              }
            })
            .catch(err => {
              console.log('Could not render level 1 classes. ERROR: ' + err)
              res.render('level1_signup', {
                alert_message: 'Could not find level 1 classes.',
                fname: '',
                lname: '',
                level: '',
                email: '',
                classes: 'Unable to show classes.',
                names: ''
              })
            })
        })
        .catch(err => {
          console.log('Could not render level 1 names. ERROR: ' + err)
          res.render('level1_signup', {
            alert_message: 'Could not find level 1 names to display.',
            fname: '',
            lname: '',
            level: '',
            email: '',
            classes: 'Unable to show classes.',
            names: ''
          })
        })
    }
  } else {
    res.render('login', {

    })
  }
})

router.get('/level2_signup', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID) {
    var level2DateCalculation = String(convertTZ(new Date(), 'America/Denver').getMonth() + 2) + ' 10, ' + String(convertTZ(new Date(), 'America/Denver').getFullYear())

    if ((convertTZ(new Date(), 'America/Denver').getMonth() + 2) === 13) {
      const year = convertTZ(new Date(), 'America/Denver').getFullYear() + 1
      var level2DateCalculation = '01 10, ' + String(year)
    }
    if (req.headers['x-forwarded-proto'] !== 'https') {
      res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/level2_signup')
    } else {
      const classQuery = "select class_id, trim(to_char(starts_at, 'Day')) || ', ' || to_char(starts_at, 'Month') || ' ' || to_char(starts_at, 'DD') || ' at ' || to_char(starts_at, 'HH:MI PM') as class_instance, level, student_count from classes where level in (2, 2.5) and starts_at >= (CURRENT_DATE - INTERVAL '7 hour')::date and can_view = TRUE and starts_at < (to_date($1, 'MM DD, YYYY')) and can_view = TRUE order by starts_at;"
      const getNames = 'select * from signup_names(0);'
      db.any(getNames)
        .then(names => {
          db.any(classQuery, [level2DateCalculation])
            .then(rows => {
              if (rows.length === 0) {
                res.render('temp_classes', {
                  level: 'level 2',
                  alert_message: 'There are no level 2 classes in the near future. Check back soon for more!'
                })
              } else {
                res.render('level2_signup', {
                  alert_message: '',
                  fname: '',
                  lname: '',
                  level: '',
                  email: '',
                  classes: rows,
                  names: names
                })
              }
            })
            .catch(err => {
              console.log('Could not render level 2 classes. ERROR: ' + err)
              res.render('level2_signup', {
                alert_message: 'Could not find level 2 classes.',
                fname: '',
                lname: '',
                level: '',
                email: '',
                classes: 'Unable to show classes.',
                names: ''
              })
            })
        })
        .catch(err => {
          console.log('Could not render level 2 names. ERROR: ' + err)
          res.render('level2_signup', {
            alert_message: 'Could not find level 2 names to display.',
            fname: '',
            lname: '',
            level: '',
            email: '',
            classes: 'Unable to show classes.',
            names: ''
          })
        })
    }
  } else {
    res.render('login', {

    })
  }
})

router.get('/level3_signup', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID) {
    var level3DateCalculation = String(convertTZ(new Date(), 'America/Denver').getMonth() + 2) + ' 10, ' + String(convertTZ(new Date(), 'America/Denver').getFullYear())

    if ((convertTZ(new Date(), 'America/Denver').getMonth() + 2) === 13) {
      const year = convertTZ(new Date(), 'America/Denver').getFullYear() + 1
      var level3DateCalculation = '01 10, ' + String(year)
    }
    if (req.headers['x-forwarded-proto'] !== 'https') {
      res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/level3_signup')
    } else {
      const classQuery = "select class_id, trim(to_char(starts_at, 'Day')) || ', ' || to_char(starts_at, 'Month') || ' ' || to_char(starts_at, 'DD') || ' at ' || to_char(starts_at, 'HH:MI PM') as class_instance, level, student_count from classes where level in (3, 3.5) and starts_at >= (CURRENT_DATE - INTERVAL '7 hour')::date and can_view = TRUE and starts_at < (to_date($1, 'MM DD, YYYY')) and can_view = TRUE order by starts_at;"
      const getNames = 'select * from signup_names(0);'
      db.any(getNames)
        .then(names => {
          db.any(classQuery, [level3DateCalculation])
            .then(rows => {
              if (rows.length === 0) {
                res.render('temp_classes', {
                  level: 'level 3',
                  alert_message: 'There are no level 3 classes in the near future. Check back soon for more!'
                })
              } else {
                res.render('level3_signup', {
                  alert_message: '',
                  fname: '',
                  lname: '',
                  level: '',
                  email: '',
                  classes: rows,
                  names: names
                })
              }
            })
            .catch(err => {
              console.log('Could not render level 3 classes. ERROR: ' + err)
              res.render('level3_signup', {
                alert_message: 'Could not find level 3 classes.',
                fname: '',
                lname: '',
                level: '',
                email: '',
                classes: 'Unable to show classes.',
                names: ''
              })
            })
        })
        .catch(err => {
          console.log('Could not render level 3 names. ERROR: ' + err)
          res.render('level3_signup', {
            alert_message: 'Could not find level 3 names to display.',
            fname: '',
            lname: '',
            level: '',
            email: '',
            classes: 'Unable to show classes.',
            names: ''
          })
        })
    }
  } else {
    res.render('login', {

    })
  }
})

router.get('/wfc_signup', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID) {
    var wfcDateCalculation = String(convertTZ(new Date(), 'America/Denver').getMonth() + 2) + ' 10, ' + String(convertTZ(new Date(), 'America/Denver').getFullYear())

    if ((convertTZ(new Date(), 'America/Denver').getMonth() + 2) === 13) {
      const year = convertTZ(new Date(), 'America/Denver').getFullYear() + 1
      var wfc3DateCalculation = '01 10, ' + String(year)
    }
    if (req.headers['x-forwarded-proto'] !== 'https') {
      res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/wfc_signup')
    } else {
      const classQuery = "select class_id, trim(to_char(starts_at, 'Day')) || ', ' || to_char(starts_at, 'Month') || ' ' || to_char(starts_at, 'DD') || ' at ' || to_char(starts_at, 'HH:MI PM') as class_instance, level, student_count from classes where level in (8, 8.5) and starts_at >= (CURRENT_DATE - INTERVAL '7 hour')::date and can_view = TRUE and starts_at < (to_date($1, 'MM DD, YYYY')) and can_view = TRUE order by starts_at;"
      const getNames = 'select * from signup_names(0);'
      db.any(getNames)
        .then(names => {
          db.any(classQuery, [wfcDateCalculation])
            .then(rows => {
              if (rows.length === 0) {
                res.render('temp_classes', {
                  level: 'Women\'s Fight Club',
                  alert_message: 'There are no Women\'s Fight Club classes in the near future. Check back soon for more!'
                })
              } else {
                res.render('wfc_signup', {
                  alert_message: '',
                  fname: '',
                  lname: '',
                  level: '',
                  email: '',
                  classes: rows,
                  names: names
                })
              }
            })
            .catch(err => {
              console.log('Could not render women\'s fight club classes. ERROR: ' + err)
              res.render('wfc_signup', {
                alert_message: 'Could not find women\'s fight club classes.',
                fname: '',
                lname: '',
                level: '',
                email: '',
                classes: 'Unable to show classes.',
                names: ''
              })
            })
        })
        .catch(err => {
          console.log('Could not render wfc names. ERROR: ' + err)
          res.render('wfc_signup', {
            alert_message: 'Could not find women\'s fight club names to display.',
            fname: '',
            lname: '',
            level: '',
            email: '',
            classes: 'Unable to show classes.',
            names: ''
          })
        })
    }
  } else {
    res.render('login', {

    })
  }
})

router.get('/sparapalooza_signup', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID) {
    var sparapaloozaDateCalculation = String(convertTZ(new Date(), 'America/Denver').getMonth() + 2) + ' 10, ' + String(convertTZ(new Date(), 'America/Denver').getFullYear())

    if ((convertTZ(new Date(), 'America/Denver').getMonth() + 2) === 13) {
      const year = convertTZ(new Date(), 'America/Denver').getFullYear() + 1
      var sparapaloozaDateCalculation = '01 10, ' + String(year)
    }
    if (req.headers['x-forwarded-proto'] !== 'https') {
      res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/sparapalooza_signup')
    } else {
      const classQuery = "select class_id, trim(to_char(starts_at, 'Day')) || ', ' || to_char(starts_at, 'Month') || ' ' || to_char(starts_at, 'DD') || ' at ' || to_char(starts_at, 'HH:MI PM') as class_instance, level, student_count from classes where level in (9, 9.5) and starts_at >= (CURRENT_DATE - INTERVAL '7 hour')::date and can_view = TRUE and starts_at < (to_date($1, 'MM DD, YYYY')) and can_view = TRUE order by starts_at;"
      const getNames = 'select * from signup_names(0);'
      db.any(getNames)
        .then(names => {
          db.any(classQuery, [sparapaloozaDateCalculation])
            .then(rows => {
              if (rows.length === 0) {
                res.render('temp_classes', {
                  level: 'Sparapalooza',
                  alert_message: 'There are no sparapalooza classes in the near future. Check back soon for more!'
                })
              } else {
                res.render('sparapalooza_signup', {
                  alert_message: '',
                  fname: '',
                  lname: '',
                  level: '',
                  email: '',
                  classes: rows,
                  names: names
                })
              }
            })
            .catch(err => {
              console.log('Could not render sparapalooza classes. ERROR: ' + err)
              res.render('sparapalooza_signup', {
                alert_message: 'Could not find sparapalooza classes.',
                fname: '',
                lname: '',
                level: '',
                email: '',
                classes: 'Unable to show classes.',
                names: ''
              })
            })
        })
        .catch(err => {
          console.log('Could not render sparapalooza names. ERROR: ' + err)
          res.render('sparapalooza_signup', {
            alert_message: 'Could not find sparapalooza names to display.',
            fname: '',
            lname: '',
            level: '',
            email: '',
            classes: 'Unable to show classes.',
            names: ''
          })
        })
    }
  } else {
    res.render('login', {

    })
  }
})

router.get('/bb_signup', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID) {
    var bbDateCalculation = String(convertTZ(new Date(), 'America/Denver').getMonth() + 2) + ' 10, ' + String(convertTZ(new Date(), 'America/Denver').getFullYear())

    if ((convertTZ(new Date(), 'America/Denver').getMonth() + 2) === 13) {
      const year = convertTZ(new Date(), 'America/Denver').getFullYear() + 1
      var bbDateCalculation = '01 10, ' + String(year)
    }
    if (req.headers['x-forwarded-proto'] !== 'https') {
      res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/bb_signup')
    } else {
      const classQuery = "select class_id, trim(to_char(starts_at, 'Day')) || ', ' || to_char(starts_at, 'Month') || ' ' || to_char(starts_at, 'DD') || ' at ' || to_char(starts_at, 'HH:MI PM') as class_instance, level, student_count from classes where level in (5, 5.5) and starts_at >= (CURRENT_DATE - INTERVAL '7 hour')::date and can_view = TRUE and starts_at < (to_date($1, 'MM DD, YYYY')) and can_view = TRUE order by starts_at;"
      const getNames = 'select * from signup_names(5);'
      db.any(getNames)
        .then(names => {
          db.any(classQuery, [bbDateCalculation])
            .then(rows => {
              if (rows.length === 0) {
                res.render('temp_classes', {
                  level: 'black belt',
                  alert_message: 'There are no black belt classes in the near future. Check back soon for more!'
                })
              } else {
                res.render('bb_signup', {
                  alert_message: '',
                  fname: '',
                  lname: '',
                  level: '',
                  email: '',
                  classes: rows,
                  names: names
                })
              }
            })
            .catch(err => {
              console.log('Could not render black belt classes. ERROR: ' + err)
              res.render('bb_signup', {
                alert_message: 'Could not find black belt classes.',
                fname: '',
                lname: '',
                level: '',
                email: '',
                classes: 'Unable to show classes.',
                names: ''
              })
            })
        })
        .catch(err => {
          console.log('Could not render bb names. ERROR: ' + err)
          res.render('bb_signup', {
            alert_message: 'Could not find black belt names to display.',
            fname: '',
            lname: '',
            level: '',
            email: '',
            classes: 'Unable to show classes.',
            names: ''
          })
        })
    }
  } else {
    res.render('login', {

    })
  }
})

router.get('/weapons_signup', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID) {
    var weaponsDateCalculation = String(convertTZ(new Date(), 'America/Denver').getMonth() + 2) + ' 10, ' + String(convertTZ(new Date(), 'America/Denver').getFullYear())

    if ((convertTZ(new Date(), 'America/Denver').getMonth() + 2) === 13) {
      const year = convertTZ(new Date(), 'America/Denver').getFullYear() + 1
      var weaponsDateCalculation = '01 10, ' + String(year)
    }
    if (req.headers['x-forwarded-proto'] !== 'https') {
      res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/weapons_signup')
    } else {
      const classQuery = "select class_id, trim(to_char(starts_at, 'Day')) || ', ' || to_char(starts_at, 'Month') || ' ' || to_char(starts_at, 'DD') || ' at ' || to_char(starts_at, 'HH:MI PM') as class_instance, level, student_count from classes where level in (7, 7.5) and starts_at >= (CURRENT_DATE - INTERVAL '7 hour')::date and can_view = TRUE and starts_at < (to_date($1, 'MM DD, YYYY')) and can_view = TRUE order by starts_at;"
      const getNames = 'select * from signup_names(1);'
      db.any(getNames)
        .then(names => {
          db.any(classQuery, [weaponsDateCalculation])
            .then(rows => {
              if (rows.length === 0) {
                res.render('temp_classes', {
                  level: 'weapons',
                  alert_message: 'There are no weapons classes in the near future. Check back soon for more!'
                })
              } else {
                res.render('weapons_signup', {
                  alert_message: '',
                  fname: '',
                  lname: '',
                  level: '',
                  email: '',
                  classes: rows,
                  names: names
                })
              }
            })
            .catch(err => {
              console.log('Could not render weapons classes. ERROR: ' + err)
              res.render('weapons_signup', {
                alert_message: 'Could not find weapons classes.',
                fname: '',
                lname: '',
                level: '',
                email: '',
                classes: 'Unable to show classes.',
                names: ''
              })
            })
        })
        .catch(err => {
          console.log('Could not render weapons names. ERROR: ' + err)
          res.render('weapons_signup', {
            alert_message: 'Could not find weapons names to display.',
            fname: '',
            lname: '',
            level: '',
            email: '',
            classes: 'Unable to show classes.',
            names: ''
          })
        })
    }
  } else {
    res.render('login', {

    })
  }
})

router.get('/bjj_signup', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID) {
    var bjjDateCalculation = String(convertTZ(new Date(), 'America/Denver').getMonth() + 2) + ' 10, ' + String(convertTZ(new Date(), 'America/Denver').getFullYear())

    if ((convertTZ(new Date(), 'America/Denver').getMonth() + 2) === 13) {
      const year = convertTZ(new Date(), 'America/Denver').getFullYear() + 1
      var bjjDateCalculation = '01 10, ' + String(year)
    }
    if (req.headers['x-forwarded-proto'] !== 'https') {
      res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/bjj_signup')
    } else {
      const classQuery = "select class_id, trim(to_char(starts_at, 'Day')) || ', ' || to_char(starts_at, 'Month') || ' ' || to_char(starts_at, 'DD') || ' at ' || to_char(starts_at, 'HH:MI PM') as class_instance, level, student_count from classes where level in (9, 9.5) and starts_at >= (CURRENT_DATE - INTERVAL '7 hour')::date and can_view = TRUE and starts_at < (to_date($1, 'MM DD, YYYY')) and can_view = TRUE order by starts_at;"
      const getNames = 'select * from signup_names(1);'
      db.any(getNames)
        .then(names => {
          db.any(classQuery, [bjjDateCalculation])
            .then(rows => {
              if (rows.length === 0) {
                res.render('temp_classes', {
                  level: 'bjj',
                  alert_message: 'There are no black bjj in the near future. Check back soon for more!'
                })
              } else {
                res.render('bjj_signup', {
                  alert_message: '',
                  fname: '',
                  lname: '',
                  level: '',
                  email: '',
                  classes: rows,
                  names: names
                })
              }
            })
            .catch(err => {
              console.log('Could not render bjj classes. ERROR: ' + err)
              res.render('bjj_signup', {
                alert_message: 'Could not find bjj classes.',
                fname: '',
                lname: '',
                level: '',
                email: '',
                classes: 'Unable to show classes.',
                names: ''
              })
            })
        })
        .catch(err => {
          console.log('Could not render bb names. ERROR: ' + err)
          res.render('bjj_signup', {
            alert_message: 'Could not find bjj names to display.',
            fname: '',
            lname: '',
            level: '',
            email: '',
            classes: 'Unable to show classes.',
            names: ''
          })
        })
    }
  } else {
    res.render('login', {

    })
  }
})

router.get('/conditional_signup', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID) {
    var conditionalDateCalculation = String(convertTZ(new Date(), 'America/Denver').getMonth() + 2) + ' 10, ' + String(convertTZ(new Date(), 'America/Denver').getFullYear())

    if ((convertTZ(new Date(), 'America/Denver').getMonth() + 2) === 13) {
      const year = convertTZ(new Date(), 'America/Denver').getFullYear() + 1
      var conditionalDateCalculation = '01 10, ' + String(year)
    }
    if (req.headers['x-forwarded-proto'] !== 'https') {
      res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/conditional_signup')
    } else {
      const classQuery = "select class_id, trim(to_char(starts_at, 'Day')) || ', ' || to_char(starts_at, 'Month') || ' ' || to_char(starts_at, 'DD') || ' at ' || to_char(starts_at, 'HH:MI PM') as class_instance, level, student_count from classes where level in (4, 4.5) and starts_at >= (CURRENT_DATE - INTERVAL '7 hour')::date and can_view = TRUE and starts_at < (to_date($1, 'MM DD, YYYY')) and can_view = TRUE order by starts_at;"
      const getNames = 'select * from signup_names(4);'
      db.any(getNames)
        .then(names => {
          db.any(classQuery, [conditionalDateCalculation])
            .then(rows => {
              if (rows.length === 0) {
                res.render('temp_classes', {
                  level: 'conditional',
                  alert_message: 'There are no conditional classes in the near future. Check back soon for more!'
                })
              } else {
                res.render('conditional_signup', {
                  alert_message: '',
                  fname: '',
                  lname: '',
                  level: '',
                  email: '',
                  classes: rows,
                  names: names
                })
              }
            })
            .catch(err => {
              console.log('Could not render conditional classes. ERROR: ' + err)
              res.render('conditional_signup', {
                alert_message: 'Could not find conditional classes.',
                fname: '',
                lname: '',
                level: '',
                email: '',
                classes: 'Unable to show classes.',
                names: ''
              })
            })
        })
        .catch(err => {
          console.log('Could not render conditional names. ERROR: ' + err)
          res.render('conditional_signup', {
            alert_message: 'Could not find conditional names to display.',
            fname: '',
            lname: '',
            level: '',
            email: '',
            classes: 'Unable to show classes.',
            names: ''
          })
        })
    }
  } else {
    res.render('login', {

    })
  }
})

router.get('/swat_signup', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID) {
    var swatDateCalculation = String(convertTZ(new Date(), 'America/Denver').getMonth() + 2) + ' 10, ' + String(convertTZ(new Date(), 'America/Denver').getFullYear())

    if ((convertTZ(new Date(), 'America/Denver').getMonth() + 2) === 13) {
      const year = convertTZ(new Date(), 'America/Denver').getFullYear() + 1
      var swatDateCalculation = '01 10, ' + String(year)
    }
    if (req.headers['x-forwarded-proto'] !== 'https') {
      res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/swat_signup')
    } else {
      const classQuery = "select class_id, trim(to_char(starts_at, 'Day')) || ', ' || to_char(starts_at, 'Month') || ' ' || to_char(starts_at, 'DD') || ' at ' || to_char(starts_at, 'HH:MI PM') as class_instance, level, swat_count from classes where level in (8, 7, 7.5, 0.5, 2, 2.5, 3, 3.5, 1.5, 0, 1, 1.5, -1, -1.5) and starts_at >= (CURRENT_DATE - INTERVAL '7 hour')::date and swat_count < 3 and can_view = TRUE and starts_at < (to_date($1, 'MM DD, YYYY')) and can_view = TRUE order by starts_at;"
      const getNames = 'select * from signup_names(5);'
      db.any(getNames)
        .then(names => {
          db.any(classQuery, [swatDateCalculation])
            .then(rows => {
              if (rows.length === 0) {
                res.render('temp_classes', {
                  level: 'swat',
                  alert_message: 'There are no swat classes in the near future. Check back soon for more!'
                })
              } else {
                res.render('swat_signup', {
                  alert_message: '',
                  fname: '',
                  lname: '',
                  level: '',
                  email: '',
                  classes: rows,
                  names: names
                })
              }
            })
            .catch(err => {
              console.log('Could not render swat classes. ERROR: ' + err)
              res.render('swat_signup', {
                alert_message: 'Could not find swat classes.',
                fname: '',
                lname: '',
                level: '',
                email: '',
                classes: 'Unable to show classes.',
                names: ''
              })
            })
        })
        .catch(err => {
          console.log('Could not render swat names. ERROR: ' + err)
          res.render('swat_signup', {
            alert_message: 'Could not find swat names to display.',
            fname: '',
            lname: '',
            level: '',
            email: '',
            classes: 'Unable to show classes.',
            names: ''
          })
        })
    }
  } else {
    res.render('login', {

    })
  }
})

const loginValidateClasses = [
  check('result', 'You must fill in the first student').isLength({ min: 1 }).trim().escape(), check('result2', '').trim().escape(), check('result3', '').trim().escape(), check('stud_data4', '').trim().escape(), check('day_time', 'You must select at least one class').trim().escape()
]
router.post('/dragons_signup', loginValidateClasses, (req, res) => {
  const loginErrors = validationResult(req)
  if (!loginErrors.isEmpty()) {
    res.status(422).json({ errors: loginErrors.array() })
  } else {
  const item = {
    stud_data: req.body.result,
    stud_data2: req.body.result2,
    stud_data3: req.body.result3,
    stud_data4: req.body.result4,
    day_time: req.body.day_time
  }
  if (item.stud_data === '') {
    item.stud_data = ' '
  }
  if (item.stud_data2 === '') {
    item.stud_data2 = ' '
  }
  if (item.stud_data3 === '') {
    item.stud_data3 = ' '
  }
  if (item.stud_data4 === '') {
    item.stud_data4 = ' '
  }
  const beltGroup = 'Little Dragons'
  const redirLink = 'process_classes/' + item.stud_data + '/' + item.stud_data2 + '/' + item.stud_data3 + '/' + item.stud_data4 + '/' + beltGroup + '/' + item.day_time + '/not_swat'
  res.redirect(redirLink)
  }
})

router.post('/basic_signup', loginValidateClasses, (req, res) => {
  const loginErrors = validationResult(req)
  if (!loginErrors.isEmpty()) {
    res.status(422).json({ errors: loginErrors.array() })
  } else {
  const item = {
    stud_data: req.body.result,
    stud_data2: req.body.result2,
    stud_data3: req.body.result3,
    stud_data4: req.body.result4,
    day_time: req.body.day_time
  }
  if (item.stud_data === '') {
    item.stud_data = ' '
  }
  if (item.stud_data2 === '') {
    item.stud_data2 = ' '
  }
  if (item.stud_data3 === '') {
    item.stud_data3 = ' '
  }
  if (item.stud_data4 === '') {
    item.stud_data4 = ' '
  }
  const beltGroup = 'Basic'
  const redirLink = 'process_classes/' + item.stud_data + '/' + item.stud_data2 + '/' + item.stud_data3 + '/' + item.stud_data4 + '/' + beltGroup + '/' + item.day_time + '/not_swat'
  res.redirect(redirLink)
  }
})

router.post('/weapons_signup', loginValidateClasses, (req, res) => {
  const loginErrors = validationResult(req)
  if (!loginErrors.isEmpty()) {
    res.status(422).json({ errors: loginErrors.array() })
  } else {
  const item = {
    stud_data: req.body.result,
    stud_data2: req.body.result2,
    stud_data3: req.body.result3,
    stud_data4: req.body.result4,
    day_time: req.body.day_time
  }
  if (item.stud_data === '') {
    item.stud_data = ' '
  }
  if (item.stud_data2 === '') {
    item.stud_data2 = ' '
  }
  if (item.stud_data3 === '') {
    item.stud_data3 = ' '
  }
  if (item.stud_data4 === '') {
    item.stud_data4 = ' '
  }
  const beltGroup = 'Weapons'
  const redirLink = 'process_classes/' + item.stud_data + '/' + item.stud_data2 + '/' + item.stud_data3 + '/' + item.stud_data4 + '/' + beltGroup + '/' + item.day_time + '/not_swat'
  res.redirect(redirLink)
  }
})

router.post('/bjj_signup', loginValidateClasses, (req, res) => {
  const loginErrors = validationResult(req)
  if (!loginErrors.isEmpty()) {
    res.status(422).json({ errors: loginErrors.array() })
  } else {
  const item = {
    stud_data: req.body.result,
    stud_data2: req.body.result2,
    stud_data3: req.body.result3,
    stud_data4: req.body.result4,
    day_time: req.body.day_time
  }
  if (item.stud_data === '') {
    item.stud_data = ' '
  }
  if (item.stud_data2 === '') {
    item.stud_data2 = ' '
  }
  if (item.stud_data3 === '') {
    item.stud_data3 = ' '
  }
  if (item.stud_data4 === '') {
    item.stud_data4 = ' '
  }
  const beltGroup = 'Bjj'
  const redirLink = 'process_classes/' + item.stud_data + '/' + item.stud_data2 + '/' + item.stud_data3 + '/' + item.stud_data4 + '/' + beltGroup + '/' + item.day_time + '/not_swat'
  res.redirect(redirLink)
  }
})

router.post('/conditional_signup', loginValidateClasses, (req, res) => {
  const loginErrors = validationResult(req)
  if (!loginErrors.isEmpty()) {
    res.status(422).json({ errors: loginErrors.array() })
  } else {
  const item = {
    stud_data: req.body.result,
    stud_data2: req.body.result2,
    stud_data3: req.body.result3,
    stud_data4: req.body.result4,
    day_time: req.body.day_time
  }
  if (item.stud_data === '') {
    item.stud_data = ' '
  }
  if (item.stud_data2 === '') {
    item.stud_data2 = ' '
  }
  if (item.stud_data3 === '') {
    item.stud_data3 = ' '
  }
  if (item.stud_data4 === '') {
    item.stud_data4 = ' '
  }
  const beltGroup = 'Conditional'
  const redirLink = 'process_classes/' + item.stud_data + '/' + item.stud_data2 + '/' + item.stud_data3 + '/' + item.stud_data4 + '/' + beltGroup + '/' + item.day_time + '/not_swat'
  res.redirect(redirLink)
  }
})

router.post('/level1_signup', loginValidateClasses, (req, res) => {
  const loginErrors = validationResult(req)
  if (!loginErrors.isEmpty()) {
    res.status(422).json({ errors: loginErrors.array() })
  } else {
  const item = {
    stud_data: req.body.result,
    stud_data2: req.body.result2,
    stud_data3: req.body.result3,
    stud_data4: req.body.result4,
    day_time: req.body.day_time
  }
  if (item.stud_data === '') {
    item.stud_data = ' '
  }
  if (item.stud_data2 === '') {
    item.stud_data2 = ' '
  }
  if (item.stud_data3 === '') {
    item.stud_data3 = ' '
  }
  if (item.stud_data4 === '') {
    item.stud_data4 = ' '
  }
  const beltGroup = 'Level 1'
  const redirLink = 'process_classes/' + item.stud_data + '/' + item.stud_data2 + '/' + item.stud_data3 + '/' + item.stud_data4 + '/' + beltGroup + '/' + item.day_time + '/not_swat'
  res.redirect(redirLink)
  }
})

router.post('/level2_signup', loginValidateClasses, (req, res) => {
  const loginErrors = validationResult(req)
  if (!loginErrors.isEmpty()) {
    res.status(422).json({ errors: loginErrors.array() })
  } else {
  const item = {
    stud_data: req.body.result,
    stud_data2: req.body.result2,
    stud_data3: req.body.result3,
    stud_data4: req.body.result4,
    day_time: req.body.day_time
  }
  if (item.stud_data === '') {
    item.stud_data = ' '
  }
  if (item.stud_data2 === '') {
    item.stud_data2 = ' '
  }
  if (item.stud_data3 === '') {
    item.stud_data3 = ' '
  }
  if (item.stud_data4 === '') {
    item.stud_data4 = ' '
  }
  const beltGroup = 'Level 2'
  const redirLink = 'process_classes/' + item.stud_data + '/' + item.stud_data2 + '/' + item.stud_data3 + '/' + item.stud_data4 + '/' + beltGroup + '/' + item.day_time + '/not_swat'
  res.redirect(redirLink)
  }
})

router.post('/level3_signup', loginValidateClasses, (req, res) => {
  const loginErrors = validationResult(req)
  if (!loginErrors.isEmpty()) {
    res.status(422).json({ errors: loginErrors.array() })
  } else {
  const item = {
    stud_data: req.body.result,
    stud_data2: req.body.result2,
    stud_data3: req.body.result3,
    stud_data4: req.body.result4,
    day_time: req.body.day_time
  }
  if (item.stud_data === '') {
    item.stud_data = ' '
  }
  if (item.stud_data2 === '') {
    item.stud_data2 = ' '
  }
  if (item.stud_data3 === '') {
    item.stud_data3 = ' '
  }
  if (item.stud_data4 === '') {
    item.stud_data4 = ' '
  }
  const beltGroup = 'Level 3'
  const redirLink = 'process_classes/' + item.stud_data + '/' + item.stud_data2 + '/' + item.stud_data3 + '/' + item.stud_data4 + '/' + beltGroup + '/' + item.day_time + '/not_swat'
  res.redirect(redirLink)
  }
})

router.post('/bb_signup', loginValidateClasses, (req, res) => {
  const loginErrors = validationResult(req)
  if (!loginErrors.isEmpty()) {
    res.status(422).json({ errors: loginErrors.array() })
  } else {
  const item = {
    stud_data: req.body.result,
    stud_data2: req.body.result2,
    stud_data3: req.body.result3,
    stud_data4: req.body.result4,
    day_time: req.body.day_time
  }
  if (item.stud_data === '') {
    item.stud_data = ' '
  }
  if (item.stud_data2 === '') {
    item.stud_data2 = ' '
  }
  if (item.stud_data3 === '') {
    item.stud_data3 = ' '
  }
  if (item.stud_data4 === '') {
    item.stud_data4 = ' '
  }
  const beltGroup = 'Black Belt'
  const redirLink = 'process_classes/' + item.stud_data + '/' + item.stud_data2 + '/' + item.stud_data3 + '/' + item.stud_data4 + '/' + beltGroup + '/' + item.day_time + '/not_swat'
  res.redirect(redirLink)
  }
})

router.post('/wfc_signup', loginValidateClasses, (req, res) => {
  const loginErrors = validationResult(req)
  if (!loginErrors.isEmpty()) {
    res.status(422).json({ errors: loginErrors.array() })
  } else {
  const item = {
    stud_data: req.body.result,
    stud_data2: req.body.result2,
    stud_data3: req.body.result3,
    stud_data4: req.body.result4,
    day_time: req.body.day_time
  }
  if (item.stud_data === '') {
    item.stud_data = ' '
  }
  if (item.stud_data2 === '') {
    item.stud_data2 = ' '
  }
  if (item.stud_data3 === '') {
    item.stud_data3 = ' '
  }
  if (item.stud_data4 === '') {
    item.stud_data4 = ' '
  }
  const beltGroup = 'Women\'s Fight Club'
  const redirLink = 'process_classes/' + item.stud_data + '/' + item.stud_data2 + '/' + item.stud_data3 + '/' + item.stud_data4 + '/' + beltGroup + '/' + item.day_time + '/not_swat'
  res.redirect(redirLink)
  }
})

router.post('/sparapalooza_signup', loginValidateClasses, (req, res) => {
  const loginErrors = validationResult(req)
  if (!loginErrors.isEmpty()) {
    res.status(422).json({ errors: loginErrors.array() })
  } else {
  const item = {
    stud_data: req.body.result,
    stud_data2: req.body.result2,
    stud_data3: req.body.result3,
    stud_data4: req.body.result4,
    day_time: req.body.day_time
  }
  if (item.stud_data === '') {
    item.stud_data = ' '
  }
  if (item.stud_data2 === '') {
    item.stud_data2 = ' '
  }
  if (item.stud_data3 === '') {
    item.stud_data3 = ' '
  }
  if (item.stud_data4 === '') {
    item.stud_data4 = ' '
  }
  const beltGroup = 'Sparapalooza'
  const redirLink = 'process_classes/' + item.stud_data + '/' + item.stud_data2 + '/' + item.stud_data3 + '/' + item.stud_data4 + '/' + beltGroup + '/' + item.day_time + '/not_swat'
  res.redirect(redirLink)
  }
})

router.post('/swat_signup', loginValidateClasses, (req, res) => {
  const loginErrors = validationResult(req)
  if (!loginErrors.isEmpty()) {
    res.status(422).json({ errors: loginErrors.array() })
  } else {
  const item = {
    stud_data: req.body.result,
    stud_data2: req.body.result2,
    stud_data3: req.body.result3,
    stud_data4: req.body.result4,
    day_time: req.body.day_time
  }
  if (item.stud_data === '') {
    item.stud_data = ' '
  }
  if (item.stud_data2 === '') {
    item.stud_data2 = ' '
  }
  if (item.stud_data3 === '') {
    item.stud_data3 = ' '
  }
  if (item.stud_data4 === '') {
    item.stud_data4 = ' '
  }
  const beltGroup = 'Swat'
  const redirLink = 'process_classes/' + item.stud_data + '/' + item.stud_data2 + '/' + item.stud_data3 + '/' + item.stud_data4 + '/' + beltGroup + '/' + item.day_time + '/not_swat'
  res.redirect(redirLink)
  }
})

router.get('/update_checkin/(:barcode)/(:class_id)/(:class_level)/(:class_time)/(:class_check)/(:class_type)/(:can_view)', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    const update_status = 'update class_signups set checked_in = true where class_check = $1;';
    const update_visit = "update student_list set last_visit = (select to_char(starts_at, 'Month DD, YYYY')::date as visit from classes where class_id = $1) where barcode = $2 and (last_visit < (select to_char(starts_at, 'Month DD, YYYY')::date as visit from classes where class_id = $3) or last_visit is null);"
    console.log('class_type: ' + req.params.class_type);
    if (req.params.class_type == 'reg'){
      var update_count = "update student_list set reg_class = reg_class + 1 where barcode = $1";
    } else if (req.params.class_type == 'spar'){
      var update_count = "update student_list set spar_class = spar_class + 1 where barcode = $1";
    } else {
      console.log('Unrecognized class_type');
      var update_count = 'update student_list set spar_class = spar_class where barcode = $1';
    }
    db.none(update_count, [req.params.barcode])
      .then(update => {
        db.none(update_status, [req.params.class_check])
          .then(rows => {
            db.none(update_visit, [req.params.class_id, req.params.barcode, req.params.class_id])
              .then(row => {
                res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.com/class_checkin/' + req.params.class_id + '/' + req.params.class_level + '/' + req.params.class_time + '/' + req.params.class_type + '/' + req.params.can_view);
              })
              .catch(err => {
                console.log('Could not update last_visit status of ' + req.params.class_session_id + '>  ' + err);
                res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.com/class_checkin/' + req.params.class_id + '/' + req.params.class_level + '/' + req.params.class_time + '/' + req.params.class_type + '/' + req.params.can_view);
              })
          })
          .catch(err => {
            console.log('Could not update checked_in status of ' + req.params.class_session_id);
            res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.com/class_checkin/' + req.params.class_id + '/' + req.params.class_level + '/' + req.params.class_time + '/' + req.params.class_type + '/' + req.params.can_view);
          })
      })
      .catch(err => {
        console.log('Could not update count of ' + req.params.barcode);
        res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.com/class_checkin/' + req.params.class_id + '/' + req.params.class_level + '/' + req.params.class_time + '/' + req.params.class_type + '/' + req.params.can_view);
      })
  } else {
    res.render('login', {
    })
  }
})

router.get('/process_classes/(:stud_info)/(:stud_info2)/(:stud_info3)/(:stud_info4)/(:belt_group)/(:idSet)/(:swat)', (req, res) => {
  var masterBarcode = 0
  if (req.params.swat === 'is_swat') {
    var studentInfo = []
    if (req.params.stud_info !== ' ') {
      studentInfo.push(parseStudentInfo(req.params.stud_info))
    }
    if (req.params.stud_info2 !== ' ') {
      studentInfo.push(parseStudentInfo(req.params.stud_info2))
    }
    if (req.params.stud_info3 !== ' ') {
      studentInfo.push(parseStudentInfo(req.params.stud_info3))
    }
    if (req.params.stud_info4 !== ' ') {
      studentInfo.push(parseStudentInfo(req.params.stud_info4))
    }
    const queryClasses = 'insert into class_signups (student_name, email, class_session_id, class_check, barcode, is_swat) values ($1, (select lower(email) from student_list where barcode = $2), $3, $4, $5, true) on conflict (class_check) do nothing;'
    const emailInfo = 'select email from student_list where barcode = $1;'
    var idSet = parseID(req.params.idSet)
    const swatCount = 'update classes set swat_count = swat_count + 1 where class_id = $1;'
    const bbSwatCount = 'update student_list set swat_count = swat_count + 1 where barcode = $1;'
    masterBarcode = studentInfo[0][1]
    console.log('masterBarcode = ' + String(masterBarcode))
    studentInfo.forEach(student => {
      idSet.forEach(element => {
        const tempClassCheck = student[0].toLowerCase().split(' ').join('') + element.toString()
        db.none(swatCount, [element])
          .then(row => {
            db.none(queryClasses, [student[0], student[1], element, tempClassCheck, student[1]])
              .then(rows => {
                db.none(bbSwatCount, [masterBarcode])
                  .then(swatRow => {
                    console.log('Added swat class with element ' + element + swatRow)
                  })
                  .catch(err => {
                    console.log('Err: with swat element ' + element + '. Err: ' + err)
                    console.log('Err: with student ' + student + '. Err, could not update swat count: ' + err)
                  })
              })
              .catch(err => {
                console.log('Err: with swat element ' + element + '. Err: ' + err)
                console.log('Err: with student ' + student + '. Err: ' + err)
              })
          })
          .catch(err => {
            console.log('Could not update swat_count ' + err)
          })
      })
    })
    var nameList = ''
    switch (studentInfo.length) {
      case 1:
        nameList = studentInfo[0][0]
        break
      case 2:
        nameList = studentInfo[0][0] + ', ' + studentInfo[1][0]
        break
      case 3:
        nameList = studentInfo[0][0] + ', ' + studentInfo[1][0] + ', ' + studentInfo[2][0]
        break
      case 4:
        nameList = studentInfo[0][0] + ', ' + studentInfo[1][0] + ', ' + studentInfo[2][0] + ', ' + studentInfo[3][0]
        break
      default:
        nameList = 'Error finding names'
        break
    }
    switch (idSet.length) {
      case 1:
        var endQuery = "select distinct on (class_id) to_char(starts_at, 'Month') || ' ' || to_char(starts_at, 'DD') || ' at ' || to_char(starts_at, 'HH:MI PM') as class_instance, to_char(starts_at, 'MM') as month_num, to_char(starts_at, 'DD') as day_num, to_char(starts_at, 'HH24') as hour_num, to_char(starts_at, 'MI') as min_num, to_char(ends_at, 'HH24') as end_hour, to_char(ends_at, 'MI') as end_min from classes where class_id = $1;"
        db.any(emailInfo, [studentInfo[0][1]])
          .then(email => {
            db.any(endQuery, [idSet[0]])
              .then(rows => {
                res.render('class_confirmed', {
                  classes: rows,
                  email: email,
                  student_name: nameList,
                  belt_group: req.params.belt_color,
                  class_type: 'swat',
                  num_events: 1,
                  master_barcode: masterBarcode
                })
              })
              .catch(err => {
                console.log('Err in displaying confirmed classes: ' + err)
                res.render('temp_classes', {
                  alert_message: 'Unable to submit classes for signup.',
                  level: 'none'
                })
              })
          })
          .catch(err => {
            console.log('Could not find email. Error: ' + err)
            res.render('temp_classes', {
              level: 'none',
              alert_message: 'Could not find an email associated with that student.'
            })
          })
        break
      case 2:
        var endQuery = "select distinct on (class_id) to_char(starts_at, 'Month') || ' ' || to_char(starts_at, 'DD') || ' at ' || to_char(starts_at, 'HH:MI PM') as class_instance, to_char(starts_at, 'MM') as month_num, to_char(starts_at, 'DD') as day_num, to_char(starts_at, 'HH24') as hour_num, to_char(starts_at, 'MI') as min_num, to_char(ends_at, 'HH24') as end_hour, to_char(ends_at, 'MI') as end_min from classes where class_id in ($1, $2);"
        db.any(emailInfo, [studentInfo[0][1]])
          .then(email => {
            db.any(endQuery, [idSet[0], idSet[1]])
              .then(rows => {
                res.render('class_confirmed', {
                  classes: rows,
                  email: email,
                  student_name: nameList,
                  belt_group: req.params.belt_color,
                  class_type: 'swat',
                  num_events: 2,
                  master_barcode: masterBarcode
                })
              })
              .catch(err => {
                console.log('Err in displaying confirmed classes: ' + err)
                res.render('temp_classes', {
                  alert_message: 'Unable to submit classes for signup.',
                  level: 'none'
                })
              })
          })
          .catch(err => {
            console.log('Could not find email. Error: ' + err)
            res.render('temp_classes', {
              level: 'none',
              alert_message: 'Could not find an email associated with that student.'
            })
          })
        break
      case 3:
        var endQuery = "select distinct on (class_id) to_char(starts_at, 'Month') || ' ' || to_char(starts_at, 'DD') || ' at ' || to_char(starts_at, 'HH:MI PM') as class_instance, to_char(starts_at, 'MM') as month_num, to_char(starts_at, 'DD') as day_num, to_char(starts_at, 'HH24') as hour_num, to_char(starts_at, 'MI') as min_num, to_char(ends_at, 'HH24') as end_hour, to_char(ends_at, 'MI') as end_min from classes where class_id in ($1, $2, $3);"
        db.any(emailInfo, [studentInfo[0][1]])
          .then(email => {
            db.any(endQuery, [idSet[0], idSet[1], idSet[2]])
              .then(rows => {
                res.render('class_confirmed', {
                  classes: rows,
                  email: email,
                  student_name: nameList,
                  belt_group: req.params.belt_color,
                  class_type: 'swat',
                  num_events: 3,
                  master_barcode: masterBarcode
                })
              })
              .catch(err => {
                console.log('Err in displaying confirmed classes: ' + err)
                res.render('temp_classes', {
                  alert_message: 'Unable to submit classes for signup.',
                  level: 'none'
                })
              })
          })
          .catch(err => {
            console.log('Could not find email. Error: ' + err)
            res.render('temp_classes', {
              level: 'none',
              alert_message: 'Could not find an email associated with that student.'
            })
          })
        break
      case 4:
        var endQuery = "select distinct on (class_id) to_char(starts_at, 'Month') || ' ' || to_char(starts_at, 'DD') || ' at ' || to_char(starts_at, 'HH:MI PM') as class_instance, to_char(starts_at, 'MM') as month_num, to_char(starts_at, 'DD') as day_num, to_char(starts_at, 'HH24') as hour_num, to_char(starts_at, 'MI') as min_num, to_char(ends_at, 'HH24') as end_hour, to_char(ends_at, 'MI') as end_min from classes where class_id in ($1, $2, $3, $4);"
        db.any(emailInfo, [studentInfo[0][1]])
          .then(email => {
            db.any(endQuery, [idSet[0], idSet[1], idSet[2], idSet[3]])
              .then(rows => {
                res.render('class_confirmed', {
                  classes: rows,
                  email: email,
                  student_name: nameList,
                  belt_group: req.params.belt_color,
                  class_type: 'swat',
                  num_events: 4,
                  master_barcode: masterBarcode
                })
              })
              .catch(err => {
                console.log('Err in displaying confirmed classes: ' + err)
                res.render('temp_classes', {
                  alert_message: 'Unable to submit classes for signup.',
                  level: 'none'
                })
              })
          })
          .catch(err => {
            console.log('Could not find email. Error: ' + err)
            res.render('temp_classes', {
              level: 'none',
              alert_message: 'Could not find an email associated with that student.'
            })
          })
        break
      default:
        console.log('Length of idSet not within [1,4]. idSet is ' + idSet + ' with length of ' + idSet.length)
        res.render('temp_classes', {
          alert_message: 'Class IDs not properly set. Classes NOT signed up for.',
          level: 'none'
        })
        break
    }
  } else {
    var studentInfo = []
    if (req.params.stud_info !== ' ') {
      studentInfo.push(parseStudentInfo(req.params.stud_info))
    }
    if (req.params.stud_info2 !== ' ') {
      studentInfo.push(parseStudentInfo(req.params.stud_info2))
    }
    if (req.params.stud_info3 !== ' ') {
      studentInfo.push(parseStudentInfo(req.params.stud_info3))
    }
    if (req.params.stud_info4 !== ' ') {
      studentInfo.push(parseStudentInfo(req.params.stud_info4))
    }
    const queryClasses = 'insert into class_signups (student_name, email, class_session_id, class_check, barcode) values ($1, (select lower(email) from student_list where barcode = $2), $3, $4, $5) on conflict (class_check) do nothing;'
    const emailInfo = 'select email from student_list where barcode = $1;'
    var idSet = parseID(req.params.idSet)
    masterBarcode = studentInfo[0][1]
    console.log('masterBarcode = ' + String(masterBarcode))
    const countUpdateQuery = 'update classes set student_count = student_count + 1 where class_id = $1;'
    studentInfo.forEach(student => {
      idSet.forEach(element => {
        db.none(countUpdateQuery, [element])
          .then(row => {
            const tempClassCheck = student[0].toLowerCase().split(' ').join('') + element.toString()
            db.none(queryClasses, [student[0], student[1], element, tempClassCheck, student[1]])
              .then(rows => {
                console.log('Added class with element ' + element)
                console.log('Added element for student ' + student)
              })
              .catch(err => {
                console.log('Err: with element ' + element + '. Err: ' + err)
              })
          })
          .catch(err => {
            console.log('Could not update count for class element ' + element + '. ERROR: ' + err)
          })
      })
    })
    var nameList = ''
    switch (studentInfo.length) {
      case 1:
        nameList = studentInfo[0][0]
        break
      case 2:
        nameList = studentInfo[0][0] + ', ' + studentInfo[1][0]
        break
      case 3:
        nameList = studentInfo[0][0] + ', ' + studentInfo[1][0] + ', ' + studentInfo[2][0]
        break
      case 4:
        nameList = studentInfo[0][0] + ', ' + studentInfo[1][0] + ', ' + studentInfo[2][0] + ', ' + studentInfo[3][0]
        break
      default:
        nameList = 'Error finding names'
        break
    }
    switch (idSet.length) {
      case 1:
        var endQuery = "select distinct on (class_id) to_char(starts_at, 'Month') || ' ' || to_char(starts_at, 'DD') || ' at ' || to_char(starts_at, 'HH:MI PM') as class_instance, to_char(starts_at, 'MM') as month_num, to_char(starts_at, 'DD') as day_num, to_char(starts_at, 'HH24') as hour_num, to_char(starts_at, 'MI') as min_num, to_char(ends_at, 'HH24') as end_hour, to_char(ends_at, 'MI') as end_min from classes where class_id = $1;"
        db.any(emailInfo, [studentInfo[0][1]])
          .then(email => {
            db.any(endQuery, [idSet[0]])
              .then(rows => {
                res.render('class_confirmed', {
                  classes: rows,
                  email: email,
                  student_name: nameList,
                  belt_group: req.params.belt_color,
                  class_type: 'class',
                  num_events: 1,
                  master_barcode: masterBarcode
                })
              })
              .catch(err => {
                console.log('Err in displaying confirmed classes: ' + err)
                res.render('temp_classes', {
                  alert_message: 'Unable to submit classes for signup.',
                  level: 'none'
                })
              })
          })
          .catch(err => {
            console.log('Could not find email. Error: ' + err)
            res.render('temp_classes', {
              level: 'none',
              alert_message: 'Could not find an email associated with that student.'
            })
          })
        break
      case 2:
        var endQuery = "select distinct on (class_id) to_char(starts_at, 'Month') || ' ' || to_char(starts_at, 'DD') || ' at ' || to_char(starts_at, 'HH:MI PM') as class_instance, to_char(starts_at, 'MM') as month_num, to_char(starts_at, 'DD') as day_num, to_char(starts_at, 'HH24') as hour_num, to_char(starts_at, 'MI') as min_num, to_char(ends_at, 'HH24') as end_hour, to_char(ends_at, 'MI') as end_min from classes where class_id in ($1, $2);"
        db.any(emailInfo, [studentInfo[0][1]])
          .then(email => {
            db.any(endQuery, [idSet[0], idSet[1]])
              .then(rows => {
                res.render('class_confirmed', {
                  classes: rows,
                  email: email,
                  student_name: nameList,
                  belt_group: req.params.belt_color,
                  class_type: 'class',
                  num_events: 2,
                  master_barcode: masterBarcode
                })
              })
              .catch(err => {
                console.log('Err in displaying confirmed classes: ' + err)
                res.render('temp_classes', {
                  alert_message: 'Unable to submit classes for signup.',
                  level: 'none'
                })
              })
          })
          .catch(err => {
            console.log('Could not find email. Error: ' + err)
            res.render('temp_classes', {
              level: 'none',
              alert_message: 'Could not find an email associated with that student.'
            })
          })
        break
      case 3:
        var endQuery = "select distinct on (class_id) to_char(starts_at, 'Month') || ' ' || to_char(starts_at, 'DD') || ' at ' || to_char(starts_at, 'HH:MI PM') as class_instance, to_char(starts_at, 'MM') as month_num, to_char(starts_at, 'DD') as day_num, to_char(starts_at, 'HH24') as hour_num, to_char(starts_at, 'MI') as min_num, to_char(ends_at, 'HH24') as end_hour, to_char(ends_at, 'MI') as end_min from classes where class_id in ($1, $2, $3);"
        db.any(emailInfo, [studentInfo[0][1]])
          .then(email => {
            db.any(endQuery, [idSet[0], idSet[1], idSet[2]])
              .then(rows => {
                res.render('class_confirmed', {
                  classes: rows,
                  email: email,
                  student_name: nameList,
                  belt_group: req.params.belt_color,
                  class_type: 'class',
                  num_events: 3,
                  master_barcode: masterBarcode
                })
              })
              .catch(err => {
                console.log('Err in displaying confirmed classes: ' + err)
                res.render('temp_classes', {
                  alert_message: 'Unable to submit classes for signup.',
                  level: 'none'
                })
              })
          })
          .catch(err => {
            console.log('Could not find email. Error: ' + err)
            res.render('temp_classes', {
              level: 'none',
              alert_message: 'Could not find an email associated with that student.'
            })
          })
        break
      case 4:
        var endQuery = "select distinct on (class_id) to_char(starts_at, 'Month') || ' ' || to_char(starts_at, 'DD') || ' at ' || to_char(starts_at, 'HH:MI PM') as class_instance, to_char(starts_at, 'MM') as month_num, to_char(starts_at, 'DD') as day_num, to_char(starts_at, 'HH24') as hour_num, to_char(starts_at, 'MI') as min_num, to_char(ends_at, 'HH24') as end_hour, to_char(ends_at, 'MI') as end_min from classes where class_id in ($1, $2, $3, $4);"
        db.any(emailInfo, [studentInfo[0][1]])
          .then(email => {
            db.any(endQuery, [idSet[0], idSet[1], idSet[2], idSet[3]])
              .then(rows => {
                res.render('class_confirmed', {
                  classes: rows,
                  email: email,
                  student_name: nameList,
                  belt_group: req.params.belt_color,
                  class_type: 'class',
                  num_events: 4,
                  master_barcode: masterBarcode
                })
              })
              .catch(err => {
                console.log('Err in displaying confirmed classes: ' + err)
                res.render('temp_classes', {
                  alert_message: 'Unable to submit classes for signup.',
                  level: 'none'
                })
              })
          })
          .catch(err => {
            console.log('Could not find email. Error: ' + err)
            res.render('temp_classes', {
              level: 'none',
              alert_message: 'Could not find an email associated with that student.'
            })
          })
        break
      default:
        console.log('Length of idSet not within [1,4]. idSet is ' + idSet + ' with length of ' + idSet.length)
        res.render('temp_classes', {
          alert_message: 'Class IDs not properly set. Classes NOT signed up for.',
          level: 'none'
        })
        break
    }
  }
})

router.get('/class_checkin/(:class_id)/(:class_level)/(:class_time)/(:class_type)/(:can_view)', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    console.log('req.params.class_id = ' + req.params.class_id);
    const query = "select * from get_class_names($1);";
    const checked_in = "select s.student_name, s.barcode, s.class_check, l.failed_charge, to_char(now() at time zone 'MST', 'Month DD') as curr_date, to_char(l.bday, 'Month DD') as bday from class_signups s, student_list l where s.class_session_id = $1 and s.checked_in = true and l.barcode = s.barcode;";
    const query_reserved = "select s.student_name, s.class_check, s.barcode, s.is_swat, l.failed_charge, to_char(now() at time zone 'MST', 'Month DD') as curr_date, to_char(l.bday, 'Month DD') as bday from class_signups s, student_list l where s.checked_in = false and s.class_session_id = $1 and s.barcode = l.barcode;";
    db.any(checked_in, [req.params.class_id])
      .then(checkedIn => {
        db.any(query_reserved, [req.params.class_id])
          .then(signedup => {
            db.any(query, [Number(req.params.class_id)])
              .then(names => {
                res.render('class_checkin.html', {
                  name_data: names,
                  signedup: signedup,
                  checkedIn: checkedIn,
                  level: req.params.class_level,
                  time: req.params.class_time,
                  class_id: req.params.class_id,
                  class_type: req.params.class_type,
                  can_view: req.params.can_view,
                  alert_message: ''
                })
              })
              .catch(function (err) {
                res.redirect('home')
                console.log('error finding class with id ' + err)
              })
          })
          .catch(err => {
            console.log("Could not pull people signed up for class. Err: " + err);
            res.redirect('home');
          })
      })
      .catch(err => {
        console.log('Could not find people checked in for class. Error: ' + err);
        res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/home');
      })
  } else {
    res.render('login', {
    })
  }
})

const checkinValidate = [
  check('class_id', 'Class ID must not be empty').trim().escape(), check('stud_data', 'Student Data must not be empty').trim().escape(), check('level', 'Level must not be empty').trim().escape(), check('time', 'Time must not be empty').trim().escape(), check('class_type', 'Class type must not be empty').trim().escape(), check('can_view', 'Can View must not be empty').trim().escape()
]
router.post('/class_checkin', checkinValidate, (req, res) => {
  const loginErrors = validationResult(req)
  if (!loginErrors.isEmpty()) {
    res.status(422).json({ errors: loginErrors.array() })
  } else {
    const item = {
      class_id: req.body.class_id,
      stud_data: req.body.stud_data,
      level: req.body.level,
      time: req.body.time,
      class_type: req.body.class_type,
      can_view: req.body.can_view
    }
    const update_visit = "update student_list set last_visit = (select to_char(starts_at, 'Month DD, YYYY')::date as visit from classes where class_id = $1) where barcode = $2 and (last_visit < (select to_char(starts_at, 'Month DD, YYYY')::date as visit from classes where class_id = $3) or last_visit is null);"
    if (item.class_type == 'reg'){
      var update_count = "update student_list set reg_class = reg_class + 1 where barcode = $1";
    } else if (item.class_type == 'spar'){
      var update_count = "update student_list set spar_class = spar_class + 1 where barcode = $1";
    } else {
      console.log('Unrecognized class_type');
      var update_count = 'update student_list set spar_class = spar_class where barcode = $1';
    }
    const stud_info = parseStudentInfo(item.stud_data);//name, barcode
    console.log('got ' + item.stud_data + ' as stud_data')
    console.log('stud_info: ' + stud_info);
    const temp_class_check = stud_info[0].toLowerCase().split(" ").join("") + item.class_id.toString();
    const query = 'insert into class_signups (student_name, email, class_session_id, barcode, class_check, checked_in) values ($1, (select lower(email) from student_list where barcode = $2), $3, $4, $5, true) on conflict (class_check) do nothing;'
    db.any(update_count, [stud_info[1]])
      .then(update_c => {
        db.any(update_visit, [item.class_id, stud_info[1], item.class_id])
          .then(update => {
            db.any(query, [stud_info[0], stud_info[1], item.class_id, stud_info[1], temp_class_check])
              .then(function (rows1) {
                res.redirect('class_checkin/' + item.class_id + '/' + item.level + '/' + item.time + '/' + item.class_type + '/' + item.can_view)
              })
              .catch(function (err) {
                res.redirect('home')
                console.log('Unable to checkin to class ' + err)
              })
          })
          .catch(err => {
            res.redirect('home')
            console.log('Unable to update last visit for ' + stud_info + '. Error: ' + err);
          })
      })
      .catch(err => {
        res.redirect('home');
        console.log('Unable to update count for ' + stud_info + '. Error: ' + err);
      })
    }
})

router.get('/class_confirmed/', (req, res) => {
  res.render('class_confirmed', {
    classes: '',
    email: '',
    student_name: '',
    belt_group: '',
    class_type: '',
    num_events: '',
    master_barcode: ''
  })
})

router.post('/build_ics', (req, res) => {
  const numIn = {
    num_events: req.sanitize('num_events').trim(),
    class_type: req.sanitize('class_type').trim(),
    master_barcode: req.sanitize('master_barcode').trim()
  }
  switch (Number(numIn.num_events)) {
    case 1:
      var input = {
        num_events: req.sanitize('num_events').trim(),
        email: req.sanitize('email').trim(),
        name: req.sanitize('student_name').trim(),
        month: req.sanitize('month_num').trim(),
        day: req.sanitize('day_num').trim(),
        start_hour: req.sanitize('hour_num').trim(),
        start_min: req.sanitize('min_num').trim(),
        end_hour: req.sanitize('end_hour').trim(),
        end_min: req.sanitize('end_min').trim()
      }
      break
    case 2:
      var input = {
        num_events: req.sanitize('num_events').trim(),
        email: req.sanitize('email').trim(),
        name: req.sanitize('student_name').trim(),
        month: req.sanitize('month_num').trim(),
        day: req.sanitize('day_num').trim(),
        start_hour: req.sanitize('hour_num').trim(),
        start_min: req.sanitize('min_num').trim(),
        end_hour: req.sanitize('end_hour').trim(),
        end_min: req.sanitize('end_min').trim(),
        month_1: req.sanitize('month_num_1').trim(),
        day_1: req.sanitize('day_num_1').trim(),
        hour_1: req.sanitize('hour_num_1').trim(),
        min_1: req.sanitize('min_num_1').trim(),
        end_hour_1: req.sanitize('end_hour_1').trim(),
        end_min_1: req.sanitize('end_min_1').trim()
      }
      break
    case 3:
      var input = {
        num_events: req.sanitize('num_events').trim(),
        email: req.sanitize('email').trim(),
        name: req.sanitize('student_name').trim(),
        month: req.sanitize('month_num').trim(),
        day: req.sanitize('day_num').trim(),
        start_hour: req.sanitize('hour_num').trim(),
        start_min: req.sanitize('min_num').trim(),
        end_hour: req.sanitize('end_hour').trim(),
        end_min: req.sanitize('end_min').trim(),
        month_1: req.sanitize('month_num_1').trim(),
        day_1: req.sanitize('day_num_1').trim(),
        hour_1: req.sanitize('hour_num_1').trim(),
        min_1: req.sanitize('min_num_1').trim(),
        end_hour_1: req.sanitize('end_hour_1').trim(),
        end_min_1: req.sanitize('end_min_1').trim(),
        month_2: req.sanitize('month_num_2').trim(),
        day_2: req.sanitize('day_num_2').trim(),
        hour_2: req.sanitize('hour_num_2').trim(),
        min_2: req.sanitize('min_num_2').trim(),
        end_hour_2: req.sanitize('end_hour_2').trim(),
        end_min_2: req.sanitize('end_min_2').trim()
      }
      break
    case 4:
      var input = {
        num_events: req.sanitize('num_events').trim(),
        email: req.sanitize('email').trim(),
        name: req.sanitize('student_name').trim(),
        month: req.sanitize('month_num').trim(),
        day: req.sanitize('day_num').trim(),
        start_hour: req.sanitize('hour_num').trim(),
        start_min: req.sanitize('min_num').trim(),
        end_hour: req.sanitize('end_hour').trim(),
        end_min: req.sanitize('end_min').trim(),
        month_1: req.sanitize('month_num_1').trim(),
        day_1: req.sanitize('day_num_1').trim(),
        hour_1: req.sanitize('hour_num_1').trim(),
        min_1: req.sanitize('min_num_1').trim(),
        end_hour_1: req.sanitize('end_hour_1').trim(),
        end_min_1: req.sanitize('end_min_1').trim(),
        month_2: req.sanitize('month_num_2').trim(),
        day_2: req.sanitize('day_num_2').trim(),
        hour_2: req.sanitize('hour_num_2').trim(),
        min_2: req.sanitize('min_num_2').trim(),
        end_hour_2: req.sanitize('end_hour_2').trim(),
        end_min_2: req.sanitize('end_min_2').trim(),
        month_3: req.sanitize('month_num_3').trim(),
        day_3: req.sanitize('day_num_3').trim(),
        hour_3: req.sanitize('hour_num_3').trim(),
        min_3: req.sanitize('min_num_3').trim(),
        end_hour_3: req.sanitize('end_hour_3').trim(),
        end_min_3: req.sanitize('end_min_3').trim()
      }
      break
    default:
      console.log('No num events')
      break
  }
  var alarms = []
  alarms.push({
    action: 'audio',
    trigger: { hours: 2, minutes: 30, before: true },
    repeat: 2,
    attachType: 'VALUE=URI',
    attach: 'Glass'
  })
  console.log('num events: ' + Number(numIn.num_events))
  console.log('0: ' + input.start_hour)
  console.log('1: ' + input.hour_1)
  console.log('2: ' + input.hour_2)
  const year = new Date().getFullYear()
  if (numIn.class_type === 'swat') {
    switch (Number(input.num_events)) {
      case 1:
        var { error, value } = ics.createEvents([
          {
            title: input.name + "'s Swat Class",
            start: [year, Number(input.month), Number(input.day), Number(input.start_hour), Number(input.start_min)],
            startInputType: 'local',
            startOutputType: 'local',
            end: [Number(convertTZ(new Date(), 'America/Denver').getFullYear()), Number(input.month), Number(input.day), Number(input.end_hour), Number(input.end_min)],
            endInputType: 'local',
            endOutputType: 'local',
            url: 'https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + numIn.master_barcode,
            busyStatus: 'BUSY',
            status: 'CONFIRMED',
            location: '100025 W Kentucky Dr, Lakewood, CO, 80226',
            alarms: alarms
          }
        ])
        if (error) {
          console.log('Error creating calendar events: ' + error)
        }
        var filename = input.name.replace(/\s/g, '').toLowerCase() + '.ics'
        writeFileSync(`${__dirname}/` + filename, value)
        console.log('File path is ' + `${__dirname}/` + filename)
        res.redirect('/cal_down/' + filename)
        break
      case 2:
        var { error, value } = ics.createEvents([
          {
            title: input.name + "'s Swat Class",
            start: [year, Number(input.month), Number(input.day), Number(input.start_hour), Number(input.start_min)],
            startInputType: 'local',
            startOutputType: 'local',
            end: [Number(convertTZ(new Date(), 'America/Denver').getFullYear()), Number(input.month), Number(input.day), Number(input.end_hour), Number(input.end_min)],
            endInputType: 'local',
            endOutputType: 'local',
            url: 'https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + numIn.master_barcode,
            busyStatus: 'BUSY',
            status: 'CONFIRMED',
            location: '100025 W Kentucky Dr, Lakewood, CO, 80226',
            alarms: alarms
          },
          {
            title: input.name + "'s Swat Class",
            start: [year, Number(input.month_1), Number(input.day_1), Number(input.hour_1), Number(input.min_1)],
            startInputType: 'local',
            startOutputType: 'local',
            end: [year, Number(input.month_1), Number(input.day_1), Number(input.end_hour_1), Number(input.end_min_1)],
            endInputType: 'local',
            endOutputType: 'local',
            url: 'https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + numIn.master_barcode,
            busyStatus: 'BUSY',
            status: 'CONFIRMED',
            location: '100025 W Kentucky Dr, Lakewood, CO, 80226',
            alarms: alarms
          }
        ])
        if (error) {
          console.log('Error creating calendar events: ' + error)
        }
        var filename = input.name.replace(/\s/g, '').toLowerCase() + '.ics'
        writeFileSync(`${__dirname}/` + filename, value)
        console.log('File path is ' + `${__dirname}/` + filename)
        res.redirect('/cal_down/' + filename)
        break
      case 3:
        var { error, value } = ics.createEvents([
          {
            title: input.name + "'s Swat Class",
            start: [year, Number(input.month), Number(input.day), Number(input.start_hour), Number(input.start_min)],
            startInputType: 'local',
            startOutputType: 'local',
            end: [Number(convertTZ(new Date(), 'America/Denver').getFullYear()), Number(input.month), Number(input.day), Number(input.end_hour), Number(input.end_min)],
            endInputType: 'local',
            endOutputType: 'local',
            url: 'https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + numIn.master_barcode,
            busyStatus: 'BUSY',
            status: 'CONFIRMED',
            location: '100025 W Kentucky Dr, Lakewood, CO, 80226',
            alarms: alarms
          },
          {
            title: input.name + "'s Swat Class",
            start: [year, Number(input.month_1), Number(input.day_1), Number(input.hour_1), Number(input.min_1)],
            startInputType: 'local',
            startOutputType: 'local',
            end: [year, Number(input.month_1), Number(input.day_1), Number(input.end_hour_1), Number(input.end_min_1)],
            endInputType: 'local',
            endOutputType: 'local',
            url: 'https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + numIn.master_barcode,
            busyStatus: 'BUSY',
            status: 'CONFIRMED',
            location: '100025 W Kentucky Dr, Lakewood, CO, 80226',
            alarms: alarms
          },
          {
            title: input.name + "'s Swat Class",
            start: [year, Number(input.month_2), Number(input.day_2), Number(input.hour_2), Number(input.min_2)],
            startInputType: 'local',
            startOutputType: 'local',
            end: [year, Number(input.month_2), Number(input.day_2), Number(input.end_hour_2), Number(input.end_min_2)],
            endInputType: 'local',
            endOutputType: 'local',
            url: 'https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + numIn.master_barcode,
            busyStatus: 'BUSY',
            status: 'CONFIRMED',
            location: '100025 W Kentucky Dr, Lakewood, CO, 80226',
            alarms: alarms
          }
        ])
        if (error) {
          console.log('Error creating calendar events: ' + error)
        }
        var filename = input.name.replace(/\s/g, '').toLowerCase() + '.ics'
        writeFileSync(`${__dirname}/` + filename, value)
        console.log('File path is ' + `${__dirname}/` + filename)
        res.redirect('/cal_down/' + filename)
        break
      case 4:
        var { error, value } = ics.createEvents([
          {
            title: input.name + "'s Swat Class",
            start: [year, Number(input.month), Number(input.day), Number(input.start_hour), Number(input.start_min)],
            startInputType: 'local',
            startOutputType: 'local',
            end: [Number(convertTZ(new Date(), 'America/Denver').getFullYear()), Number(input.month), Number(input.day), Number(input.end_hour), Number(input.end_min)],
            endInputType: 'local',
            endOutputType: 'local',
            url: 'https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + numIn.master_barcode,
            busyStatus: 'BUSY',
            status: 'CONFIRMED',
            location: '100025 W Kentucky Dr, Lakewood, CO, 80226',
            alarms: alarms
          },
          {
            title: input.name + "'s Swat Class",
            start: [year, Number(input.month_1), Number(input.day_1), Number(input.hour_1), Number(input.min_1)],
            startInputType: 'local',
            startOutputType: 'local',
            end: [year, Number(input.month_1), Number(input.day_1), Number(input.end_hour_1), Number(input.end_min_1)],
            endInputType: 'local',
            endOutputType: 'local',
            url: 'https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + numIn.master_barcode,
            busyStatus: 'BUSY',
            status: 'CONFIRMED',
            location: '100025 W Kentucky Dr, Lakewood, CO, 80226',
            alarms: alarms
          },
          {
            title: input.name + "'s Swat Class",
            start: [year, Number(input.month_2), Number(input.day_2), Number(input.hour_2), Number(input.min_2)],
            startInputType: 'local',
            startOutputType: 'local',
            end: [year, Number(input.month_2), Number(input.day_2), Number(input.end_hour_2), Number(input.end_min_2)],
            endInputType: 'local',
            endOutputType: 'local',
            url: 'https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + numIn.master_barcode,
            busyStatus: 'BUSY',
            status: 'CONFIRMED',
            location: '100025 W Kentucky Dr, Lakewood, CO, 80226',
            alarms: alarms
          },
          {
            title: input.name + "'s Swat Class",
            start: [year, Number(input.month_3), Number(input.day_3), Number(input.hour_3), Number(input.min_3)],
            startInputType: 'local',
            startOutputType: 'local',
            end: [year, Number(input.month_3), Number(input.day_3), Number(input.end_hour_3), Number(input.end_min_3)],
            endInputType: 'local',
            endOutputType: 'local',
            url: 'https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + numIn.master_barcode,
            busyStatus: 'BUSY',
            status: 'CONFIRMED',
            location: '100025 W Kentucky Dr, Lakewood, CO, 80226',
            alarms: alarms
          }
        ])
        if (error) {
          console.log('Error creating calendar events: ' + error)
        }
        var filename = input.name.replace(/\s/g, '').toLowerCase() + '.ics'
        writeFileSync(`${__dirname}/` + filename, value)
        console.log('File path is ' + `${__dirname}/` + filename)
        res.redirect('/cal_down/' + filename)
        break
      default:
        console.log('No data to create ics')
        res.render('temp_classes', {
          alert_message: 'Could not create a calendar event',
          level: 'calendar issue'
        })
    }
  } else {
    switch (Number(input.num_events)) {
      case 1:
        var { error, value } = ics.createEvents([
          {
            title: input.name + "'s Karate Class",
            start: [year, Number(input.month), Number(input.day), Number(input.start_hour), Number(input.start_min)],
            startInputType: 'local',
            startOutputType: 'local',
            end: [Number(convertTZ(new Date(), 'America/Denver').getFullYear()), Number(input.month), Number(input.day), Number(input.end_hour), Number(input.end_min)],
            endInputType: 'local',
            endOutputType: 'local',
            url: 'https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + numIn.master_barcode,
            busyStatus: 'BUSY',
            status: 'CONFIRMED',
            location: '100025 W Kentucky Dr, Lakewood, CO, 80226',
            alarms: alarms
          }
        ])
        if (error) {
          console.log('Error creating calendar events: ' + error)
        }
        var filename = input.name.replace(/\s/g, '').toLowerCase() + '.ics'
        writeFileSync(`${__dirname}/` + filename, value)
        console.log('File path is ' + `${__dirname}/` + filename)
        res.redirect('/cal_down/' + filename)
        break
      case 2:
        var { error, value } = ics.createEvents([
          {
            title: input.name + "'s Karate Class",
            start: [year, Number(input.month), Number(input.day), Number(input.start_hour), Number(input.start_min)],
            startInputType: 'local',
            startOutputType: 'local',
            end: [Number(convertTZ(new Date(), 'America/Denver').getFullYear()), Number(input.month), Number(input.day), Number(input.end_hour), Number(input.end_min)],
            endInputType: 'local',
            endOutputType: 'local',
            url: 'https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + numIn.master_barcode,
            busyStatus: 'BUSY',
            status: 'CONFIRMED',
            location: '100025 W Kentucky Dr, Lakewood, CO, 80226',
            alarms: alarms
          },
          {
            title: input.name + "'s Karate Class",
            start: [year, Number(input.month_1), Number(input.day_1), Number(input.hour_1), Number(input.min_1)],
            startInputType: 'local',
            startOutputType: 'local',
            end: [year, Number(input.month_1), Number(input.day_1), Number(input.end_hour_1), Number(input.end_min_1)],
            endInputType: 'local',
            endOutputType: 'local',
            url: 'https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + numIn.master_barcode,
            busyStatus: 'BUSY',
            status: 'CONFIRMED',
            location: '100025 W Kentucky Dr, Lakewood, CO, 80226',
            alarms: alarms
          }
        ])
        if (error) {
          console.log('Error creating calendar events: ' + error)
        }
        var filename = input.name.replace(/\s/g, '').toLowerCase() + '.ics'
        writeFileSync(`${__dirname}/` + filename, value)
        console.log('File path is ' + `${__dirname}/` + filename)
        res.redirect('/cal_down/' + filename)
        break
      case 3:
        var { error, value } = ics.createEvents([
          {
            title: input.name + "'s Karate Class",
            start: [year, Number(input.month), Number(input.day), Number(input.start_hour), Number(input.start_min)],
            startInputType: 'local',
            startOutputType: 'local',
            end: [Number(convertTZ(new Date(), 'America/Denver').getFullYear()), Number(input.month), Number(input.day), Number(input.end_hour), Number(input.end_min)],
            endInputType: 'local',
            endOutputType: 'local',
            url: 'https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + numIn.master_barcode,
            busyStatus: 'BUSY',
            status: 'CONFIRMED',
            location: '100025 W Kentucky Dr, Lakewood, CO, 80226',
            alarms: alarms
          },
          {
            title: input.name + "'s Karate Class",
            start: [year, Number(input.month_1), Number(input.day_1), Number(input.hour_1), Number(input.min_1)],
            startInputType: 'local',
            startOutputType: 'local',
            end: [year, Number(input.month_1), Number(input.day_1), Number(input.end_hour_1), Number(input.end_min_1)],
            endInputType: 'local',
            endOutputType: 'local',
            url: 'https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + numIn.master_barcode,
            busyStatus: 'BUSY',
            status: 'CONFIRMED',
            location: '100025 W Kentucky Dr, Lakewood, CO, 80226',
            alarms: alarms
          },
          {
            title: input.name + "'s Karate Class",
            start: [year, Number(input.month_2), Number(input.day_2), Number(input.hour_2), Number(input.min_2)],
            startInputType: 'local',
            startOutputType: 'local',
            end: [year, Number(input.month_2), Number(input.day_2), Number(input.end_hour_2), Number(input.end_min_2)],
            endInputType: 'local',
            endOutputType: 'local',
            url: 'https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + numIn.master_barcode,
            busyStatus: 'BUSY',
            status: 'CONFIRMED',
            location: '100025 W Kentucky Dr, Lakewood, CO, 80226',
            alarms: alarms
          }
        ])
        if (error) {
          console.log('Error creating calendar events: ' + error)
        }
        var filename = input.name.replace(/\s/g, '').toLowerCase() + '.ics'
        writeFileSync(`${__dirname}/` + filename, value)
        console.log('File path is ' + `${__dirname}/` + filename)
        res.redirect('/cal_down/' + filename)
        break
      case 4:
        var { error, value } = ics.createEvents([
          {
            title: input.name + "'s Karate Class",
            start: [year, Number(input.month), Number(input.day), Number(input.start_hour), Number(input.start_min)],
            startInputType: 'local',
            startOutputType: 'local',
            end: [Number(convertTZ(new Date(), 'America/Denver').getFullYear()), Number(input.month), Number(input.day), Number(input.end_hour), Number(input.end_min)],
            endInputType: 'local',
            endOutputType: 'local',
            url: 'https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + numIn.master_barcode,
            busyStatus: 'BUSY',
            status: 'CONFIRMED',
            location: '100025 W Kentucky Dr, Lakewood, CO, 80226',
            alarms: alarms
          },
          {
            title: input.name + "'s Karate Class",
            start: [year, Number(input.month_1), Number(input.day_1), Number(input.hour_1), Number(input.min_1)],
            startInputType: 'local',
            startOutputType: 'local',
            end: [year, Number(input.month_1), Number(input.day_1), Number(input.end_hour_1), Number(input.end_min_1)],
            endInputType: 'local',
            endOutputType: 'local',
            url: 'https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + numIn.master_barcode,
            busyStatus: 'BUSY',
            status: 'CONFIRMED',
            location: '100025 W Kentucky Dr, Lakewood, CO, 80226',
            alarms: alarms
          },
          {
            title: input.name + "'s Karate Class",
            start: [year, Number(input.month_2), Number(input.day_2), Number(input.hour_2), Number(input.min_2)],
            startInputType: 'local',
            startOutputType: 'local',
            end: [year, Number(input.month_2), Number(input.day_2), Number(input.end_hour_2), Number(input.end_min_2)],
            endInputType: 'local',
            endOutputType: 'local',
            url: 'https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + numIn.master_barcode,
            busyStatus: 'BUSY',
            status: 'CONFIRMED',
            location: '100025 W Kentucky Dr, Lakewood, CO, 80226',
            alarms: alarms
          },
          {
            title: input.name + "'s Karate Class",
            start: [year, Number(input.month_3), Number(input.day_3), Number(input.hour_3), Number(input.min_3)],
            startInputType: 'local',
            startOutputType: 'local',
            end: [year, Number(input.month_3), Number(input.day_3), Number(input.end_hour_3), Number(input.end_min_3)],
            endInputType: 'local',
            endOutputType: 'local',
            url: 'https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + numIn.master_barcode,
            busyStatus: 'BUSY',
            status: 'CONFIRMED',
            location: '100025 W Kentucky Dr, Lakewood, CO, 80226',
            alarms: alarms
          }
        ])
        if (error) {
          console.log('Error creating calendar events: ' + error)
        }
        var filename = input.name.replace(/\s/g, '').toLowerCase() + '.ics'
        writeFileSync(`${__dirname}/` + filename, value)
        console.log('File path is ' + `${__dirname}/` + filename)
        res.redirect('/cal_down/' + filename)
        break
      default:
        console.log('No data to create ics')
        res.render('temp_classes', {
          alert_message: 'Could not create a calendar event',
          level: 'calendar issue'
        })
    }
  }
})

app.get('/cal_down/(:filename)', function (req, res) {
  var data = readFileSync(__dirname + '/' + req.params.filename)
  res.contentType('text/calendar')
  res.send(data)
})

router.get('/student_tests', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID) {
    res.render('student_tests'), {

    }
  } else {
    res.render('login', {

    })
  }
})

router.get('/student_classes', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID) {
    res.render('student_classes'), {

    }
  } else {
    res.render('login', {

    })
  }
})

router.get('/download_done/(:url)', (req, res) => {
  fs.unlink(req.params.url, (err) => {
    if (err) {
      console.error(err)
    }
  })
  res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_classes')
})

router.get('/student_portal_login', passageAuthMiddleware, async (req, res) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal_login')
  } else {
    if (req.cookies.psg_auth_token && res.userID) {
      const portalQuery = 'select * from get_all_names()'
      db.any(portalQuery)
        .then(function (rows) {
          res.render('student_portal_login', {
            data: rows,
            alert_message: ''
          })
        })
        .catch(function (err) {
          console.log('Could not find students: ' + err)
          res.render('student_portal_login', {
            data: '',
            alert_message: 'Unable to find student. Please refresh the page and try agin.'
          })
        })
      } else {
        res.render('login', {

        })
      }
  }
})

router.get('/testing_signup_dragons', passageAuthMiddleware, async(req, res) => {
  if (req.headers['x-forwarded-proto'] != 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp/testing_signup_dragons');
  } else {
    if (req.cookies.psg_auth_token && res.userID) {
      const name_query = "select * from signup_names(-1);";
      const tests = "select TO_CHAR(test_date, 'Month') || ' ' || extract(DAY from test_date) || ' at ' || to_char(test_time, 'HH12:MI PM') as test_instance, id, notes from test_instance where level = -1 and test_date >= (CURRENT_DATE - INTERVAL '7 hour')::date;";
      db.any(name_query)
        .then(rows_names => {
          db.any(tests)
            .then(rows => {
              res.render('testing_signup_dragons', {
                names: rows_names,
                belts: '',
                tests: rows
              })
            })
            .catch(err => {
              console.log('Could not get tests. Error: ' + err);
              res.send(req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.'));
              res.redirect('/testing_signup_dragons');
            })
        })
        .catch(err => {
          console.log('Could not get names. Error: ' + err);
          req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.');
          res.redirect('/testing_signup_dragons');
        })
    } else {
      res.render('login', {

      })
    }
  }
})

router.get('/testing_signup_basic', passageAuthMiddleware, async(req, res) => {
  if (req.headers['x-forwarded-proto'] != 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp/testing_signup_basic');
  } else {
    if (req.cookies.psg_auth_token && res.userID) {
      const name_query = "select * from signup_names(0);";
      const tests = "select TO_CHAR(test_date, 'Month') || ' ' || extract(DAY from test_date) || ' at ' || to_char(test_time, 'HH12:MI PM') as test_instance, id, notes from test_instance where level = 0 and test_date >= (CURRENT_DATE - INTERVAL '7 hour')::date;";
      db.any(name_query)
        .then(rows_names => {
          db.any(tests)
            .then(rows => {
              res.render('testing_signup_basic', {
                names: rows_names,
                belts: '',
                tests: rows
              })
            })
            .catch(err => {
              console.log('Could not get tests. Error: ' + err);
              res.send(req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.'));
              res.redirect('/testing_signup_basic');
            })
        })
        .catch(err => {
          console.log('Could not get names. Error: ' + err);
          req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.');
          res.redirect('/testing_signup_basic');
        })
    } else {
      res.render('login', {

      })
    }
  }
})

router.get('/testing_signup_level1', passageAuthMiddleware, async(req, res) => {
  if (req.headers['x-forwarded-proto'] != 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp/testing_signup_level1');
  } else {
    if (req.cookies.psg_auth_token && res.userID) {
      const name_query = "select * from signup_names(0);";
      const tests = "select TO_CHAR(test_date, 'Month') || ' ' || extract(DAY from test_date) || ' at ' || to_char(test_time, 'HH12:MI PM') as test_instance, id, notes from test_instance where level = 1 and test_date >= (CURRENT_DATE - INTERVAL '7 hour')::date;";
      db.any(name_query)
        .then(rows_names => {
          db.any(tests)
            .then(rows => {
              res.render('testing_signup_level1', {
                names: rows_names,
                belts: '',
                tests: rows
              })
            })
            .catch(err => {
              console.log('Could not get tests. Error: ' + err);
              res.send(req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.'));
              res.redirect('/testing_signup_level1');
            })
        })
        .catch(err => {
          console.log('Could not get names. Error: ' + err);
          req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.');
          res.redirect('/testing_signup_level1');
        })
      } else {
        res.render('login', {

        })
      }
  }
})

router.get('/testing_signup_level2', passageAuthMiddleware, async(req, res) => {
  if (req.headers['x-forwarded-proto'] != 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp/testing_signup_level2');
  } else {
    if (req.cookies.psg_auth_token && res.userID) {
      const name_query = "select * from signup_names(0);";
      const tests = "select TO_CHAR(test_date, 'Month') || ' ' || extract(DAY from test_date) || ' at ' || to_char(test_time, 'HH12:MI PM') as test_instance, id, notes from test_instance where level = 2 and test_date >= (CURRENT_DATE - INTERVAL '7 hour')::date;";
      db.any(name_query)
        .then(rows_names => {
          db.any(tests)
            .then(rows => {
              res.render('testing_signup_level2', {
                names: rows_names,
                belts: '',
                tests: rows
              })
            })
            .catch(err => {
              console.log('Could not get tests. Error: ' + err);
              res.send(req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.'));
              res.redirect('/testing_signup_level2');
            })
        })
        .catch(err => {
          console.log('Could not get names. Error: ' + err);
          req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.');
          res.redirect('/testing_signup_level2');
        })
      } else {
        res.render('login', {

        })
      }
  }
})

router.get('/testing_signup_level3', passageAuthMiddleware, async(req, res) => {
  if (req.headers['x-forwarded-proto'] != 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp/testing_signup_level3');
  } else {
    if (req.cookies.psg_auth_token && res.userID) {
      const name_query = "select * from signup_names(0);";
      const tests = "select TO_CHAR(test_date, 'Month') || ' ' || extract(DAY from test_date) || ' at ' || to_char(test_time, 'HH12:MI PM') as test_instance, id, notes from test_instance where level = 3 and test_date >= (CURRENT_DATE - INTERVAL '7 hour')::date;";
      db.any(name_query)
        .then(rows_names => {
          db.any(tests)
            .then(rows => {
              res.render('testing_signup_level3', {
                names: rows_names,
                belts: '',
                tests: rows
              })
            })
            .catch(err => {
              console.log('Could not get tests. Error: ' + err);
              res.send(req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.'));
              res.redirect('/testing_signup_level3');
            })
        })
        .catch(err => {
          console.log('Could not get names. Error: ' + err);
          req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.');
          res.redirect('/testing_signup_level3');
        })
      } else {
        res.render('login', {

        })
      }
  }
})

router.get('/testing_signup_weapons', passageAuthMiddleware, async(req, res) => {
  if (req.headers['x-forwarded-proto'] != 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp/testing_signup_weapons');
  } else {
    if (req.cookies.psg_auth_token && res.userID) {
      const name_query = "select * from signup_names(0);";
      const tests = "select TO_CHAR(test_date, 'Month') || ' ' || extract(DAY from test_date) || ' at ' || to_char(test_time, 'HH12:MI PM') as test_instance, id, notes from test_instance where level = 7 and test_date >= (CURRENT_DATE - INTERVAL '7 hour')::date;";
      db.any(name_query)
        .then(rows_names => {
          db.any(tests)
            .then(rows => {
              res.render('testing_signup_weapons', {
                names: rows_names,
                belts: '',
                tests: rows
              })
            })
            .catch(err => {
              console.log('Could not get tests. Error: ' + err);
              res.send(req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.'));
              res.redirect('/testing_signup_weapons');
            })
        })
        .catch(err => {
          console.log('Could not get names. Error: ' + err);
          req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.');
          res.redirect('/testing_signup_weapons');
        })
      } else {
        res.render('login', {

        })
      }
  }
})

router.get('/testing_signup_blackbelt', passageAuthMiddleware, async(req, res) => {
  if (req.headers['x-forwarded-proto'] != 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp/testing_signup_blackbelt');
  } else {
    if (req.cookies.psg_auth_token && res.userID) {
      const name_query = "select * from signup_names(4);";
      const tests = "select TO_CHAR(test_date, 'Month') || ' ' || extract(DAY from test_date) || ' at ' || to_char(test_time, 'HH12:MI PM') as test_instance, id, notes, curriculum from test_instance where level = 8 and test_date >= (CURRENT_DATE - INTERVAL '7 hour')::date;";
      db.any(name_query)
        .then(rows_names => {
          db.any(tests)
            .then(rows => {
              res.render('testing_signup_blackbelt', {
                names: rows_names,
                belts: '',
                tests: rows
              })
            })
            .catch(err => {
              console.log('Could not get tests. Error: ' + err);
              res.send(req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.'));
              res.redirect('/testing_signup_blackbelt');
            })
        })
        .catch(err => {
          console.log('Could not get names. Error: ' + err);
          req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.');
          res.redirect('/testing_signup_blackbelt');
        })
      } else {
        res.render('login', {

        })
      }
  }
})

router.post('/testing_signup_dragons', (req, res) => {
  const item = {
    student_name: req.sanitize('result').trim(),
    belt_color: req.sanitize('belts').trim(),
    test_id: req.sanitize('test_selection').trim()
  };
  console.log('item.test_id: ' + item.test_id);
  const test_instance = "select TO_CHAR(test_date, 'Month') || ' ' || extract(DAY from test_date) || ' at ' || to_char(test_time, 'HH12:MI PM') as test_instance from test_instance where id = $1;";
  const data = parseStudentInfo(item.student_name); //name, barcode
  db.any(test_instance, [item.test_id])
    .then(rows => {
      res.render('testing_preview', {
        test_info: rows,
        barcode: data[1],
        test_id: item.test_id,
        student_name: data[0],
        belt_color: item.belt_color
      })
    })
    .catch(err => {
      console.log('Could not find test with given id. ERROR: ' + err);
      req.flash('error', 'Unable to verify the test you are signed up for.');
      res.redirect('/testing_signup_dragons');
    })
})

router.post('/testing_signup_basic', (req, res) => {
  const item = {
    student_name: req.sanitize('result').trim(),
    belt_color: req.sanitize('belts').trim(),
    test_id: req.sanitize('test_selection').trim()
  };
  console.log('item.test_id: ' + item.test_id);
  const test_instance = "select TO_CHAR(test_date, 'Month') || ' ' || extract(DAY from test_date) || ' at ' || to_char(test_time, 'HH12:MI PM') as test_instance from test_instance where id = $1;";
  const data = parseStudentInfo(item.student_name); //name, barcode
  db.any(test_instance, [item.test_id])
    .then(rows => {
      res.render('testing_preview', {
        test_info: rows,
        barcode: data[1],
        test_id: item.test_id,
        student_name: data[0],
        belt_color: item.belt_color
      })
    })
    .catch(err => {
      console.log('Could not find test with given id. ERROR: ' + err);
      req.flash('error', 'Unable to verify the test you are signed up for.');
      res.redirect('/testing_signup_basic');
    })
})

router.post('/testing_signup_level1', (req, res) => {
  const item = {
    student_name: req.sanitize('result').trim(),
    belt_color: req.sanitize('belts').trim(),
    test_id: req.sanitize('test_selection').trim()
  };
  console.log('item.test_id: ' + item.test_id);
  const test_instance = "select TO_CHAR(test_date, 'Month') || ' ' || extract(DAY from test_date) || ' at ' || to_char(test_time, 'HH12:MI PM') as test_instance from test_instance where id = $1;";
  const data = parseStudentInfo(item.student_name); //name, barcode
  console.log('Student data is ' + data);
  db.any(test_instance, [item.test_id])
    .then(rows => {
      res.render('testing_preview', {
        test_info: rows,
        barcode: data[1],
        test_id: item.test_id,
        student_name: data[0],
        belt_color: item.belt_color
      })
    })
    .catch(err => {
      console.log('Could not find test with given id. ERROR: ' + err);
      req.flash('error', 'Unable to verify the test you are signed up for.');
      res.redirect('/testing_signup_level1');
    })
})

router.post('/testing_signup_level2', (req, res) => {
  const item = {
    student_name: req.sanitize('result').trim(),
    belt_color: req.sanitize('belts').trim(),
    test_id: req.sanitize('test_selection').trim()
  };
  console.log('item.test_id: ' + item.test_id);
  const test_instance = "select TO_CHAR(test_date, 'Month') || ' ' || extract(DAY from test_date) || ' at ' || to_char(test_time, 'HH12:MI PM') as test_instance from test_instance where id = $1;";
  const data = parseStudentInfo(item.student_name); //name, barcode
  db.any(test_instance, [item.test_id])
    .then(rows => {
      res.render('testing_preview', {
        test_info: rows,
        barcode: data[1],
        test_id: item.test_id,
        student_name: data[0],
        belt_color: item.belt_color
      })
    })
    .catch(err => {
      console.log('Could not find test with given id. ERROR: ' + err);
      req.flash('error', 'Unable to verify the test you are signed up for.');
      res.redirect('/testing_signup_level2');
    })
})

router.post('/testing_signup_level3', (req, res) => {
  const item = {
    student_data: req.sanitize('result').trim(),
    belt_color: req.sanitize('belts').trim(),
    test_id: req.sanitize('test_selection').trim()
  };
  console.log('item.test_id: ' + item.test_id);
  const test_instance = "select TO_CHAR(test_date, 'Month') || ' ' || extract(DAY from test_date) || ' at ' || to_char(test_time, 'HH12:MI PM') as test_instance from test_instance where id = $1;";
  const data = parseStudentInfo(item.student_data); //name, barcode
  db.any(test_instance, [item.test_id])
    .then(rows => {
      res.render('testing_preview', {
        test_info: rows,
        barcode: data[1],
        test_id: item.test_id,
        student_name: data[0],
        belt_color: item.belt_color
      })
    })
    .catch(err => {
      console.log('Could not find test with given id. ERROR: ' + err);
      req.flash('error', 'Unable to verify the test you are signed up for.');
      res.redirect('/testing_signup_level3');
    })
})

router.post('/testing_signup_weapons', (req, res) => {
  const item = {
    student_name: req.sanitize('result').trim(),
    belt_color: req.sanitize('belts').trim(),
    test_id: req.sanitize('test_selection').trim()
  };
  console.log('item.test_id: ' + item.test_id);
  const test_instance = "select TO_CHAR(test_date, 'Month') || ' ' || extract(DAY from test_date) || ' at ' || to_char(test_time, 'HH12:MI PM') as test_instance from test_instance where id = $1;";
  const data = parseStudentInfo(item.student_name); //name, barcode
  db.any(test_instance, [item.test_id])
    .then(rows => {
      res.render('testing_preview', {
        test_info: rows,
        barcode: data[1],
        test_id: item.test_id,
        student_name: data[0],
        belt_color: item.belt_color
      })
    })
    .catch(err => {
      console.log('Could not find test with given id. ERROR: ' + err);
      req.flash('error', 'Unable to verify the test you are signed up for.');
      res.redirect('/testing_signup_weapons');
    })
})

router.post('/testing_signup_blackbelt', (req, res) => {
  const item = {
    student_name: req.sanitize('result').trim(),
    test_id: req.sanitize('test_selection').trim(),
    belt_color: req.sanitize('belts').trim()
  }
  const data = parseStudentInfo(item.student_name); //name, barcode
  const test_instance = "select TO_CHAR(test_date, 'Month') || ' ' || extract(DAY from test_date) || ' at ' || to_char(test_time, 'HH12:MI PM') as test_instance from test_instance where id = $1;";
  const current_belt = "select belt_color from student_list where barcode = $1;"
  db.any(test_instance, [item.test_id])
    .then(rows => {
      db.any(current_belt, [data[1]])
        .then(belt => {
          res.render('testing_preview_blackbelt', {
            test_info: rows,
            barcode: data[1],
            test_id: item.test_id,
            student_name: data[0],
            belt_color: item.belt_color,
            current_belt: belt
          })
        })
        .catch(err => {
          console.log('Could not find current belt. ERROR: ' + err);
          res.redirect('/testing_signup_blackbelt')
        })
      })
    .catch(err => {
      console.log('Could not find test with given id. ERROR: ' + err);
      res.redirect('/testing_signup_blackbelt')
    })
})

router.get('/testing_preview', (req, res) => {
  res.render('testing_preview', {
    test_info: '',
    test_id: '',
    student_name: '',
    barcode: '',
    belt_color: ''
  })
})

function belt_parser(color) {
  const regex_dragon = /Dragons/g;
  const regex_basic = /^White|^Gold/g;
  const regex_level1 = /^Orange|^High Orange|^Green|^High Green/g;
  const regex_level2 = /^Purple|^High Purple|^Blue|^High Blue/g;
  const regex_level3 = /^Red|^High Red|^Brown|^High Brown/g;
  const regex_weapons = /^Weapons/g;
  if (regex_dragon.test(color)) {
    return 'Dragons';
  } else if (regex_basic.test(color)) {
    return 'Basic';
  } else if (regex_level1.test(color)) {
    return 'Level 1';
  } else if (regex_level2.test(color)) {
    return 'Level 2';
  } else if (regex_level3.test(color)) {
    return 'Level 3';
  } else if (regex_weapons.test(color)) {
    return 'Weapons';
  } else {
    return 'Unknown';
  }
}

router.post('/test_preview_blackbelt', (req, res) => {
  const item = {
    student_name: req.sanitize('student_name').trim(),
    belt_color: req.sanitize('belt_color').trim(),
    test_id: req.sanitize('test_id').trim(),
    barcode: req.sanitize('barcode').trim(),
    button: req.sanitize('button').trim(),
    current_belt: req.sanitize('current_belt').trim()
  };
  if (item.button == 'Submit'){
    const test_instance = "select TO_CHAR(test_date, 'Month') || ' ' || extract(DAY from test_date) || ' at ' || to_char(test_time, 'HH12:MI PM') as test_instance from test_instance where id = $1;";
    db.any(test_instance, [item.test_id])
      .then(rows => {
        var belt_id = item.belt_color.replace(' ', '').toLowerCase()
        const insert_query = "insert into test_signups (student_name, test_id, belt_color, barcode, testing_for) values ($1, $2, $3, $4, $5) on conflict(session_id) do nothing;";
        db.any(insert_query, [item.student_name, item.test_id, item.current_belt, item.barcode, item.belt_color])
          .then(rows => {
            res.render('testing_confirmed_blackbelt', {
              student_name: item.student_name,
              barcode: item.barcode,
              belt_color: item.belt_color,
              test_instance: rows,
              alert_message: 'You have successfully signed up for testing!'
            })
          })
          .catch(err => {
            console.log('Could not add to test_signups. ERROR: ' + err);
            res.redirect('/student_tests')
          })
      })
  } else {
    const name_query = "select * from signup_names(4);"
    const tests = "select TO_CHAR(test_date, 'Month') || ' ' || extract(DAY from test_date) || ' at ' || to_char(test_time, 'HH12:MI PM') as test_instance, id from test_instance where level = 8 and test_date >= (CURRENT_DATE - INTERVAL '7 hour')::date;";
    db.any(name_query)
      .then(rows_names => {
        db.any(tests)
          .then(rows => {
            res.render('testing_signup_blackbelt', {
              names: rows_names,
              belts: '',
              tests: rows
            })
          })
          .catch(err => {
            console.log('Could not get tests. Error: ' + err);
            res.redirect('/testing_signup_blackbelt')
          })
      })
      .catch(err => {
        console.log('Could not get names. Error: ' + err);
        res.redirect('/testing_signup_blackbelt')
      })
  }
})

router.post('/test_preview', (req, res) => {
  const item = {
    student_name: req.sanitize('student_name').trim(),
    belt_color: req.sanitize('belt_color').trim(),
    test_id: req.sanitize('test_id').trim(),
    barcode: req.sanitize('barcode').trim(),
    button: req.sanitize('button')
  };
  if (item.button == 'Submit') {
    const test_instance = "select TO_CHAR(test_date, 'Month') || ' ' || extract(DAY from test_date) || ' at ' || to_char(test_time, 'HH12:MI PM') as test_instance from test_instance where id = $1;";
    db.any(test_instance, [item.test_id])
      .then(rows => {
        if (item.student_name == 'Matt Young') {
          res.render('testing_confirmed', {
            student_name: 'Master Young',
            barcode: item.barcode,
            belt_color: item.belt_color,
            test_instance: rows
          })
        } else {
          var belt_id = item.belt_color.replace(' ', '').toLowerCase()
          const insert_query = "insert into test_signups (student_name, test_id, belt_color, barcode) values ($1, $2, $3, $4) on conflict(session_id) do nothing;";
          const add_belt = "update belt_inventory set quantity = quantity + 1 where belt_id = $1 || (select belt_size from student_list where barcode = $2)::text"
          console.log('preview submit name: ' + item.student_name);
          console.log('preview submit barcode: ' + item.barcode);
          db.any(insert_query, [item.student_name, item.test_id, item.belt_color, item.barcode])
            .then(rows => {
              db.any(add_belt, [belt_id, item.barcode])
                .then(row => {
                  res.render('testing_confirmed', {
                    student_name: item.student_name,
                    barcode: item.barcode,
                    belt_color: item.belt_color,
                    test_instance: rows,
                    alert_message: 'You have successfully signed up for testing!'
                  })
                })
                .catch(err => {
                  console.log('Could not add belt. Err: ' + err);
                  res.redirect('/student_tests');
                })
            })
            .catch(err => {
              console.log('Could not add to test_signups. ERROR: ' + err);
              res.redirect('/student_tests');
            })
        }
      })
      .catch(err => {
        console.log('Could not confirm test. ERROR: ' + err);
        req.flash('error', 'Cound not complete signup. Please see staff member.');
        res.redirect('/student_tests');
      })
  } else {
    const name_query = "select * from signup_names($1);";
    const tests = "select TO_CHAR(test_date, 'Month') || ' ' || extract(DAY from test_date) || ' at ' || to_char(test_time, 'HH12:MI PM') as test_instance, id from test_instance where level = $1 and test_date >= (CURRENT_DATE - INTERVAL '7 hour')::date;";
    switch (belt_parser(item.belt_color)) {
      case 'Dragons':
        db.any(name_query, [-1])
          .then(rows_names => {
            db.any(tests, [-1])
              .then(rows => {
                res.render('testing_signup_dragons', {
                  names: rows_names,
                  belts: item.belt_color,
                  tests: rows
                })
              })
              .catch(err => {
                console.log('Could not get tests. Error: ' + err);
                res.send(req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.'));
                res.redirect('/testing_signup_dragons');
              })
          })
          .catch(err => {
            console.log('Could not get names. Error: ' + err);
            req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.');
            res.redirect('/testing_signup_dragons');
          })
        break;
      case 'Basic':
        db.any(name_query, [0])
          .then(rows_names => {
            db.any(tests, [0])
              .then(rows => {
                res.render('testing_signup_basic', {
                  names: rows_names,
                  belts: item.belt_color,
                  tests: rows
                })
              })
              .catch(err => {
                console.log('Could not get tests. Error: ' + err);
                res.send(req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.'));
                res.redirect('/testing_signup_basic');
              })
          })
          .catch(err => {
            console.log('Could not get names. Error: ' + err);
            req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.');
            res.redirect('/testing_signup_basic');
          })
        break;
      case 'Level 1':
        db.any(name_query, [1])
          .then(rows_names => {
            db.any(tests, [1])
              .then(rows => {
                res.render('testing_signup_level1', {
                  names: rows_names,
                  belts: item.belt_color,
                  tests: rows
                })
              })
              .catch(err => {
                console.log('Could not get tests. Error: ' + err);
                res.send(req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.'));
                res.redirect('/testing_signup_level1');
              })
          })
          .catch(err => {
            console.log('Could not get names. Error: ' + err);
            req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.');
            res.redirect('/testing_signup_level1');
          })
        break;
      case 'Level 2':
        db.any(name_query, [2])
          .then(rows_names => {
            db.any(tests, [2])
              .then(rows => {
                res.render('testing_signup_level2', {
                  names: rows_names,
                  belts: item.belt_color,
                  tests: rows
                })
              })
              .catch(err => {
                console.log('Could not get tests. Error: ' + err);
                res.send(req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.'));
                res.redirect('/testing_signup_level2');
              })
          })
          .catch(err => {
            console.log('Could not get names. Error: ' + err);
            req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.');
            res.redirect('/testing_signup_level2');
          })
        break;
      case 'Level 3':
        db.any(name_query, [3])
          .then(rows_names => {
            db.any(tests, [3])
              .then(rows => {
                res.render('testing_signup_level3', {
                  names: rows_names,
                  belts: item.belt_color,
                  tests: rows
                })
              })
              .catch(err => {
                console.log('Could not get tests. Error: ' + err);
                res.send(req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.'));
                res.redirect('/testing_signup_level3');
              })
          })
          .catch(err => {
            console.log('Could not get names. Error: ' + err);
            req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.');
            res.redirect('/testing_signup_level3');
          })
        break;
      case 'Weapons':
        db.any(name_query, [7])
          .then(rows_names => {
            db.any(tests, [7])
              .then(rows => {
                res.render('testing_signup_weapons', {
                  names: rows_names,
                  belts: item.belt_color,
                  tests: rows
                })
              })
              .catch(err => {
                console.log('Could not get tests. Error: ' + err);
                res.send(req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.'));
                res.redirect('/testing_signup_weapons');
              })
          })
          .catch(err => {
            console.log('Could not get names. Error: ' + err);
            req.flash('error', 'Signup UNSUCCESSFUL. Please see a staff member.');
            res.redirect('/testing_signup_weapons');
          })
        break;
      default:
        console.log('Unknown level for Edit');
        break;
    }
  }
})

router.get('/refresh_belts', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    const belt_query = "update belt_inventory set quantity = 0;"
    db.none(belt_query)
      .then(row => {
        res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp/belt_inventory');
      })
      .catch(err => {
        console.log('Could not refresh belts');
        res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp/belt_inventory');
      })
  } else {
    res.render('login', {
    })
  }
})

app.get('/delete_instance/(:barcode)/(:item_id)/(:id)/(:email)/(:type)', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    const dropTest = 'delete from test_signups where session_id = $1 and barcode = $2;'
    const dropClass = 'delete from class_signups where class_check = $1 and email = $2;'
    const updateClassCount = 'update classes set student_count = student_count - 1 where class_id = $1;'
    const updateCount = 'update classes set swat_count = swat_count - 1 where class_id = $1;'
    switch (req.params.type) { // allows for addition of swat class
      case 'test':
        db.none(dropTest, [req.params.id, req.params.barcode])
          .then(rows => {
            res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + req.params.barcode)
          })
          .catch(err => {
            console.log('Unable to delete test. ERR: ' + err)
            res.render('classes_email', {
              email: req.params.email,
              class_data: '',
              test_data: '',
              alert_message: 'Unable to delete test. Please refresh and try again. Otherwise, please see a staff member.'
            })
          })
        break
      case 'class':
        db.none(dropClass, [req.params.id, req.params.email.toLowerCase()])
          .then(rows => {
            db.none(updateClassCount, [req.params.item_id])
              .then(row => {
                res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + req.params.barcode)
              })
              .catch(err => {
                console.log('Could not reduce class count: ' + err)
                res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + req.params.barcode)
              })
          })
          .catch(err => {
            console.log('Unable to delete class. ERR: ' + err)
            res.render('classes_email', {
              email: req.params.email,
              class_data: '',
              test_data: '',
              alert_message: 'Unable to delete class. Please refresh and try again. Otherwise, please see a staff member.'
            })
          })
        break
      case 'swat':
        db.none(updateCount, [req.params.item_id])
          .then(row => {
            db.none(dropClass, [req.params.id, req.params.email.toLowerCase()])
              .then(rows => {
                res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + req.params.barcode)
              })
              .catch(err => {
                console.log('Unable to delete swat. ERR: ' + err)
                res.render('classes_email', {
                  email: req.params.email,
                  class_data: '',
                  test_data: '',
                  alert_message: 'Unable to delete swat. Please refresh and try again. Otherwise, please see a staff member.'
                })
              })
          })
          .catch(err => {
            console.log('Unable to update swat count. ERR: ' + err)
            res.render('classes_email', {
              email: req.params.email,
              class_data: '',
              test_data: '',
              alert_message: 'Unable to delete swat count. Please refresh and try again. Otherwise, please see a staff member.'
            })
          })
        break
      default:
        console.log('Unknown delete type.')
        res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/student_portal/' + req.params.barcode)
        break
    }
  } else {
    res.render('login', {

    })
  }
})

router.get('/need_belts', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    const belt_query = 'select first_name, last_name, barcode from student_list where belt_size = -1;';
    db.any(belt_query)
      .then(belts => {
        res.render('need_belts', {
          belts: belts
        })
      })
      .catch(err => {
        console.log('Could not retrieve belts ' + err);
        res.render('need_belts', {
          belts: ''
        })
      })
  } else {
    res.render('login', {
    })
  }
})

router.get('/belt_resolved/(:stud_name)/(:barcode)', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    res.redirect('/student_lookup');
  } else {
    res.render('login', {
    })
  }
})

router.get('/test_selector_force/(:month)/(:day)', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    console.log('logged in as ' + req.session.user);
    let temp_date = new Date();
    let year = String(temp_date.getFullYear());
    const date_conversion = req.params.month + ' ' + req.params.day;
    const test_info = "select to_char(test_date, 'Month') as test_month, to_char(test_date, 'DD') as test_day, to_char(test_time, 'HH:MI PM') as testing_time, id, level, notes from test_instance where to_char(test_date, 'Month DD') = to_char(to_date($1, 'Month DD'), 'Month DD') and to_char(test_date, 'YYYY') = to_char(to_date($2, 'YYYY'), 'YYYY');"
    db.any(test_info, [date_conversion, year])
      .then(rows => {
        res.render('test_selector', {
          data: rows
        })
      })
      .catch(err => {
        console.log('error in getting tests ' + err);
        res.redirect('home');
      })
  } else {
    res.render('login', {
    })
  }
})

router.get('/test_checkin_blackbelt/(:id)/(:level)', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    //if (req.session.user == 'Authorized'){
      const belt_counts = 'select testing_for, count(*) as "num" from test_signups where test_id = $1 group by testing_for;'
      const test_info = "select to_char(test_date, 'Month DD') as test_day, to_char(test_time, 'HH:MI PM') as testing_time, level, notes from test_instance where id = $1;"
      const student_query = "select distinct session_id, student_name, barcode, testing_for, belt_color, pass_status from test_signups where test_id = $1;";
      const pass_status = "select distinct session_id, student_name, barcode, belt_color, pass_status from test_signups where test_id = $1 and pass_status is not null;";
      const stud_names = "select * from bb_names(3);"
      db.any(pass_status, [req.params.id])
      .then(pass_status => {
        db.any(student_query, [req.params.id])
        .then(stud_rows => {
          db.any(test_info, [req.params.id])
            .then(rows => {
              db.any(stud_names, [req.params.level])
              .then(name_data => {
                db.any(belt_counts, [req.params.id])
                  .then(counts => {
                    res.render('test_checkin_blackbelt', {
                      test_info: rows,
                      name_data: name_data,
                      pass_status: pass_status,
                      stud_info: stud_rows,
                      test_id: req.params.id,
                      level: req.params.level,
                      counts: counts
                    })
                  })
                  .catch(err => {
                    console.log('Could not get belt counts. ' + err);
                    res.redirect('home');
                  })
              })
              .catch(err => {
                console.log('Could not get names for search bar. ' + err);
                res.redirect('home');
              })
            })
            .catch(err => {
              console.log('Could not get test info with id ' + req.params.id);
              res.redirect('home');
            })
        })
        .catch(err => {
          console.log('Could not find tests with id ' + req.params.id);
          res.redirect('home');
        })
      })
      .catch(err => {
        console.log('Could not get pass_status: ' + err);
        res.redirect('home');
      })
  } else {
    res.render('login', {
    })
  }
})

router.get('/test_checkin/(:id)/(:level)', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    const test_info = "select to_char(test_date, 'Month DD') as test_day, to_char(test_time, 'HH:MI PM') as testing_time, level, notes from test_instance where id = $1;";
    const student_query = "select distinct session_id, student_name, barcode, belt_color, pass_status from test_signups where test_id = $1 and pass_status is null;";
    const pass_status = "select distinct session_id, student_name, barcode, belt_color, pass_status from test_signups where test_id = $1 and pass_status is not null;";
    var stud_names = "select * from get_names($1);";
    if (req.params.level == '7') {
      var stud_names = "select * from get_all_names();";
    }
    db.any(pass_status, [req.params.id])
      .then(pass_status => {
        db.any(student_query, [req.params.id])
        .then(stud_rows => {
          db.any(test_info, [req.params.id])
            .then(rows => {
              db.any(stud_names, [req.params.level])
              .then(name_data => {
                res.render('test_checkin', {
                  test_info: rows,
                  name_data: name_data,
                  pass_status: pass_status,
                  stud_info: stud_rows,
                  test_id: req.params.id,
                  level: req.params.level
                })
              })
              .catch(err => {
                console.log('Could not get names for search bar. ' + err);
                res.redirect('home');
              })
            })
            .catch(err => {
              console.log('Could not get test info with id ' + req.params.id);
              res.redirect('home');
            })
        })
        .catch(err => {
          console.log('Could not find tests with id ' + req.params.id);
          res.redirect('home');
        })
      })
      .catch(err => {
        console.log('Could not get pass_status: ' + err);
        res.redirect('home');
      })
  } else {
    res.render('login', {
    })
  }
})

router.post('/test_checkin', (req, res) => {
  const item = {
    test_id: req.sanitize('test_id').trim(),
    stud_data: req.sanitize('result').trim(),
    level: req.sanitize('level').trim()
  }
  console.log('item.stud_data: ' + item.stud_data);
  const stud_info = parseStudentInfo(item.stud_data);//name, barcode
  console.log('stud_info: ' + stud_info);
  const insert_query = "insert into test_signups (student_name, test_id, belt_color, barcode) values ($1, $2, (select x.belt_color from student_list x where x.barcode = $3), $4) on conflict (session_id) do nothing;";
  db.any(insert_query, [stud_info[0], item.test_id, stud_info[1], stud_info[1], stud_info[1]])
    .then(rows => {
      res.redirect('test_checkin/' + item.test_id + '/' + item.level);
    })
    .catch(err => {
      res.redirect('home');
      console.log('Could not checkin to test. Error: ' + err);
    })
})

router.post('/test_checkin_blackbelt', (req, res) => {
  const item = {
    test_id: req.sanitize('test_id').trim(),
    stud_data: req.sanitize('result').trim(),
    level: req.sanitize('level').trim(),
    testing_for: req.sanitize('belts').trim()
  }
  console.log('item.stud_data: ' + item.stud_data);
  const stud_info = parseStudentInfo(item.stud_data);//name, barcode
  console.log('stud_info: ' + stud_info);
  const insert_query = "insert into test_signups (student_name, test_id, belt_color, barcode, testing_for) values ($1, $2, (select x.belt_color from student_list x where x.barcode = $3), $4, $5) on conflict (session_id) do nothing;";
  db.any(insert_query, [stud_info[0], item.test_id, stud_info[1], stud_info[1], item.testing_for])
    .then(rows => {
      res.redirect('test_checkin_blackbelt/' + item.test_id + '/' + item.level);
    })
    .catch(err => {
      res.redirect('home');
      console.log('Could not checkin to test. Error: ' + err);
    })
})

router.get('/test_remove/(:barcode)/(:test_id)', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    const remove_query = "delete from test_signups where barcode = $1 and test_id = $2;";
    db.any(remove_query, [req.params.barcode, req.params.test_id])
      .then(rows => {
        res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/test_checkin/' + req.params.test_id + '/' + req.params.barcode);
      })
      .catch(err => {
        console.log('Could not remove person from test: ' + req.params.test_id + ', ' + req.params.barcode);
        console.log('test_remove_error: ' + err);
        res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/test_selector_force');
      });
  } else {
    res.render('login', {
    })
  }
})

router.get('/test_remove_blackbelt/(:barcode)/(:test_id)', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    const remove_query = "delete from test_signups where barcode = $1 and test_id = $2;";
    db.any(remove_query, [req.params.barcode, req.params.test_id])
      .then(rows => {
        res.redirect('/test_checkin_blackbelt/' + req.params.test_id + '/' + req.params.barcode);
      })
      .catch(err => {
        console.log('Could not remove person from test: ' + req.params.test_id + ', ' + req.params.barcode);
        console.log('test_remove_error: ' + err);
        res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/test_selector_force');
      });
  } else {
    res.render('login', {
    })
  }
})

router.get('/update_test_checkin/(:barcode)/(:session_id)/(:test_id)/(:level)', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    const insert_query = "insert into student_tests (test_id, barcode) values ($1, $2) on conflict (session_id) do nothing;";
    const update_status = "update test_signups set checked_in = true where session_id = $1";
    db.any(insert_query, [req.params.test_id, req.params.barcode])
      .then(rows => {
        db.none(update_status, [req.params.session_id])
          .then(rows => {
            res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/test_checkin/' + req.params.test_id + '/' + req.params.level);
          })
          .catch(err => {
            console.log('Could not update checked_in status of ' + req.params.session_id + ': ' + err);
            res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/test_checkin/' + req.params.test_id + '/' + req.params.level);
          })
      })
      .catch(err => {
        console.log('Could not check in person with test_id, barcode ' + req.params.test_id + ', ' + req.params.barcode);
        res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/test_selector_force');
      })
  } else {
    res.render('login', {
    })
  }
})

router.get('/progress_check/(:month_val)/(:barcode)', (req, res) => {
  const student_data = "select first_name || ' ' || last_name as student_name, month_1, month_2, barcode, level_name from student_list where barcode = $1;"
  db.any(student_data, [req.params.barcode])
    .then(data => {
      res.render('progress_check', {
        student_data: data,
        month_val: req.params.month_val,
        barcode: req.params.barcode,
        alert_message: ''
      })
    })
})

router.post('/progress_check', (req, res) => {
  const student_data_pc = "select first_name || ' ' || last_name as student_name, month_1, month_2, barcode, level_name from student_list where barcode = $1;"
  var data = {
    month_val: req.sanitize('month_val').trim(),
    barcode: req.sanitize('barcode').trim(),
    month_1_val: req.sanitize('month_1_val').trim(),
    month_2_val: req.sanitize('month_2_val').trim(),
    jj: req.sanitize('jj').trim(),
    pu: req.sanitize('pu').trim(),
    ll: req.sanitize('ll').trim(),
    sp: req.sanitize('sp').trim(),
    fk: req.sanitize('fk').trim()
  }
  var score_total = Number(data.jj) + Number(data.pu) + Number(data.ll) + Number(data.fk);
  var score_total = Number(score_total);
  console.log('score_total is ' + score_total);
  console.log('month_1 data = ' + data.month_1_val);
  if (data.month_val == 'month1'){
    if (Number(data.month_1_val) > score_total){
      db.any(student_data_pc, [data.barcode])
        .then(values => {
          res.render('progress_check_results', {
            student_data: values,
            fitness_data: data,
            score_total: score_total,
            month_val: data.month_val,
            barcode: data.barcode,
            alert_message: 'Your previous month 1 score of ' + String(data.month_1_val) + ' was kept because it was ' + String(Number(data.month_1_val) - score_total) + ' points higher than your previous score.'
          })
        })
        .catch(err => {
          res.render('progress_check_results', {
            student_data: '',
            fitness_data: data,
            score_total: score_total,
            month_val: data.month_val,
            barcode: data.barcode,
            alert_message: 'Unable to fetch student data (higher previous) in month 1. ERROR: ' + err
          })
      })
    } else if (Number(data.month_1_val) == 0){
      const month_1_update = "update student_list set month_1 = $1, month_1_splits = $2 where barcode = $3;";
      db.any(month_1_update, [score_total, data.sp, data.barcode])
        .then(update => {
          db.any(student_data_pc, [data.barcode])
            .then(values => {
              res.render('progress_check_results', {
                student_data: values,
                fitness_data: data,
                score_total: score_total,
                month_val: data.month_val,
                barcode: data.barcode,
                alert_message: 'Your new month 1 score is ' + String(score_total)
              })
            })
            .catch(err => {
              res.render('progress_check_results', {
                student_data: '',
                fitness_data: data,
            score_total: score_total,
                month_val: data.month_val,
                barcode: data.barcode,
                alert_message: 'Unable to fetch student data (new higher) in month 1. ERROR: ' + err
              })
            })
          })
        .catch(err => {
          res.render('progress_check_results', {
            student_data: '',
            fitness_data: data,
            score_total: score_total,
            month_val: data.month_val,
            barcode: data.barcode,
            alert_message: 'Unable to set new score for month 1. ERROR: ' + err
          })
        })
    } else if (Number(data.month_1_val) < score_total){
      const month_1_update = "update student_list set month_1 = $1, month_1_splits = $2 where barcode = $3;";
      db.any(month_1_update, [score_total, data.sp, data.barcode])
        .then(update => {
          db.any(student_data_pc, [data.barcode])
            .then(values => {
              if (score_total - Number(data.month_1_val) == 1){
                res.render('progress_check_results', {
                  student_data: values,
                  fitness_data: data,
            score_total: score_total,
                  month_val: data.month_val,
                  barcode: data.barcode,
                  alert_message: 'Your new month 1 score of ' + String(score_total) + ' is ' + String(score_total - Number(data.month_1_val)) + ' point higher than your previous score!'
                })
              } else {
                res.render('progress_check_results', {
                  student_data: values,
                  fitness_data: data,
            score_total: score_total,
                  month_val: data.month_val,
                  barcode: data.barcode,
                  alert_message: 'Your new month 1 score of ' + String(score_total) + ' is ' + String(score_total - Number(data.month_1_val)) + ' points higher than your previous score!'
                })
              }
            })
            .catch(err => {
              res.render('progress_check_results', {
                student_data: '',
                fitness_data: data,
            score_total: score_total,
                month_val: data.month_val,
                barcode: data.barcode,
                alert_message: 'Unable to fetch student data (new higher) in month 1. ERROR: ' + err
              })
            })
          })
        .catch(err => {
          res.render('progress_check_results', {
            student_data: '',
            fitness_data: data,
            score_total: score_total,
            month_val: data.month_val,
            barcode: data.barcode,
            alert_message: 'Unable to set new score for month 1. ERROR: ' + err
          })
        })
    } else {
      db.any(student_data_pc, [data.barcode])
        .then(values => {
          res.render('progress_check_results', {
            student_data: values,
            fitness_data: data,
            score_total: score_total,
            month_val: data.month_val,
            barcode: data.barcode,
            alert_message: 'You tied with your previous month 1 score!'
          })
        })
        .catch(err => {
          res.render('progress_check_results', {
            student_data: '',
            fitness_data: data,
            score_total: score_total,
            month_val: data.month_val,
            barcode: data.barcode,
            alert_message: 'Unable to fetch student data (tie) in month 1. ERROR: ' + err
          })
      })
    }
  } else if (data.month_val == 'month2'){
    if (Number(data.month_2_val) > score_total){
      db.any(student_data_pc, [data.barcode])
        .then(values => {
          res.render('progress_check_results', {
            student_data: values,
            fitness_data: data,
            score_total: score_total,
            month_val: data.month_val,
            barcode: data.barcode,
            alert_message: 'Your previous month 2 score of ' + String(data.month_2_val) + ' was kept because it was ' + String(Number(data.month_2_val) - score_total) + ' points higher than your previous score.'
          })
        })
        .catch(err => {
          res.render('progress_check_results', {
            student_data: '',
            fitness_data: data,
            score_total: score_total,
            month_val: data.month_val,
            barcode: data.barcode,
            alert_message: 'Unable to fetch student data (higher previous) in month 2. ERROR: ' + err
          })
      })
    } else if (Number(data.month_2_val) == 0){
      const month_2_update = "update student_list set month_2 = $1, month_2_splits = $2 where barcode = $3;";
      db.any(month_2_update, [score_total, data.sp, data.barcode])
        .then(update => {
          db.any(student_data_pc, [data.barcode])
            .then(values => {
              res.render('progress_check_results', {
                student_data: values,
                fitness_data: data,
            score_total: score_total,
                month_val: data.month_val,
                barcode: data.barcode,
                alert_message: 'Your new month 2 score is ' + String(score_total)
              })
            })
            .catch(err => {
              res.render('progress_check_results', {
                student_data: '',
                fitness_data: data,
            score_total: score_total,
                month_val: data.month_val,
                barcode: data.barcode,
                alert_message: 'Unable to fetch student data (new higher) in month 2. ERROR: ' + err
              })
            })
          })
        .catch(err => {
          res.render('progress_check_results', {
            student_data: '',
            fitness_data: data,
            score_total: score_total,
            month_val: data.month_val,
            barcode: data.barcode,
            alert_message: 'Unable to set new score for month 2. ERROR: ' + err
          })
        })
    } else if (Number(data.month_2_val) < score_total){
      const month_2_update = "update student_list set month_2 = $1, month_2_splits = $2 where barcode = $3;";
      db.any(month_2_update, [score_total, data.sp, data.barcode])
        .then(update => {
          db.any(student_data_pc, [data.barcode])
            .then(values => {
              if (score_total - data.month_2_val == 1){
                res.render('progress_check_results', {
                  student_data: values,
                  fitness_data: data,
            score_total: score_total,
                  month_val: data.month_val,
                  barcode: data.barcode,
                  alert_message: 'Your new month 2 score of ' + String(score_total) + ' is ' + String(score_total - Number(data.month_2_val)) + ' point higher than your previous score!'
                })
              } else {
                res.render('progress_check_results', {
                  student_data: values,
                  fitness_data: data,
            score_total: score_total,
                  month_val: data.month_val,
                  barcode: data.barcode,
                  alert_message: 'Your new month 2 score of ' + String(score_total) + ' is ' + String(score_total - Number(data.month_2_val)) + ' points higher than your previous score!'
                })
              }
            })
            .catch(err => {
              res.render('progress_check_results', {
                student_data: '',
                fitness_data: data,
            score_total: score_total,
                month_val: data.month_val,
                barcode: data.barcode,
                alert_message: 'Unable to fetch student data (new higher) in month 2. ERROR: ' + err
              })
            })
          })
        .catch(err => {
          res.render('progress_check_results', {
            values: '',
            fitness_data: data,
            score_total: score_total,
            month_val: data.month_val,
            barcode: data.barcode,
            alert_message: 'Unable to set new score for month 2. ERROR: ' + err
          })
        })
    } else {
      db.any(student_data_pc, [data.barcode])
        .then(values => {
          res.render('progress_check_results', {
            student_data: values,
            fitness_data: data,
            score_total: score_total,
            month_val: data.month_val,
            barcode: data.barcode,
            alert_message: 'You tied with your previous month 2 score!'
          })
        })
        .catch(err => {
          res.render('progress_check_results', {
            student_data: '',
            fitness_data: data,
            score_total: score_total,
            month_val: data.month_val,
            barcode: data.barcode,
            alert_message: 'Unable to fetch student data (tie) in month 2. ERROR: ' + err
          })
      })
    }
  } else {
    db.any(student_data_pc, [data.barcode])
      .then(values => {
        res.render('progress_check_results', {
          student_data: values,
          fitness_data: data,
            score_total: score_total,
          month_val: data.month_val,
          barcode: data.barcode,
          alert_message: 'Unable to determine which progress check month to submit.'
        })
      })
      .catch(err => {
        res.render('progress_check_results', {
          student_data: '',
          fitness_data: data,
            score_total: score_total,
          month_val: data.month_val,
          barcode: data.barcode,
          alert_message: 'Unable to fetch student data in undetermined month. ERROR: ' + err
        })
      })
  }
})

router.get('/progress_check_scores', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    const pc_scores = "select first_name || ' ' || last_name as student_name, month_1, month_1_splits, month_2, month_2_splits from student_list order by last_name, first_name;";
    db.any(pc_scores)
      .then(rows => {
        res.render('progress_check_scores', {
          pc_data: rows,
          alert_message: ''
        })
      })
      .catch(err => {
        res.render('progress_check_scores', {
          pc_data: '',
          alert_message: 'Could not get scores. ERROR: ' + err
        })
      })
  } else {
    res.render('login', {
    })
  }
})

router.get('/refresh_scores', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    const reset_query = "update student_list set month_1 = 0, month_2 = 0, month_1_splits = '0:00', month_2_splits = '0:00';";
    db.none(reset_query)
    .then(row => {
      const pc_data_query = "select first_name || ' ' || last_name as student_name, month_1, month_2 from student_list order by last_name, first_name;";
      db.any(pc_data_query)
        .then(data => {
          res.render('progress_check_scores', {
            pc_data: data,
            alert_message: 'Scores have been reset!'
          })
        })
        .catch(err => {
          res.render('progress_check_scores', {
            pc_data: '',
            alert_message: 'Unable to fetch scores after reset. ERROR: ' + err
          })
        })
    })
    .catch(err => {
      res.render('progress_check_scores', {
        pc_data: '',
        alert_message: 'Error: Could not reset scores. ERROR: ' + err
      })
    })
  } else {
    res.render('login', {
    })
  }
})

router.get('/pass_test_bb/(:belt_color)/(:barcode)/(:test_id)/(:level)/(:testing_for)', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    const update_status = "update test_signups set pass_status = true where barcode = $1 and test_id = $2;";//color, level, order
    const belt_info = parseBB(req.params.testing_for, false);
    console.log('belt color was: ' + req.params.belt_color);
    console.log('belt color is ' + belt_info);
    const update_info = "update student_list set belt_color = $1, level_name = $2, belt_order = $3 where barcode = $4;";
    const regex = /\(pc\)/i;
    var rank = req.params.testing_for.replace(regex, '- Progress Check');
    const test_update_query = "insert into test_records (rank, barcode, pass_status, test_date, test_id) values ($1, $2, $3, now(), $4);"
    db.any(update_status, [req.params.barcode, req.params.test_id])
      .then(rows => {
        db.any(update_info, [belt_info[0], belt_info[1], belt_info[2], req.params.barcode])
          .then(rows => {
            db.any(test_update_query, [rank, req.params.barcode, true, String(req.params.barcode) + String(req.params.test_id)])
              .then(row => {
                console.log('Test added for BB - PASS')
                res.redirect('/test_checkin_blackbelt/' + req.params.test_id + '/' + req.params.level);
              })
              .catch(err => {
                console.log('ERROR: could not add passing test to test_record: err: ' + err);
                res.redirect('/test_checkin_blackbelt/' + req.params.test_id + '/' + req.params.level);
              })
          })
          .catch(err => {
            console.log('Could not update belt info of student ' + req.params.barcode);
            console.log('Success error: ' + err);
            res.redirect('/test_checkin_blackbelt/' + req.params.test_id + '/' + req.params.level);
          })
      })
      .catch(err => {
        console.log('Could not update test status of student ' + req.params.barcode);
        console.log('Could not update test status. Error: ' + err);
        res.redirect('home');
      })
  } else {
    res.render('login', {
    })
  }
})

router.get('/pass_test/(:belt_color)/(:barcode)/(:test_id)/(:level)', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    if (req.params.level == '7') {
      const false_update = "update test_signups set pass_status = true where barcode = $1 and test_id = $2;";
      db.one(false_update, [req.params.barcode, req.params.test_id])
        .then(row => {
          res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/test_checkin/' + req.params.test_id + '/' + req.params.level);
        })
        .catch(err => {
          console.log("Unable to fake pass student in weapons " + err);
          res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/test_checkin/' + req.params.test_id + '/' + req.params.level);
        })
    } else {
      const update_status = "update test_signups set pass_status = true where barcode = $1 and test_id = $2;";//color, level, order
      const belt_info = parseBelt(req.params.belt_color, true);
      console.log('belt color was: ' + req.params.belt_color);
      console.log('belt color is ' + belt_info);
      const update_info = "update student_list set belt_color = $1, level_name = $2, belt_order = $3 where barcode = $4;";
      db.any(update_status, [req.params.barcode, req.params.test_id])
        .then(rows => {
          db.any(update_info, [belt_info[0], belt_info[1], belt_info[2], req.params.barcode])
            .then(rows => {
              res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/test_checkin/' + req.params.test_id + '/' + req.params.level);
            })
            .catch(err => {
              console.log('Could not update belt info of student ' + req.params.barcode);
              console.log('Success error: ' + err);
              res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/test_checkin/' + req.params.test_id + '/' + req.params.level);
            })
        })
        .catch(err => {
          console.log('Could not update test status of student ' + req.params.barcode);
          console.log('Could not update test status. Error: ' + err);
          res.redirect('home');
        })
    }
  } else {
    res.render('login', {
    })
  }
})

router.get('/fail_test/(:barcode)/(:test_id)/(:level)/(:belt_color)', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    const update_status = "update test_signups set pass_status = false where barcode = $1 and test_id = $2;";
    const make_up_test = "insert into test_signups (student_name, test_id, belt_color, barcode) values ((select first_name || ' ' || last_name from student_list where barcode = $2), (select id from test_instance where level = $3 and test_date >= now() and notes = 'Make Up Testing' limit 1), $1, $2);"
    db.any(update_status, [req.params.barcode, req.params.test_id])
      .then(rows => {
        db.any(make_up_test, [req.params.belt_color, req.params.barcode, req.params.level])
          .then(rows => {
            res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/test_checkin/' + req.params.test_id + '/' + req.params.level);
          })
          .catch(err => {
            console.log("Could not sign up for make up testing. ERR: " + err);
            res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/test_checkin/' + req.params.test_id + '/' + req.params.level);
          })
      })
      .catch(err => {
        console.log("Could not update test status of student " + req.params.barcode);
        res.redirect('home');
      })
  } else {
    res.render('login', {
    })
  }
})

router.get('/fail_test_blackbelt/(:barcode)/(:test_id)/(:level)', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    const update_status = "update test_signups set pass_status = false where barcode = $1 and test_id = $2;";
    const regex_fail = /\(pc\)/i;
    var rank_fail = req.params.level.replace(regex_fail, '- Progress Check');
    const test_update_query_fail = "insert into test_records (rank, barcode, pass_status, test_date, test_id) values ($1, $2, $3, now(), $4);"
    db.any(update_status, [req.params.barcode, req.params.test_id])
      .then(rows => {
        db.any(test_update_query_fail, [rank_fail, req.params.barcode, false, String(req.params.barcode) + String(req.params.test_id)])
          .then(row => {
            console.log('Test added for BB - FAIL');
            res.redirect('/test_checkin_blackbelt/' + req.params.test_id + '/' + req.params.level);
          })
          .catch(err => {
            console.log('ERROR: could not add failing test to test_record: err: ' + err);
            res.redirect('/test_checkin_blackbelt/' + req.params.test_id + '/' + req.params.level);
          })
      })
      .catch(err => {
        console.log("Could not update test status of student " + req.params.barcode);
        res.redirect('home');
      })
  } else {
    res.render('login', {
    })
  }
})

router.get('/class_selector', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    const query = "select x.class_id, (select count(class_session_id) from class_signups where class_session_id = x.class_id and checked_in = FALSE) as signed_up, (select count(class_session_id) from class_signups where class_session_id = x.class_id and checked_in = TRUE) as checked_in, to_char(x.starts_at, 'Month') as class_month, to_char(x.starts_at, 'DD') as class_day, to_char(x.starts_at, 'HH:MI PM') as class_time, to_char(x.ends_at, 'HH:MI PM') as end_time, x.level, x.class_type from classes x where to_char(x.starts_at, 'Month DD YYYY') = to_char(to_date($1, 'Month DD YYYY'), 'Month DD YYYY') order by x.starts_at;"
    var d = new Date();
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const date_conversion = month + ' ' + day + d.getFullYear();
    console.log("Date is " + date_conversion);
    db.any(query, [date_conversion])
      .then(function (rows) {
        res.render('class_selector', {
          data: rows
        })
      })
      .catch(function (err) {
        console.log('error in getting classes ' + err)
        res.redirect('home')
      })
  } else {
    res.render('login', {
    })
  }
})

router.get('/class_selector_force/(:month)/(:day)', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    const currentYear = new Date().getFullYear();
    const date_conversion = req.params.month + ' ' + req.params.day + ' ' + currentYear
    const query = "select x.class_id, (select count(class_session_id) from class_signups where class_session_id = x.class_id and checked_in = FALSE) as signed_up, (select count(class_session_id) from class_signups where class_session_id = x.class_id and checked_in = TRUE) as checked_in, to_char(x.starts_at, 'Month') as class_month, to_char(x.starts_at, 'DD') as class_day, to_char(x.starts_at, 'HH:MI PM') as class_time, to_char(x.ends_at, 'HH:MI PM') as end_time, x.level, x.class_type, x.can_view from classes x where to_char(x.starts_at, 'Month DD YYYY') = to_char(to_date($1, 'Month DD YYYY'), 'Month DD YYYY') order by x.starts_at;"
    db.any(query, [date_conversion])
      .then(function (rows) {
        res.render('class_selector', {
          data: rows
        })
      })
      .catch(function (err) {
        console.log('error in getting classes ' + err)
        res.redirect('home')
      })
  } else {
    res.render('login', {
    })
  }
})

router.get('/class_lookup', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    var event = new Date();
    var options_1 = { 
      month: 'long',
      timeZone: 'America/Denver'
    };
    var options_2 = { 
      day: 'numeric',
      timeZone: 'America/Denver'
    };
    const month = event.toLocaleDateString('en-US', options_1);
    const day = event.toLocaleDateString('en-US', options_2);
    res.render('class_lookup', {
      month: month,
      day: day
    })
  } else {
    res.render('login', {
    })
  }
})

const dateValidate = [
  check('month_select', 'Month must not be empty').trim().escape().isLength({ min: 1 }), check('day_select', 'Day must not be empty').trim().escape().isLength({ min: 1 })
]
router.post('/class_lookup', dateValidate, (req, res) => {
  const dateErrors = validationResult(req)
  if (!dateErrors.isEmpty()) {
    res.status(422).json({ errors: dateErrors.array() })
  } else {
    const item = {
      month: req.body.month_select,
      day: req.body.day_select
    }
    const redir_link = 'class_selector_force/' + item.month + '/' + item.day
    res.redirect(redir_link)
  }
})

router.get('/belt_resolved/(:stud_name)/(:barcode)', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    res.redirect('/student_lookup');
  } else {
    res.render('login', {
    })
  }
})

router.get('/refresh_memberships', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    res.render('refresh_memberships', {   
    })
  } else {
    res.render('login', {
    })
  }
})

router.get('/student_lookup', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    const name_query = "select * from get_all_names()"
    db.any(name_query)
      .then(function (rows) {
        res.render('student_lookup', {
          data: rows,
          alert_message: ''
        })
      })
      .catch(function (err) {
        console.log('Could not find students: ' + err)
        res.render('student_lookup', {
          data: '',
          alert_message: 'Unable to find student. Please refresh the page and try agin.'
        })
      })
  } else {
    res.render('login', {
    })
  }
})

router.get('/lookup_message/(:alert_message)', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    const name_query = "select * from get_all_names()"
    db.any(name_query)
      .then(function (rows) {
        res.render('student_lookup', {
          data: rows,
          alert_message: req.params.alert_message
        })
      })
      .catch(function (err) {
        console.log('Could not find students: ' + err)
        res.render('student_lookup', {
          data: '',
          alert_message: 'Unable to find student. Please refresh the page and try agin.'
        })
      })
  } else {
    res.render('login', {
    })
  }
})

router.get('/student_data', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    res.render('student_data', {
      data: '',
      name: '',
      barcode: '',
      addr: '',
      addr_2: '',
      city: '',
      zip: -1,
      bday: ''
    })
  } else {
    res.render('login', {
    })
  }
})

router.get('/json_data', (req, res) => {
  let options = {
    method: "GET",
    uri: settings.apiv4url + '/payment',
    headers: {
      Authorization: getAuthHeader(),
    },
    json: true,
  }
  request(options, function(error, response, body) {
    res.render('json_data', {
      data: JSON.stringify(body, null, 2),
      data2: JSON.stringify(body.Response, null, 2)
    })
  })
})

router.get('/student_data_loading/(:name)/(:barcode)', passageAuthMiddleware, async(req, res) => {
  let userID = res.userID
  if (req.cookies.psg_auth_token && userID && staffArray.includes(res.userID)) {
    var name = req.params.name;
    var barcode = req.params.barcode;
    let options4 = {
      method: "GET",
      uri: settings.apiv4url + '/customer/' + barcode + '/payments?sortby=id&direction=desc',
      headers: {
        Authorization: getAuthHeader(),
      },
      json: true
    };
    request(options4, function(error, response, body) {
      if (!error && response && response.statusCode < 300) {
        console.log(body.Response);
      }
      return;
    })
    const studentInfoQuery = "select barcode, first_name, last_name, email, belt_size, belt_color, to_char(last_visit, 'Month DD, YYYY') as last_visit, to_char(join_date, 'Month DD, YYYY') as join_date, reg_class, spar_class, swat_count, addr, addr_2, zip, city, to_char(bday::date, 'MM-DD-YYYY') as bday from student_list where barcode = $1 and first_name || ' ' || last_name = $2;";
    let options = {
      method: "GET",
      uri: settings.apiv4url + '/customer/' + barcode + '/payments',
      headers: {
          Authorization: getAuthHeader(),
      },
      json: true,
  };
    db.any(studentInfoQuery, [barcode, name])
      .then(rows => {
        console.log('In .then for /student_lookup')
        request(options, function(error, response, body) {
          if (!error && response && response.statusCode < 300) {
            //res.status((response && response.statusCode) || 500).send(error);
            res.render('student_data', {
              data: rows,
              name: name,
              barcode: barcode,
              stud_data: body.Response
            })
          } else {
            //res.status((response && response.statusCode) || 500).send(error);
            res.render('student_data_no_billing', {
              data: rows,
              name: name,
              barcode: barcode,
              stud_data: ''
            })
          }
        });
      })
      .catch(err => {
        res.render('student_lookup', {
          data: '',
          alert_message: "Error: Could not retrieve student info for " + name + ". Please refresh the page and try again. Error: " + err
        })
      })
  } else {
    res.render('login', {
    })
  }
})

router.post('/count_update', (req, res) => {
  var items = {
    barcode: req.sanitize('barcode').trim(),
    reg_class: req.sanitize('reg_class').trim(),
    spar_class: req.sanitize('spar_class').trim(),
    swat_class: req.sanitize('swat_class').trim() 
  }
  const count_update = 'update student_list set reg_class = $1, spar_class = $2, swat_count = $3 where barcode = $4';
  db.any(count_update, [items.reg_class, items.spar_class, items.swat_class, items.barcode])
    .then(rows => {
      const name_query = "select * from get_all_names()"
      db.any(name_query)
        .then(names => {
          res.render('student_lookup', {
            data: names,
            alert_message: "Student has been updated with \nregular classes = " + items.reg_class + "\nsparring classes = " + items.spar_class + "\nswat classes = " + items.swat_class
          })
        })
        .catch(err => {
          console.log('Could not find students: ' + err)
          res.render('student_lookup', {
            data: '',
            alert_message: 'Could not find any students. Please refresh the page and try again.'
          })
        })
    })
    .catch(err => {
      console.log('Could not update student counts');
      res.render('student_lookup', {
        data: '',
        alert_message: 'Could not update the counts. Please refresh page and try again.'
      })
    })
})

router.post('/student_data', (req, res) => {
  var items = {
    barcode: req.sanitize('barcode').trim(),
    first_name: req.sanitize('first_name').trim(),
    last_name:  req.sanitize('last_name').trim(),
    email: req.sanitize('email').trim(),
    belt_size: req.sanitize('beltSize').trim(),
    belt_color: req.sanitize('beltColor').trim(),
    addr: req.sanitize('addr').trim(),
    addr_2: req.sanitize('addr_2').trim(),
    city: req.sanitize('city').trim(),
    zip: req.sanitize('zip').trim(),
    bday: req.sanitize('bday').trim()
  }
  console.log('parseBelt input = ' + items.belt_color);
  var level_info = parseBelt(items.belt_color, false);
  console.log('level_info: ' + level_info);
  console.log('Bday is ' + items.bday)
  const update_query = "update student_list set first_name = $1, last_name = $2, belt_color = $3, belt_size = $4, email = $5, level_name = $6, belt_order = $7, addr = $8, addr_2 = $9, city = $10, zip = $11, bday = to_date($12, 'MM-DD-YYYY') where barcode = $13;";
  db.none(update_query, [items.first_name, items.last_name, level_info[0], Number(items.belt_size), items.email, level_info[1], level_info[2], items.addr, items.addr_2, items.city, Number(items.zip), items.bday, items.barcode])
    .then(rows_update => {
      const name_query = "select * from get_all_names()"
      if (items.addr_2 == ''){
        items.addr_2 = null
      }
      if (items.addr == ''){
        items.addr = 'None'
      }
      if (items.city == ''){
        items.city = 'None'
      }
      if (items.zip == ''){
        items.zip = -1
      }
      if (items.bday == ''){
        items.bday = '1930-01-01'
      }
      if (items.belt_size == ''){
        items.belt_size = -1
      }
      console.log('items: ' + JSON.safeStringify(items));
      var bday_string = "Birthday is " + items.bday;
      console.log('Bday is ' + items.bday)
      db.any(name_query)
        .then(function (rows) {
          let options = {
            method: "PUT",
            uri: settings.apiv4url + '/customer',
            headers: {
                Authorization: getAuthHeader(),
            },
            body: {
            "Id": items.barcode,
            "FirstName": items.first_name,
            "LastName": items.last_name,
            "ShippingSameAsBilling": true,
            "BillingAddress": {
              "StreetAddress1": items.addr,
              "StreetAddress2": items.addr_2,
              "City": items.city,
              "ZipCode": items.zip,
              "StateCode": 'CO'
            },
            "Notes": bday_string
            },
            json: true,
          };
          request(options, function(error, response, body) {
            if (!error && response && response.statusCode < 300) {
              var temp_message = 'Successfully updated ' + items.first_name + ' ' + items.last_name + ' in EMA Side Kick and on PaySimple!';
              res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/lookup_message/' + temp_message);
              return;
            }
            if (error){
              console.log('Customer put API error: ' + error);
            }
            var temp_message = 'Successfully updated ' + items.first_name + ' ' + items.last_name + ' in EMA Side Kick and on PaySimple!';
            res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/lookup_message/' + temp_message);
            //res.status((response && response.statusCode) || 500).send(error);
        
          });
        })
        .catch(function (err) {
          console.log('Could not find students: ' + err)
          res.render('student_lookup', {
            data: '',
            alert_message: 'Could not find any students. Please refresh the page and try again.'
          })
        })
    })
    .catch(err => {
      console.log('Could not update student: ' + err)
      res.render('student_lookup', {
        data: '',
        alert_message: 'Could not update the student ' + items.first_name + ' ' + items.last_name + '. Please make a note of this and contact the admin.'
      })
    })
})

router.get('/test_lookup', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    var event = new Date();
    var options_1 = { 
      month: 'long',
      timeZone: 'America/Denver'
    };
    var options_2 = { 
      day: 'numeric',
      timeZone: 'America/Denver'
    };
    const month = event.toLocaleDateString('en-US', options_1);
    const day = event.toLocaleDateString('en-US', options_2);
    res.render('test_lookup', {
      month: month,
      day: day
    })
  } else {
    res.render('login', {
      username: '',
      password: '',
      go_to: '/test_lookup',
      alert_message: ''
    })
  }
})

router.post('/test_lookup', (req, res) => {
  const item = {
    month: req.sanitize('month_select').trim(),
    day: req.sanitize('day_select').trim()
  }
  const redir_link = 'test_selector_force/' + item.month + '/' + item.day;
  res.redirect(redir_link);
})


router.get('/create_test', passageAuthMiddleware, async(req, res) => {
  let userID = res.userID
  if (req.cookies.psg_auth_token && userID && staffArray.includes(res.userID)) {
    const testQueryAll = "select id, level, to_char(test_date, 'Mon DD, YYYY') || ' - ' || to_char(test_time, 'HH:MI PM') as test_day, notes, curriculum from test_instance where test_date > CURRENT_DATE - INTERVAL '1 months' AND test_date < CURRENT_DATE + INTERVAL '2 months' order by test_date, test_time;"
    db.any(testQueryAll)
      .then(tests => {
        res.render('create_test', {
          alert_message: '',
          test_data: tests
        })
      })
      .catch(err => {
        res.render('create_test', {
          alert_message: 'Could not gather any test info. ' + err,
          test_data: ''
        })
      })
  } else {
    res.render('login', {
    })
  }
})

router.get('/delete_test/(:id)/(:level)', (req, res) => {
  var test_delete = "delete from test_instance where id = $1 and level = $2;"
  var signup_delete = "delete from test_signups where test_id = $1;"
  db.any(test_delete, [req.params.id, req.params.level])
    .then(test => {
      db.any(signup_delete, [req.params.test_id])
        .then(tests => {
          res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/create_test')
        })
        .catch(err => {
          console.log('Could not delete any test_signups. ERR: ' + err)
          res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/create_test')
        })
    })
    .catch(error => {
      console.log('Could not delete test_instance with id: ' + req.params.id + '. ERROR: ' + error)
      res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/create_test')
    })
})

router.post('/create_test', (req, res) => {
  const item = {
    level: req.sanitize('level_select').trim(),
    month: req.sanitize('month_select').trim(),
    day: req.sanitize('day_select').trim(),
    time: req.sanitize('time_select').trim(),
    curr: req.sanitize('curriculum_select').trim()
  }
  var notes = ''
  switch (item.level) {
    case '0.1':
      item.level = '0'
      notes = 'White Belts'
      break;
    case '0.2':
      item.level = '0'
      notes = 'Gold Belts'
      break;
    case '1.1':
      item.level = '1'
      notes = 'Orange and High Orange Belts'
      break;
    case '1.2':
      item.level = '1'
      notes = 'Green and High Green Belts'
      break;
    case '2.1':
      item.level = '2'
      notes = 'Purple and High Purple Belts'
      break;
    case '2.2':
      item.level = '2'
      notes = 'Blue and High Blue Belts'
      break;
    default:
      notes = ''
      break;
  }
  let temp_date = new Date();
  let year = temp_date.getFullYear();
  const built_date = item.month + ' ' + item.day + ', ' + year;
  console.log('item.level: ' + item.level);
  console.log('built_date: ' + built_date);
  console.log('item.time: ' + item.time);
  if (item.level == '9'){
    console.log('creating a make-up test')
    notes = 'Make Up Testing'
    const levelArr = ['-1', '0', '1', '2']
    const makeupQuery = "insert into test_instance (level, test_date, test_time, notes) values (($1)::int, to_date($2, 'Month DD, YYYY'), ($3)::time, $4), (($5)::int, to_date($2, 'Month DD, YYYY'), ($3)::time, $4), (($6)::int, to_date($2, 'Month DD, YYYY'), ($3)::time, $4), (($7)::int, to_date($2, 'Month DD, YYYY'), ($3)::time, $4)";
    db.any(makeupQuery, [levelArr[0], built_date, item.time, notes, levelArr[1], levelArr[2], levelArr[3]])
      .then(row => {
        console.log('Make up test created');
        const testQueryAll = "select id, level, to_char(test_date, 'Mon DD, YYYY') || ' - ' || to_char(test_time, 'HH:MI PM') as test_day, notes, curriculum from test_instance where test_date > CURRENT_DATE - INTERVAL '1 months' AND test_date < CURRENT_DATE + INTERVAL '2 months' order by test_date, test_time;"
        db.any(testQueryAll)
          .then(data => {
            res.render('create_test', {
              test_data: data,
              alert_message: 'Make up test created on ' + built_date + ' at ' + item.time
            })
          })
          .catch(err => {
            res.render('create_test', {
              test_data: '',
              alert_message: 'CANNOT SHOW FUTURE TESTS. PLEASE REFRESH PAGE.'
            })
          })
      })
      .catch(err => {
        console.log('Makeup testing query issue: ' + err);
        var passing = false
      })
  } else {
    const new_test_query = "insert into test_instance (level, test_date, test_time, notes, curriculum) values (($1)::int, to_date($2, 'Month DD, YYYY'), ($3)::time, $4, $5)";
    db.any(new_test_query, [item.level, built_date, item.time, notes, item.curr])
      .then(function (rows) {
        const test_Query_All = "select id, level, to_char(test_date, 'Mon DD, YYYY') || ' - ' || to_char(test_time, 'HH:MI PM') as test_day, notes, curriculum from test_instance where test_date > CURRENT_DATE - INTERVAL '1 months' AND test_date < CURRENT_DATE + INTERVAL '2 months' order by test_date, test_time;"
        db.any(test_Query_All)
          .then(function (test_data) {

        switch (item.level) {
          case '-1':
            res.render('create_test', {
              alert_message: 'Test created for Little Dragons on ' + built_date + ' at ' + item.time,
              test_data: test_data
            })
            break;
          case '0':
            res.render('create_test', {
              alert_message: 'Test created for Basic on ' + built_date + ' at ' + item.time,
              test_data: test_data
            })
            break;
          case '1':
            res.render('create_test', {
              alert_message: 'Test created for Level 1 on ' + built_date + ' at ' + item.time,
              test_data: test_data
            })
            break;
          case '2':
            res.render('create_test', {
              alert_message: 'Test created for Level 2 on ' + built_date + ' at ' + item.time,
              test_data: test_data
            })
            break;
          case '3':
            res.render('create_test', {
              alert_message: 'Test created for Level 3 on ' + built_date + ' at ' + item.time,
              test_data: test_data
            })
            break;
          case '7':
            res.render('create_test', {
              alert_message: 'Test created for Exclusive on ' + built_date + ' at ' + item.time,
              test_data: test_data
            })
            break;
          case '8':
            res.render('create_test', {
              alert_message: 'Test created for Black Belt on ' + built_date + ' at ' + item.time,
              test_data: test_data
            })
            break;
          case '9':
            res.render('create_test', {
              alert_message: 'Make up created for little dragons, basic, level 1, and level 2 on ' + built_date + ' at ' + item.time,
              test_data: test_data
            })
            break;
          default:
            req.flash('error', 'Test Not Created! with data: (level: ' + item.level + ', built_date: ' + built_date + ', time: ' + item.time + ')');
            console.log('Test Not Created! with data: (level: ' + item.level + ', built_date: ' + built_date + ', time: ' + item.time + ')');
            res.redirect('/create_test');
            break;
        }
      })
      .catch(function (err) {
        res.render('create_test', {
          alert_message: 'Could not show future tests. Please refresh page.' + err,
          test_data: ''
        })
      })
      })
      .catch(function (err) {
        console.log("Error in creating test: " + err);
        req.flash('error', 'Test not created. ERR: ' + err);
        res.render('create_test', {
          alert_message: 'Test not created. Error: ' + err
        })
      })
  }
})

const portalValidate = [
  check('result', 'Name and ID cannot be empty').isLength({ min: 5 }).trim().escape()
]
router.post('/student_portal_login', portalValidate, (req, res) => {
  const loginErrors = validationResult(req)
  if (!loginErrors.isEmpty()){
    res.status(422).json({ errors: loginErrors.array() })
  } else {
    const item = {
      student_info: req.body.result
    }
    const studInfo = parseStudentInfo(item.student_info) // name, barcode
    res.redirect('student_portal/' + studInfo[1])
  }
})

router.get('/student_portal/(:barcode)', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID) {
    const studInfo = "select first_name, last_name, email, belt_order, belt_color, belt_size, to_char(last_visit, 'Month DD, YYYY') as last_visit, reg_class, spar_class, swat_count, month_1, month_2 from student_list where barcode = $1;"
    const testQuery = "select s.student_name, s.session_id, s.test_id, to_char(i.test_date, 'Month') || ' ' || to_char(i.test_date, 'DD') || ' at ' || to_char(i.test_time, 'HH:MI PM') || ' ' || i.notes as test_instance, i.curriculum from test_signups s, test_instance i where s.barcode = $1 and i.id = s.test_id order by i.test_date;"
    const classQuery = "select s.student_name, s.email, s.class_check, s.class_session_id, s.is_swat, to_char(c.starts_at, 'Month') || ' ' || to_char(c.starts_at, 'DD') || ' at ' || to_char(c.starts_at, 'HH:MI PM') as class_instance, c.starts_at, c.class_id from classes c, class_signups s where s.barcode = $1 and s.class_session_id = c.class_id and s.is_swat = false and c.starts_at >= (CURRENT_DATE - INTERVAL '7 hour')::date order by s.student_name, c.starts_at;"
    const swatQuery = "select s.student_name, s.email, s.class_check, s.is_swat, s.class_session_id, to_char(c.starts_at, 'Month') || ' ' || to_char(c.starts_at, 'DD') || ' at ' || to_char(c.starts_at, 'HH:MI PM') as class_instance, c.starts_at, c.class_id from classes c, class_signups s where s.barcode = $1 and s.class_session_id = c.class_id and c.starts_at >= (CURRENT_DATE - INTERVAL '7 hour')::date and s.is_swat = true order by c.starts_at;"
    db.any(studInfo, [req.params.barcode])
      .then(info => {
        db.any(classQuery, [req.params.barcode])
          .then(classes => {
            db.any(testQuery, [req.params.barcode])
              .then(tests => {
                db.any(swatQuery, [req.params.barcode])
                  .then(swats => {
                    const dateEvent = new Date()
                    const options1 = {
                      month: 'long',
                      timeZone: 'America/Denver'
                    }
                    const month = dateEvent.toLocaleDateString('en-US', options1)
                    res.render('student_portal', {
                      studInfo: info,
                      class_info: classes,
                      test_info: tests,
                      swat_info: swats,
                      barcode: req.params.barcode,
                      month: month,
                      alert_message: ''
                    })
                  })
                  .catch(err => {
                    console.log('Could not get student swats with barcode. Error: ' + err)
                    res.render('student_portal', {
                      studInfo: '',
                      class_info: '',
                      test_info: '',
                      swat_info: '',
                      barcode: req.params.barcode,
                      month: '?',
                      alert_message: 'Could not find student swats with the barcode: ' + req.params.barcode + '. Please see an instructor to correct this.'
                    })
                  })
              })
              .catch(err => {
                console.log('Could not get student tests with barcode. Error: ' + err)
                res.render('student_portal', {
                  studInfo: '',
                  class_info: '',
                  test_info: '',
                  swat_info: '',
                  barcode: req.params.barcode,
                  alert_message: 'Could not find student tests with the barcode: ' + req.params.barcode + '. Please see an instructor to correct this.'
                })
              })
          })
          .catch(err => {
            console.log('Could not get student classes with barcode. Error: ' + err)
            res.render('student_portal', {
              studInfo: '',
              class_info: '',
              test_info: '',
              swat_info: '',
              barcode: req.params.barcode,
              alert_message: 'Could not find student classes with the email: ' + req.params.barcode + '. Please see an instructor to correct this.'
            })
          })
      })
      .catch(err => {
        console.log('Could not get student info with barcode. Error: ' + err)
        res.render('student_portal', {
          studInfo: '',
          class_info: '',
          test_info: '',
          swat_info: '',
          barcode: req.params.barcode,
          alert_message: 'Could not find a student with the barcode: ' + req.params.barcode + '. Please see an instructor to correct this.'
        })
      })
    } else {
      res.render('login', {
        
      })
    }
})

router.get('/enrollStudent', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    res.render('enrollStudent', {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      beltColor: '',
      beltSize: '',
      addr: '',
      apt: '',
      city: '',
      zip: '',
      bday: '',
      alert_message: ''
    })
  } else {
    res.render('login', {
    })
  }
})

router.post('/enrollStudent', (req, res) => {
  var item = {
    firstName: req.sanitize('firstName').trim(),
    lastName: req.sanitize('lastName').trim(),
    email: req.sanitize('email').trim(),
    phone: req.sanitize('phone').trim(),
    beltColor: req.sanitize('beltColor').trim(),
    beltSize: req.sanitize('beltSize').trim(),
    addr: req.sanitize('addr').trim(),
    apt: req.sanitize('apt').trim(),
    city: req.sanitize('city').trim(),
    zip: req.sanitize('zip').trim(),
    bday: req.sanitize('bday').trim()
  }
  if (item.apt === '') {
    item.apt = null
  }
  if (item.email === '') {
    item.email = 'no@email.com'
  }
  if (item.phone === '') {
    item.phone = 1231231234
  }
  if (item.addr === '') {
    item.addr = '123 Sesame St.'
  }
  if (item.city === '') {
    item.city = 'None'
  }
  if (item.zip === '') {
    item.zip = 12345
  }
  if (item.bday === '') {
    item.bday = '1930-07-15'
  }
  const options = {
    method: 'POST',
    uri: settings.apiv4url + '/customer',
    headers: {
      Authorization: getAuthHeader()
    },
    json: true,
    body: {
      FirstName: item.firstName,
      LastName: item.lastName,
      ShippingSameAsBilling: true,
      BillingAddress: {
        StreetAddress1: item.addr,
        StreetAddress2: item.apt,
        City: item.city,
        StateCode: 'CO',
        ZipCode: item.zip
      },
      Phone: item.phone,
      Email: item.email,
      Notes: 'This person was created with EMA Side Kick - Lakewood'
    }
  }
  request(options, function (error, response, body) {
    if (!error && response && response.statusCode < 300) {
      const barcode = body.Response.Id
      const joinedOn = body.Response.CreatedOn
      const info = joinedOn.substring(0, joinedOn.indexOf('T')) // MM-DD-YYYY
      console.log('bday is ' + item.bday)
      const levelInfo = parseBelt(item.beltColor, false) // returns belt color, level, and belt_order value
      const newStudent = "insert into student_list (barcode, first_name, last_name, belt_color, belt_size, belt_order, addr, addr_2, email, level_name, join_date, bday) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, to_date($11, 'YYYY-MM-DD'), to_date($12, 'YYYY-MM-DD'));"
      db.none(newStudent, [barcode, item.firstName, item.lastName, levelInfo[0], item.beltSize, levelInfo[2], item.addr, item.apt, item.email, levelInfo[1], info, item.bday])
        .then(row => {
          res.render('enrollStudent', {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            beltColor: '',
            beltSize: '',
            addr: '',
            apt: '',
            city: '',
            zip: '',
            bday: '',
            alert_message: 'Successfully added ' + item.firstName + ' ' + item.lastName + ' to the student list'
          })
        })
        .catch(err => {
          res.render('enrollStudent', {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            beltColor: '',
            beltSize: '',
            addr: '',
            apt: '',
            city: '',
            zip: '',
            bday: '',
            alert_message: 'ERROR! Unable to add ' + item.firstName + ' ' + item.lastName + ' to the student list. ERROR: ' + err
          })
        })
        // res.status((response && response.statusCode) || 500).send(error);
    } else {
      console.log('ERROR in adding student: ' + error)
      res.render('enrollStudent', {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        beltColor: '',
        beltSize: '',
        addr: '',
        apt: '',
        city: '',
        zip: '',
        bday: '',
        alert_message: 'ERROR! Unable to add ' + item.firstName + ' ' + item.lastName + ' to the student list. ERROR: ' + error
      })
      // res.status((response && response.statusCode) || 500).send(error);
    }
  })
})

router.get('/viewNew', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    let options = {
      method: "GET",
      uri: settings.apiv4url + '/customer',
      headers: {
          Authorization: getAuthHeader(),
      },
      body: {
        sortby: 'LastName',
      },
      json: true,
      sortby: 'LastName',
  };
  const id_query = 'select barcode, first_name, last_name from student_list order by barcode';
  db.any(id_query)
    .then(rows => {
      request(options, function(error, response, body) {
        if (!error && response && response.statusCode < 300) {
            //res.json(body.Response);
            res.render('integrate_ps', {
              alert_message: '',
              current_people: rows,
              new_people: body.Response
            })
            return;
        }
        
        res.status((response && response.statusCode) || 500).send(error);

        
      });
    })
    .catch(err => {
      console.log('Could not find any people. Error: ' + err);
      res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com');
    })
  } else {
    res.render('login', {
    })
  }
})

router.get('/integrate_ps/(:new_id)/(:inList)/(:fname)/(:lname)/(:email)', passageAuthMiddleware, async(req, res) => {
  if (req.cookies.psg_auth_token && res.userID && staffArray.includes(res.userID)) {
    if (String(req.params.inList) == 'true'){
      const update_import_query = 'update student_list set barcode = $1 where Lower(first_name) = $2 and Lower(last_name) = $3';
      db.any(update_import_query, [req.params.new_id, req.params.fname, req.params.lname])
        .then(row => {
          let options = {
            method: "GET",
            uri: settings.apiv4url + '/customer',
            headers: {
                Authorization: getAuthHeader(),
            },
            body: {
              sortby: 'LastName',
            },
            json: true,
            sortby: 'LastName',
        };
        const id_query = 'select barcode, first_name, last_name from student_list order by barcode';
        db.any(id_query)
          .then(rows => {
            request(options, function(error, response, body) {
              if (!error && response && response.statusCode < 300) {
                res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/viewNew');
                  return;
              }
            
              res.status((response && response.statusCode) || 500).send(error);
      
            });
          })
        })
        .catch(err => {
          console.log('Couldnt update import student. Err: ' + err);
          res.render('integrate_ps', {
            alert_message: 'Could not update that student in the list. Please contact tech support and refresh the page. ERROR: ' + err,
            current_people: '',
            new_people: ''
          })
        })
    } else {
      const add_new_query = "insert into student_list (barcode, first_name, last_name, belt_color, belt_size, email, belt_order, level_name) values ($1, $2, $3, 'white', -1, $4, 0, 'Basic') on conflict (barcode) do nothing";
      db.any(add_new_query, [req.params.new_id, req.params.fname, req.params.lname, req.params.email])
        .then(row => {
          let options = {
            method: "GET",
            uri: settings.apiv4url + '/customer',
            headers: {
                Authorization: getAuthHeader(),
            },
            body: {
              sortby: 'LastName',
            },
            json: true,
            sortby: 'LastName',
        };
        const id_query = 'select barcode, first_name, last_name from student_list order by barcode';
        db.any(id_query)
          .then(rows => {
            request(options, function(error, response, body) {
              if (!error && response && response.statusCode < 300) {
                res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/viewNew');
                return;
              }
            
              res.status((response && response.statusCode) || 500).send(error);
        
            });
          })
        })
        .catch(err => {
          console.log('Couldnt add import student. Err: ' + err);
          res.render('integrate_ps', {
            alert_message: 'Could not add that student to the list. Please contact tech support and refresh the page. ERROR: ' + err,
            current_people: '',
            new_people: ''
          })
        })
    }
  } else {
    res.render('login', {
    })
  }
})

request.get({
  uri: 'https://api.paysimple.com/ps/webhook/subscriptions/',
  //"url": 'https://ema-planner.herokuapp.com/ps_webhook',
  //"event_types": ['payment_failed', 'customer_created', 'customer_updated', 'customer_deleted'],
  //"is_active": 'true',
  headers: {
    Authorization: 'basic ' + settings.username + ':' + process.env.ps_api,
    "content-type": "application/json; charset=utf-8",
  },
  /*body: JSON.stringify({
    "url": 'https://ema-planner.herokuapp.com/ps_webhook',
    "event_types": ['payment_failed', 'customer_created', 'customer_updated', 'customer_deleted'],
    "is_active": 'true',
  })*/
}, function(e,r,b){
  //console.log('res: ' + JSON.safeStringify(r))
  //console.log('body: ' + JSON.safeStringify(b))
})

request.post({
  uri: 'https://api.paysimple.com/ps/webhook/subscription',
  //uri: 'https://sandbox-api.paysimple.com/ps/webhook/subscription',
  "url": 'https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/ps_webhook',
  "event_types": ['payment_failed', 'customer_created', 'customer_updated', 'customer_deleted'],
  "is_active": 'true',
  headers: {
    Authorization: 'basic ' + settings.username + ':' + process.env.ps_api,
    "content-type": "application/json; charset=utf-8",
  },
  body: JSON.stringify({
    "url": 'https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/ps_webhook',
    "event_types": ['payment_failed', 'customer_created', 'customer_updated', 'customer_deleted'],
    "is_active": 'true',
  })
}, function(e,r,b){
});

app.post('/ps_webhook', (req, res) => {
  let event = req.body.event_type;
  try {
    console.log('webhook received. - ' + event);
  } catch (err) {
    res.status(400).send();
  }
  switch (event) {
    case 'customer_created':
      var fname = req.body.data.first_name;
      fname = fname.replace("'","");
      var lname = req.body.data.last_name;
      lname = lname.replace("'",'');
      var email = req.body.data.email;
      if (email == '' || email == null){
        email = 'no@email.available'
      }
      const barcode = req.body.data.customer_id
      var date_event = new Date(req.body.created_at);
      var options_1 = { 
        month: 'long',
        timeZone: 'America/Denver'
      };
      var options_2 = { 
        day: 'numeric',
        timeZone: 'America/Denver'
      };
      var options_3 = {
          year: 'numeric',
          timeZone: 'America/Denver'
      };
      var month = date_event.toLocaleDateString('en-US', options_1);
      var day = date_event.toLocaleDateString('en-US', options_2);
      var year = date_event.toLocaleDateString('en-US', options_3);
      var date_added = month + ' ' + day + ', ' + year;
      const add_query = "insert into student_list (barcode, first_name, last_name, belt_color, belt_size, email, level_name, belt_order, join_date) values ($1, $2, $3, $4, $5, $6, $7, $8, to_date($9, 'Month DD, YYYY')) on conflict (barcode) do nothing;"
      db.none(add_query, [barcode, fname, lname, 'White', -1, email, 'Basic', 0, date_added])
        .then(row => {
          console.log('Added a new student');
          res.status(200).send();
        })
        .catch(err => {
          console.log('Could not add a new student - webhook error: ' + err);
          res.status(400).send();
        })
      res.status(200).send();
      break;
    case 'payment_created':
      res.status(200).send();
      break;
    case 'customer_deleted':
      const removeCode = req.body.data.customer_id;
      const del_query = 'delete from student_list where barcode = $1';
      db.none(del_query, [removeCode])
        .then(row => {
          console.log('Deleted student with barcode: ' + removeCode);
          res.status(200).send();
        })
        .catch(err => {
          console.log('Unable to delete student - webhook error: ' + err);
          res.status(400).send();
        })
      res.status(200).send();
      break;
    case 'customer_updated':
      const update_customer = 'update student_list set first_name = $1, last_name = $2, email = $3 where barcode = $4;';
      db.none(update_customer, [req.body.data.first_name, req.body.data.last_name, req.body.data.email, req.body.data.customer_id])
        .then(update_row => {
          console.log('Updated student with barcode: ' + req.body.data.customer_id);
          res.status(200).send();
        })
        .catch(err => {
          console.log('Could not update student - webhook error: ' + err);
          res.status(400).send();
        })
      res.status(200).send();
      break;
    case 'payment_failed':
      const amount = req.body.data.amount;
      const customer = req.body.data.customer_id;
      const reason = req.body.data.failure_reason;
      const payment_id = req.body.data.payment_id;
      const failed_query = 'insert into failed_payments (customer, amount, reason, email, id_failed) values ($1, $2, $3, (select email from student_list where barcode = $4), $5) on conflict (id_failed) do nothing;'
      const assign_code = 'update student_list set failed_charge = true where barcode = $1';
      db.any(failed_query, [customer, amount, reason, customer, payment_id])
        .then(function (row) {
          db.none(assign_code, [customer])
            .then(num1 => {
              console.log('Added a charge.failed webhook')
              res.status(200).send();
            })
            .catch(err => {
              console.log('charge.failed ended with err ' + err);
              res.status(400).send();
            })
        })
        .catch(function (err) {
          console.log('charge.failed ended with err ' + err)
          res.status(400).send();
        })
        res.status(200).send();
        break;
    default:
      res.status(400).send();
      break;
  }
  res.status(200).send();
})

app.listen(port, () => {
  console.info('EMA-Planner running on port', port)
})
