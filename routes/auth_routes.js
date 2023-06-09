const router = require('express').Router()
const { db } = require('../firebase')
const config = require('../config')
const middleware = require('../middleware')
const jwt = require('jsonwebtoken')

router.post('/register', async (req, res) => {
  try {
    const { username } = req.body
    let collectData = []

    let result

    const snapshot = await db.collection('users').where('username', '==', username).get()

    snapshot.forEach((val) => {
      collectData.push(val.data())
    })

    if (collectData.length == 0) {
      result = await db.collection('users').add({ name: 'Anonymous', ...req.body })
      let token = jwt.sign({ username }, config.key, {
        expiresIn: '30 days',
      })

      res.status(201).json({ token: token, msg: 'success', user_id: result.id })
    } else {
      res.status(400).json({ msg: 'Username already exists' })
    }
  } catch (error) {
    res.send(error)
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    let user_id

    let collectdData = []
    const userData = await db.collection('users').where('username', '==', username).where('password', '==', password).get()

    userData.forEach((val) => {
      collectdData.push(val.data())
      user_id = val.id
    })

    if (collectdData.length > 0) {
      let token = jwt.sign({ username }, config.key, {
        expiresIn: '30 days',
      })
      res.status(201).json({ token: token, msg: 'success', user_id: user_id })
    } else {
      res.status(403).json({ msg: 'Username or Password is incorrect' })
    }
  } catch (error) {
    res.send(error)
  }
})

module.exports = router
