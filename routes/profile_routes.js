var router = require('express').Router()
const { db } = require('../firebase')
const middleware = require('../middleware')

router.get('/', async (req, res) => {
  try {
    let result = []

    const getData = await db.collection('users').get()

    getData.forEach((val) => {
      result.push(val.data())
    })

    res.status(200).json({ data: result })
  } catch (error) {
    res.send(error)
  }
})

router.get('/:username', middleware.checkToken, async (req, res) => {
  try {
    const { username } = req.params
    const { another_username } = req.query
    let result
    let num_was_liked = 0
    let num_postes = 0

    if (another_username) {
      const getPosts = await db.collection('blocks').where('username', '==', another_username).get()
      getPosts.forEach((val) => {
        num_postes += 1
        num_was_liked += val.data().liked.length
      })

      const getData = await db.collection('users').where('username', '==', another_username).get()

      getData.forEach((val) => {
        result = val.data()
        result.user_id = val.id
      })

      result.num_postes = num_postes
      result.num_was_liked = num_was_liked

      res.status(200).json({ data: result })
    } else {
      const getPosts = await db.collection('blocks').where('username', '==', username).get()
      getPosts.forEach((val) => {
        num_postes += 1
        num_liked += val.data().liked.length
      })

      const getData = await db.collection('users').where('username', '==', username).get()

      getData.forEach((val) => {
        result = val.data()
        result.user_id = val.id
      })

      result.num_postes = num_postes
      result.num_liked = num_liked

      res.status(200).json({ data: result })
    }
  } catch (error) {
    res.send(error)
  }
})

router.get('/viewprofile/post', middleware.checkToken, async (req, res) => {
  try {
    const { user_id, another_id } = req.query
    let allPost = []

    if (user_id && another_id) {
      const getData = await db.collection('blocks').where('author_id', '==', another_id).get()
      getData.forEach((val) => {
        allPost.push({ id: val.id, ...val.data() })
      })
    } else {
      const getData = await db.collection('blocks').where('author_id', '==', user_id).get()
      getData.forEach((val) => {
        allPost.push({ id: val.id, ...val.data() })
      })
    }

    allPost.map((val) => {
      val.isLiked = false
      if (val.liked.length > 0) {
        val.liked.map((obj) => {
          if (obj == user_id) {
            val.isLiked = true
          }
        })
      }
    })

    res.status(200).json({ data: allPost })
  } catch (error) {
    res.send(error)
  }
})

router.get('/viewprofile/liked', middleware.checkToken, async (req, res) => {
  try {
    const { user_id, another_id } = req.query
    let allPost = []

    if (user_id && another_id) {
      const getData = await db.collection('blocks').where('liked', 'array-contains', another_id).get()
      getData.forEach((val) => {
        allPost.push({ id: val.id, ...val.data() })
      })
    } else {
      const getData = await db.collection('blocks').where('liked', 'array-contains', user_id).get()
      getData.forEach((val) => {
        allPost.push({ id: val.id, ...val.data() })
      })
    }

    allPost.map((val) => {
      val.isLiked = false
      if (val.liked.length > 0) {
        val.liked.map((obj) => {
          if (obj == user_id) {
            val.isLiked = true
          }
        })
      }
    })

    res.status(200).json({ data: allPost })
  } catch (error) {
    res.send(error)
  }
})

router.patch('/liked', middleware.checkToken, async (req, res) => {
  try {
    const { block_id, user_id } = req.query
    let likes_blocks = []
    let likes_user = []

    const blocksRef = db.collection('blocks').doc(block_id)
    const getBlocks = await blocksRef.get()
    likes_blocks = getBlocks.data().liked
    likes_blocks.push(user_id)

    const userRef = db.collection('users').doc(user_id)
    const getUser = await userRef.get()
    likes_user = getUser.data().liked
    likes_user.push(block_id)

    await blocksRef.update({ liked: likes_blocks })
    await userRef.update({ liked: likes_user })

    res.status(200).json({ msg: 'Data successfully updated.' })
  } catch (error) {
    res.send(error)
  }
})

router.patch('/unliked', middleware.checkToken, async (req, res) => {
  try {
    const { block_id, user_id } = req.query
    let likes_blocks = []
    let likes_user = []

    const blocksRef = db.collection('blocks').doc(block_id)
    const getBlocks = await blocksRef.get()
    likes_blocks = getBlocks.data().liked
    likes_blocks.pop(user_id)

    const userRef = db.collection('users').doc(user_id)
    const getUser = await userRef.get()
    likes_user = getUser.data().liked
    likes_user.pop(block_id)

    await blocksRef.update({ liked: likes_blocks })
    await userRef.update({ liked: likes_user })

    res.status(200).json({ msg: 'Data successfully updated.' })
  } catch (error) {
    res.send(error)
  }
})

router.patch('/edit/:user_id', middleware.checkToken, async (req, res) => {
  try {
    const { user_id } = req.params
    const data = req.body

    const updateData = await db.collection('users').doc(user_id).update(data)

    res.status(200).json({ msg: 'Data successfully updated.' })
  } catch (error) {
    res.send(error)
  }
})

module.exports = router
