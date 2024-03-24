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
// const request = require('request')
// const crypto = require('crypto')
// const Json2csvParser = require("json2csv").Parser
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

// function getAuthHeader() {
//   let time = (new Date()).toISOString()
//   let hash = crypto.createHmac('SHA256', settings.apikey).update(time).digest('base64')
//   return "PSSERVER" + " " + "accessid=" + settings.username + "; timestamp=" + time + "; signature=" + hash;
// }
// function getAuthHeader_beta() {
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
// const { proc } = require('./database')
// const { get } = require('http')
// const { json } = require('body-parser')
// const { resolveObjectURL } = require('buffer')

app.use(flash({ sessionKeyName: 'ema-Planner-two' }))

function parseStudentInfo (info) {
  const studInfo = ['', 0]
  studInfo[0] = info.substring(0, info.indexOf(' - '))
  studInfo[1] = info.substring(info.indexOf(' - ') + 3, info.length)
  if (studInfo[0].indexOf(',') !== -1) {
    const lastName = studInfo[0].substring(0, studInfo[0].indexOf(','))
    const firstName = studInfo[0].substring(studInfo[0].indexOf(',') + 2, studInfo[0].length)
    studInfo[0] = firstName + ' ' + lastName
  }
  return studInfo
}

function convertTZ (date, tzString) {
  return new Date((typeof date === 'string' ? new Date(date) : date).toLocaleString('en-US', { timeZone: tzString }))
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

app.get('/', (req, res) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://ema-sidekick-lakewood-cf3bcec8ecb2.herokuapp.com/')
  } else {
    if (req.session.loggedin) {
      res.render('home.html', {
      })
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

router.get('/login', (req, res) => {
  res.render('login', {
    username: '',
    password: '',
    go_to: '',
    alert_message: ''
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

router.get('/dragons_signup', (req, res) => {
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
})

router.get('/basic_signup', (req, res) => {
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
})

router.get('/level1_signup', (req, res) => {
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
})

router.get('/level2_signup', (req, res) => {
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
})

router.get('/level3_signup', (req, res) => {
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
})

router.get('/wfc_signup', (req, res) => {
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
})

router.get('/sparapalooza_signup', (req, res) => {
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
})

router.get('/bb_signup', (req, res) => {
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
})

router.get('/weapons_signup', (req, res) => {
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
})

router.get('/bjj_signup', (req, res) => {
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
})

router.get('/conditional_signup', (req, res) => {
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
})

router.get('/swat_signup', (req, res) => {
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
})

router.post('/dragons_signup', (req, res) => {
  const item = {
    stud_data: req.sanitize('result').trim(),
    stud_data2: req.sanitize('result2').trim(),
    stud_data3: req.sanitize('result3').trim(),
    stud_data4: req.sanitize('result4').trim(),
    day_time: req.sanitize('day_time')
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
})

router.post('/basic_signup', (req, res) => {
  const item = {
    stud_data: req.sanitize('result').trim(),
    stud_data2: req.sanitize('result2').trim(),
    stud_data3: req.sanitize('result3').trim(),
    stud_data4: req.sanitize('result4').trim(),
    day_time: req.sanitize('day_time')
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
})

router.post('/weapons_signup', (req, res) => {
  const item = {
    stud_data: req.sanitize('result').trim(),
    stud_data2: req.sanitize('result2').trim(),
    stud_data3: req.sanitize('result3').trim(),
    stud_data4: req.sanitize('result4').trim(),
    day_time: req.sanitize('day_time')
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
})

router.post('/bjj_signup', (req, res) => {
  const item = {
    stud_data: req.sanitize('result').trim(),
    stud_data2: req.sanitize('result2').trim(),
    stud_data3: req.sanitize('result3').trim(),
    stud_data4: req.sanitize('result4').trim(),
    day_time: req.sanitize('day_time')
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
})

router.post('/conditional_signup', (req, res) => {
  const item = {
    stud_data: req.sanitize('result').trim(),
    stud_data2: req.sanitize('result2').trim(),
    stud_data3: req.sanitize('result3').trim(),
    stud_data4: req.sanitize('result4').trim(),
    day_time: req.sanitize('day_time')
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
})

router.post('/level1_signup', (req, res) => {
  const item = {
    stud_data: req.sanitize('result').trim(),
    stud_data2: req.sanitize('result2').trim(),
    stud_data3: req.sanitize('result3').trim(),
    stud_data4: req.sanitize('result4').trim(),
    day_time: req.sanitize('day_time')
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
})

router.post('/level2_signup', (req, res) => {
  const item = {
    stud_data: req.sanitize('result').trim(),
    stud_data2: req.sanitize('result2').trim(),
    stud_data3: req.sanitize('result3').trim(),
    stud_data4: req.sanitize('result4').trim(),
    day_time: req.sanitize('day_time')
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
})

router.post('/level3_signup', (req, res) => {
  const item = {
    stud_data: req.sanitize('result').trim(),
    stud_data2: req.sanitize('result2').trim(),
    stud_data3: req.sanitize('result3').trim(),
    stud_data4: req.sanitize('result4').trim(),
    day_time: req.sanitize('day_time')
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
})

router.post('/bb_signup', (req, res) => {
  const item = {
    stud_data: req.sanitize('result').trim(),
    stud_data2: req.sanitize('result2').trim(),
    stud_data3: req.sanitize('result3').trim(),
    stud_data4: req.sanitize('result4').trim(),
    day_time: req.sanitize('day_time')
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
})

router.post('/wfc_signup', (req, res) => {
  const item = {
    stud_data: req.sanitize('result').trim(),
    stud_data2: req.sanitize('result2').trim(),
    stud_data3: req.sanitize('result3').trim(),
    stud_data4: req.sanitize('result4').trim(),
    day_time: req.sanitize('day_time')
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
})

router.post('/sparapalooza_signup', (req, res) => {
  const item = {
    stud_data: req.sanitize('result').trim(),
    stud_data2: req.sanitize('result2').trim(),
    stud_data3: req.sanitize('result3').trim(),
    stud_data4: req.sanitize('result4').trim(),
    day_time: req.sanitize('day_time')
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
})

router.post('/swat_signup', (req, res) => {
  const item = {
    stud_data: req.sanitize('result').trim(),
    stud_data2: req.sanitize('result2').trim(),
    stud_data3: req.sanitize('result3').trim(),
    stud_data4: req.sanitize('result4').trim(),
    day_time: req.sanitize('day_time')
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
            url: 'https://ema-planner.herokuapp.com/student_portal/' + numIn.master_barcode,
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
            url: 'https://ema-planner.herokuapp.com/student_portal/' + numIn.master_barcode,
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
            url: 'https://ema-planner.herokuapp.com/student_portal/' + numIn.master_barcode,
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
            url: 'https://ema-planner.herokuapp.com/student_portal/' + numIn.master_barcode,
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
            url: 'https://ema-planner.herokuapp.com/student_portal/' + numIn.master_barcode,
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
            url: 'https://ema-planner.herokuapp.com/student_portal/' + numIn.master_barcode,
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
            url: 'https://ema-planner.herokuapp.com/student_portal/' + numIn.master_barcode,
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
            url: 'https://ema-planner.herokuapp.com/student_portal/' + numIn.master_barcode,
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
            url: 'https://ema-planner.herokuapp.com/student_portal/' + numIn.master_barcode,
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
            url: 'https://ema-planner.herokuapp.com/student_portal/' + numIn.master_barcode,
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
            url: 'https://ema-planner.herokuapp.com/student_portal/' + numIn.master_barcode,
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
            url: 'https://ema-planner.herokuapp.com/student_portal/' + numIn.master_barcode,
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
            url: 'https://ema-planner.herokuapp.com/student_portal/' + numIn.master_barcode,
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
            url: 'https://ema-planner.herokuapp.com/student_portal/' + numIn.master_barcode,
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
            url: 'https://ema-planner.herokuapp.com/student_portal/' + numIn.master_barcode,
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
            url: 'https://ema-planner.herokuapp.com/student_portal/' + numIn.master_barcode,
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
            url: 'https://ema-planner.herokuapp.com/student_portal/' + numIn.master_barcode,
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
            url: 'https://ema-planner.herokuapp.com/student_portal/' + numIn.master_barcode,
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
            url: 'https://ema-planner.herokuapp.com/student_portal/' + numIn.master_barcode,
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

app.listen(port, () => {
  console.info('EMA-Planner running on port', port)
})