var router = require('express').Router()
const { db } = require('../firebase')
const middleware = require('../middleware')

router.get('/:item_id', async (req, res) => {
  try {
    const { item_id } = req.params
    let result = {}

    const getFashionCollection = await db.collection('fashion').doc(item_id).get()
    result = getFashionCollection.data()

    res.status(200).json(result)
  } catch (error) {
    console.log(error)
    res.send(error)
  }
})

router.get('/', async (req, res) => {
  try {
    const { type } = req.query
    let result = []

    const getFashionCollection = await db.collection('fashion').where('category', '==', type).get()
    getFashionCollection.forEach((val) => {
      result.push(val.data())
    })

    res.status(200).json({ data: result })
  } catch (error) {
    console.log(error)
    res.send(error)
  }
})

router.post('/createFashionData', middleware.checkToken, async (req, res) => {
  try {
    console.log(req.body)
    const fashionCollection = db.collection('fashion')
    await fashionCollection.add(req.body)
    res.status(200).json({
      msg: 'success',
    })
  } catch (error) {
    console.log(error)
    res.send(error)
  }
})

router.patch('/:fashionID', async (req, res) => {
  try {
    const { fashionID } = req.params
    console.log(fashionID)
    const updateFashionData = await db
      .collection('fashion')
      .doc(fashionID)
      .update({ ...req.body })
    res.status(200).json({
      msg: 'success',
    })
  } catch (error) {
    console.log(error)
    res.send(error)
  }
})

router.delete('/:fashionID', async (req, res) => {
  try {
    const { fashionID } = req.params
    console.log(fashionID)
    const updateFashionData = await db.collection('fashion').doc(fashionID).delete()
    res.status(200).json({
      msg: 'success',
    })
  } catch (error) {
    console.log(error)
    res.send(error)
  }
})

module.exports = router
