var router = require('express').Router()
const { db } = require('../firebase')
const middleware = require('../middleware')

router.get('/view/:post_id', middleware.checkToken, async (req, res) => {
  try {
    const { post_id } = req.params
    const { username } = req.query

    
  } catch (error) {
    res.send(error)
  }
})

router.post('/create', middleware.checkToken, async (req, res) => {
  try {
    const data = req.body
    const date = new Date()

    const createData = await db.collection('blocks').add({ date: date.toLocaleString(), ...data })

    res.status(201).json({ mgs: 'Creation successful' })
  } catch (error) {
    res.send(error)
  }
})

module.exports = router
