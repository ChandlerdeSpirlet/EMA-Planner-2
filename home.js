const express = require('express')
const bodyParser = require('body-parser')
const nunjucks = require('nunjucks')
const session = require('express-session')
const path = require('path')
// const exp_val = require('express-validator')
const flash = require('connect-flash')
const fs = require('fs')
// const { writeFileSync, read } = require('fs')
// const { readFileSync } = require('fs')
// const ics = require('ics')
var cookieParser = require('cookie-parser')
// const { writeFileSync, read } = require('fs')
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
//router.use(exp_val()) https://express-validator.github.io/docs/guides/getting-started

const db = require('./database')
// const { proc } = require('./database')
// const { get } = require('http')
// const { json } = require('body-parser')
// const { resolveObjectURL } = require('buffer')

app.use(flash({ sessionKeyName: 'ema-Planner-two' }))

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

router.post('/login', (req, res) => {
  const item = {
    username: req.sanitize('username').trim(),
    password: req.sanitize('password').trim(),
    go_to: req.sanitize('go_to').trim()
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

app.listen(port, () => {
  console.info('EMA-Planner running on port', port)
})
