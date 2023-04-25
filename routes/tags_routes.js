var router = require('express').Router()
const { db } = require('../firebase')

router.post('/', async (req, res) => {
  try {
    const data = req.body

    const userRef = db.collection('tags')

    const res = await userRef.add(data)

    res.status(201).json({ msg: 'Creation successful' })
  } catch (error) {
    res.send(error)
  }
})

router.get('/', async (req, res) => {
  try {
    let allTags = []

    const snapshots = await db.collection('tags').get()
    snapshots.forEach((val) => {
      allTags.push(val.data().tags)
    })

    res.status(200).json({ data: allTags })
  } catch (error) {
    res.send(error)
  }
})

module.exports = router
