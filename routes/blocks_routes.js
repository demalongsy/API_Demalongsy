var router = require('express').Router()
const { db } = require('../firebase')
const middleware = require('../middleware')
const admin = require('firebase-admin')

router.get('/', async (req, res) => {
  try {
    let result = []

    const getData = await db.collection('blocks').get()

    getData.forEach((val) => {
      result.push(val.data())
    })

    res.status(200).json({ data: result })
  } catch (error) {
    res.send(error)
  }
})

router.get('/trending', async (req, res) => {
  try {
    const { user_id } = req.query
    let allPosts = []
    let finalResult = []
    let result
    let num = 0

    const getData = await db.collection('tags').orderBy('num_mention', 'desc').get()

    await Promise.all(
      getData.docs.map(async (val) => {
        const getPost = await db.collection('blocks').where('tags', 'array-contains', val.data().tags).get()

        getPost.forEach((obj) => {
          result = obj.data()
          result.id = obj.id
          allPosts.push(result)
        })
      })
    )

    allPosts.map((val) => {
      num = 0
      finalResult.map((obj) => {
        if (obj.id === val.id) {
          num += 1
        }
      })

      if (num < 1) {
        result = val
        if (val.liked.find((res) => res === user_id)) {
          val.isLiked = true
        } else {
          val.isLiked = false
        }
        finalResult.push(val)
      }
    })

    res.status(200).json({ data: finalResult })
  } catch (error) {
    res.send(error)
  }
})

router.get('/foryou', async (req, res) => {
  try {
    const { user_id } = req.query
    let allPosts = []
    let result
    let num = 0

    const getUser = await db.collection('users').doc(user_id).get()
    const selectedTags = getUser.data().tags

    const getPosts = await db.collection('blocks').where('tags', 'array-contains-any', selectedTags).get()

    getPosts.forEach((val) => {
      result = val.data()
      result.id = val.id
      allPosts.push(result)
    })

    const getOtherPost = await db.collection('blocks').get()

    getOtherPost.forEach((val) => {
      num = 0
      allPosts.map((obj) => {
        if (val.id === obj.id) {
          num = num + 1
        }
      })

      if (num == 0) {
        result = val.data()
        result.id = val.id
        allPosts.push(result)
      }
    })

    allPosts.map((val) => {
      if (val.liked.length > 0) {
        val.liked.map((obj) => {
          if (obj === user_id) {
            val.isLiked = true
          } else {
            val.isLiked = false
          }
        })
      } else {
        val.isLiked = false
      }
    })

    res.status(200).json({ data: allPosts })
  } catch (error) {
    res.send(error)
  }
})

router.get('/view/:block_id', async (req, res) => {
  try {
    const { block_id } = req.params
    const { user_id } = req.query
    let result
    let isLiked = false

    const getBlock = await db.collection('blocks').doc(block_id).get()
    result = getBlock.data()

    if (getBlock.data().author_id === user_id) {
      result.isOwner = true
    } else {
      result.isOwner = false
    }

    if (getBlock.data().liked.length > 0) {
      if (getBlock.data().liked.find((val) => val.toString() === user_id)) {
        isLiked = true
      } else {
        isLiked = false
      }
    }
    result.isLiked = isLiked
    result.block_id = block_id

    res.status(200).json(result)
  } catch (error) {
    res.send(error)
  }
})

router.get('/related/:block_id', async (req, res) => {
  try {
    let allPost = []
    let result

    const { block_id } = req.params
    const { tags, user_id } = req.query

    let removeLeft = tags.replace('[', '')
    let removeRight = removeLeft.replace(']', '')
    let allTags = removeRight.split(',')

    const getData = await db.collection('blocks').where('tags', 'array-contains-any', allTags).get()

    getData.forEach((val) => {
      if (val.id !== block_id) {
        result = val.data()
        result.id = val.id

        allPost.push(result)
      }
    })
    allPost.map((val) => {
      if (val.liked.length > 0) {
        val.liked.map((obj) => {
          if (obj === user_id) {
            val.isLiked = true
          } else {
            val.isLiked = false
          }
        })
      } else {
        val.isLiked = false
      }
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

    const dataUsers = await db.collection('users').where('liked', 'array-contains', block_id).get()

    dataUsers.forEach(async (val) => {
      if (val.id) {
        const userRef = db.collection('users').doc(val.id)
        await userRef.update({ liked: admin.firestore.FieldValue.arrayRemove(block_id) })
      }
    })
   

    

    const dateData = await db.collection('blocks').doc(block_id).delete()

    res.status(200).json({ msg: 'Data succesfullt deleted' })
  } catch (error) {}
})

module.exports = router
