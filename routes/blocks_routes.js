var router = require('express').Router()
const { db } = require('../firebase')
const middleware = require('../middleware')


router.get('/', async (req, res)=> {
  try{
    let result = []

    const getData = await db.collection('blocks').get()

    getData.forEach((val) => {
      result.push(val.data())
    })

    res.status(200).json({ data: result })
  } catch(error){
    res.send(error)
  }
})

router.get('/view/:block_id', middleware.checkToken, async (req, res) => {
  try {
    const { block_id } = req.params
    const { username } = req.query
    let result

    const getBlock = await db.collection('blocks').doc(block_id).get()

    if (getBlock.data().username === username) {
      result = getBlock.data()
      result.isOwner = true
    } else {
      result = getBlock.data()
      result.isOwner = false
    }
    result.block_id = block_id

    res.status(200).json({ data: result })
  } catch (error) {
    res.send(error)
  }
})

router.get('/related', middleware.checkToken, async (req, res) => {
  try {
    const { tags } = req.query
    let allPost = []
    let allTags

    allTags = tags.split(',')
    const getData = await db.collection('blocks').where('tags', 'array-contains-any', allTags).get()

    getData.forEach((val) => {
      allPost.push(val.data())
    })

    res.status(200).json({ data: allPost })
  } catch (error) {
    res.send(error)
  }
})

router.post('/create', middleware.checkToken, async (req, res) => {
  try {
    const { tags } = req.body
    const date = new Date()
    let getTags
    let num_mention = 0

    const createData = await db.collection('blocks').add({ date: date.toLocaleString(), ...req.body, liked: [], num_comment: 0 })

    tags.map(async (val) => {
      tagRef = db.collection('tags').where('tags', '==', val)
      getTags = await tagRef.get()

      getTags.forEach(async (val) => {
        num_mention = val.data().num_mention + 1
        await db.collection('tags').doc(val.id).update({ num_mention: num_mention })
      })
    })

    res.status(201).json({ mgs: 'Creation successful' })
  } catch (error) {
    res.send(error)
  }
})

router.delete('/:block_id', middleware.checkToken, async (req, res) => {
  try {
    const { block_id } = req.params

    const dateData = await db.collection('blocks').doc(block_id).delete()

    res.status(200).json({ msg: 'Data succesfullt deleted' })
  } catch (error) {}
})

module.exports = router
