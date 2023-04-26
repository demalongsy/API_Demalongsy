var router = require('express').Router()
const { db } = require('../firebase')
const middleware = require('../middleware')

router.get('/viewcomment/:block_id', middleware.checkToken, async (req, res) => {
  try {
    const { block_id } = req.params
    let allComments = []

    const getData = await db.collection('comments').where('reply_block_id', '==', block_id).get()

    getData.forEach((val) => {
      allComments.push(val.data())
    })

    res.status(200).json({ data: allComments })
  } catch (error) {
    res.send(error)
  }
})

router.post('/', middleware.checkToken, async (req, res) => {
  try {
    const { reply_block_id } = req.body
    const date = new Date()

    const createData = await db.collection('comments').add({ date: date.toLocaleString(), ...req.body })
    const blockRef = db.collection('blocks').doc(reply_block_id)

    const getData = await blockRef.get()

    const updateData = await blockRef.update({ num_comment: getData.data().num_comment + 1 })

    res.status(201).json({ msg: 'Creation successful' })
  } catch (error) {
    res.send(error)
  }
})

module.exports = router
