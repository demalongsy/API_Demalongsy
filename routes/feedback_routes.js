var router = require('express').Router()
const { db } = require('../firebase')
const middleware = require('../middleware')

router.post('/', middleware.checkToken, async (req, res) => {
  try {
    const data = req.body

    const createdata = await db.collection('feedbacks').add({ date: Date(), ...data })

    res.status(201).json({ msg: 'Creation successful' })
  } catch (error) {
    res.send(error)
  }
})

module.exports = router
